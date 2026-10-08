import { AppError } from '@/lib/errors';
import {
  applyBps,
  assertBasisPoints,
  assertRupiah,
  sum,
  type BasisPoints,
  type Rupiah,
} from '@/lib/money';

/**
 * Pricing engine (brief §13).
 *
 *   total = package_price + installation_fee + activation_fee + tax
 *           - promotion - discount + other_allowed_fee
 *
 * Rules:
 * - Every mandatory charge is a line from the first quote; nothing is revealed later.
 * - Percentage reductions are computed on the component's original amount (no compounding),
 *   promotions are applied before discounts, and a component can never go below zero.
 * - Tax is computed per group on the net taxable base, rounded half-up once per group.
 * - When `taxIncluded` is true, prices already contain tax: the tax figure is informational
 *   (the portion of the total that is tax) and is not added again.
 * - Tax rate and "first month charged today" are business policy (D3, D4) and must be
 *   configured; missing configuration blocks pricing instead of guessing.
 */

export type ChargeTarget = 'FIRST_MONTH' | 'INSTALLATION_FEE' | 'ACTIVATION_FEE';

export interface PackagePricing {
  monthlyPrice: Rupiah;
  installationFee: Rupiah;
  activationFee: Rupiah;
  taxIncluded: boolean;
}

export interface PriceReduction {
  kind: 'PROMOTION' | 'DISCOUNT';
  label: string;
  target: ChargeTarget;
  type: 'PERCENT' | 'FIXED';
  /** Basis points for PERCENT, rupiah for FIXED. */
  value: number;
  maxAmount?: Rupiah;
  sourceId?: string;
}

export interface OtherFee {
  label: string;
  amount: Rupiah;
  recurring: boolean;
  taxable: boolean;
}

export interface PricingPolicy {
  /** TODO_BUSINESS_DECISION D3 — from system_settings `tax.rate_bps`. */
  taxRateBps: BasisPoints | null;
  /** TODO_BUSINESS_DECISION D4 — from system_settings `billing.charge_first_month_upfront`. */
  chargeFirstMonthUpfront: boolean | null;
}

export interface PricingInput {
  package: PackagePricing;
  reductions?: readonly PriceReduction[];
  otherFees?: readonly OtherFee[];
  policy: PricingPolicy;
}

export type PriceLineKind =
  | 'MONTHLY_FEE'
  | 'INSTALLATION_FEE'
  | 'ACTIVATION_FEE'
  | 'OTHER_FEE'
  | 'PROMOTION'
  | 'DISCOUNT'
  | 'TAX';

export type PriceGroup = 'ONE_TIME' | 'FIRST_MONTH' | 'RECURRING';

export interface PriceLine {
  kind: PriceLineKind;
  group: PriceGroup;
  label: string;
  /** Negative for reductions. */
  amount: Rupiah;
  sourceId?: string;
}

export interface GroupTotal {
  /** Package charges before reductions. */
  charges: Rupiah;
  /** Total reductions as a positive number. */
  reductions: Rupiah;
  otherFees: Rupiah;
  /** Tax amount; when tax is included this is the tax portion already inside `total`. */
  tax: Rupiah;
  total: Rupiah;
}

export interface OrderTotal {
  lines: PriceLine[];
  oneTime: GroupTotal;
  firstMonth: GroupTotal;
  /** Standard monthly fee after any first-month promotion ends. */
  recurringMonthly: GroupTotal;
  firstMonthChargedToday: boolean;
  totalToday: Rupiah;
  taxToday: Rupiah;
  reductionsToday: Rupiah;
  taxIncluded: boolean;
  taxRateBps: BasisPoints;
}

const TARGET_LINE: Record<ChargeTarget, { kind: PriceLineKind; group: PriceGroup; label: string }> =
  {
    FIRST_MONTH: {
      kind: 'MONTHLY_FEE',
      group: 'FIRST_MONTH',
      label: 'Biaya langganan bulan pertama',
    },
    INSTALLATION_FEE: { kind: 'INSTALLATION_FEE', group: 'ONE_TIME', label: 'Biaya instalasi' },
    ACTIVATION_FEE: { kind: 'ACTIVATION_FEE', group: 'ONE_TIME', label: 'Biaya aktivasi' },
  };

