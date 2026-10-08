import { AppError } from '@/lib/errors';
import { applyBps, assertBasisPoints, assertRupiah, type Rupiah } from '@/lib/money';

/**
 * Commission calculation. Rules are data (`commission_rules`), configured by Admin.
 * No rule values are seeded: the revenue model is TODO_BUSINESS_DECISION D2 / D11.
 */
export type CommissionBasis = 'FIRST_MONTH_FEE' | 'ORDER_TOTAL' | 'FLAT_PER_ACTIVATION';

export interface CommissionRule {
  id: string;
  basis: CommissionBasis;
  type: 'PERCENT' | 'FIXED';
  /** Basis points for PERCENT, rupiah for FIXED. */
  value: number;
  cap: Rupiah | null;
  effectiveFrom: Date;
  effectiveTo: Date | null;
}

export interface CommissionBasisAmounts {
  /** Net first-month fee after promotions, excluding tax. */
  firstMonthFee: Rupiah;
  /** Net order total paid today, excluding tax. */
  orderTotal: Rupiah;
}

export function calculateCommission(
  rule: CommissionRule,
  amounts: CommissionBasisAmounts,
  activatedAt: Date,
): Rupiah {
  const t = activatedAt.getTime();
  if (t < rule.effectiveFrom.getTime() || (rule.effectiveTo && t >= rule.effectiveTo.getTime())) {
    throw new AppError('VALIDATION_ERROR', 'Commission rule is not effective at activation time', {
      ruleId: rule.id,
    });
  }

  let amount: Rupiah;
  if (rule.basis === 'FLAT_PER_ACTIVATION' || rule.type === 'FIXED') {
    amount = assertRupiah(rule.value, 'commission value');
  } else {
    const base = rule.basis === 'FIRST_MONTH_FEE' ? amounts.firstMonthFee : amounts.orderTotal;
    amount = applyBps(
      assertRupiah(base, 'commission base'),
      assertBasisPoints(rule.value, 'commission value'),
    );
  }
  return rule.cap === null ? amount : Math.min(amount, assertRupiah(rule.cap, 'commission cap'));
}