export function calculateOrderTotal(input: PricingInput): OrderTotal {
  const { policy } = input;
  if (policy.taxRateBps === null || policy.chargeFirstMonthUpfront === null) {
    throw new AppError(
      'CONFIGURATION_MISSING',
      'Pricing policy is not configured yet. Please try again later.',
      {
        missing: policy.taxRateBps === null ? 'tax.rate_bps' : 'billing.charge_first_month_upfront',
      },
    );
  }
  const taxRateBps = assertBasisPoints(policy.taxRateBps, 'taxRateBps');
  const upfront = policy.chargeFirstMonthUpfront;
  const pkg = input.package;

  const base: Record<ChargeTarget, Rupiah> = {
    FIRST_MONTH: assertRupiah(pkg.monthlyPrice, 'monthlyPrice'),
    INSTALLATION_FEE: assertRupiah(pkg.installationFee, 'installationFee'),
    ACTIVATION_FEE: assertRupiah(pkg.activationFee, 'activationFee'),
  };
  if (base.FIRST_MONTH === 0) {
    throw new AppError('VALIDATION_ERROR', 'monthlyPrice must be greater than zero');
  }

  const lines: PriceLine[] = [];
  const remaining = { ...base };
  const reductionsByGroup: Record<PriceGroup, Rupiah> = {
    ONE_TIME: 0,
    FIRST_MONTH: 0,
    RECURRING: 0,
  };

  for (const target of Object.keys(base) as ChargeTarget[]) {
    if (base[target] > 0) {
      const meta = TARGET_LINE[target];
      lines.push({ kind: meta.kind, group: meta.group, label: meta.label, amount: base[target] });
    }
  }

  // Promotions first, then discounts; stable within each kind.
  const reductions = [...(input.reductions ?? [])].sort(
    (a, b) => Number(a.kind === 'DISCOUNT') - Number(b.kind === 'DISCOUNT'),
  );
  for (const r of reductions) {
    const raw =
      r.type === 'PERCENT'
        ? applyBps(base[r.target], assertBasisPoints(r.value, `${r.label}.value`))
        : assertRupiah(r.value, `${r.label}.value`);
    const capped = Math.min(
      raw,
      r.maxAmount === undefined ? raw : assertRupiah(r.maxAmount, `${r.label}.maxAmount`),
      remaining[r.target],
    );
    if (capped <= 0) continue;
    remaining[r.target] -= capped;
    const group = TARGET_LINE[r.target].group;
    reductionsByGroup[group] += capped;
    lines.push({
      kind: r.kind,
      group,
      label: r.label,
      amount: -capped,
      ...(r.sourceId ? { sourceId: r.sourceId } : {}),
    });
  }

  const fees = (input.otherFees ?? []).map((f) => ({
    ...f,
    amount: assertRupiah(f.amount, `${f.label}.amount`),
  }));
  for (const f of fees) {
    if (f.amount === 0) continue;
    lines.push({
      kind: 'OTHER_FEE',
      group: f.recurring ? 'FIRST_MONTH' : 'ONE_TIME',
      label: f.label,
      amount: f.amount,
    });
  }
  const oneTimeFees = fees.filter((f) => !f.recurring);
  const recurringFees = fees.filter((f) => f.recurring);

  const groupTotal = (
    charges: Rupiah,
    reductionsTotal: Rupiah,
    groupFees: typeof fees,
  ): GroupTotal => {
    const otherFees = sum(groupFees.map((f) => f.amount));
    const taxableBase =
      charges - reductionsTotal + sum(groupFees.filter((f) => f.taxable).map((f) => f.amount));
    const net = charges - reductionsTotal + otherFees;
    const tax = pkg.taxIncluded
      ? Math.round((taxableBase * taxRateBps) / (10_000 + taxRateBps))
      : applyBps(taxableBase, taxRateBps);
    return {
      charges,
      reductions: reductionsTotal,
      otherFees,
      tax,
      total: pkg.taxIncluded ? net : net + tax,
    };
  };

  const oneTime = groupTotal(
    base.INSTALLATION_FEE + base.ACTIVATION_FEE,
    reductionsByGroup.ONE_TIME,
    oneTimeFees,
  );
  const firstMonth = groupTotal(base.FIRST_MONTH, reductionsByGroup.FIRST_MONTH, recurringFees);
  const recurringMonthly = groupTotal(base.FIRST_MONTH, 0, recurringFees);

  if (!pkg.taxIncluded) {
    if (oneTime.tax > 0) {
      lines.push({ kind: 'TAX', group: 'ONE_TIME', label: 'Pajak', amount: oneTime.tax });
    }
    if (firstMonth.tax > 0) {
      lines.push({ kind: 'TAX', group: 'FIRST_MONTH', label: 'Pajak', amount: firstMonth.tax });
    }
  }

  return {
    lines,
    oneTime,
    firstMonth,
    recurringMonthly,
    firstMonthChargedToday: upfront,
    totalToday: oneTime.total + (upfront ? firstMonth.total : 0),
    taxToday: oneTime.tax + (upfront ? firstMonth.tax : 0),
    reductionsToday: oneTime.reductions + (upfront ? firstMonth.reductions : 0),
    taxIncluded: pkg.taxIncluded,
    taxRateBps,
  };
}
