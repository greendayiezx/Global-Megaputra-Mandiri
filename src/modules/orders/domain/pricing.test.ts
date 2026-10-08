import { describe, expect, it } from 'vitest';
import { AppError } from '@/lib/errors';
import { calculateOrderTotal, type PricingInput } from './pricing';

// Numbers below are arbitrary test fixtures, not real market prices.
const pkg = {
  monthlyPrice: 300_000,
  installationFee: 200_000,
  activationFee: 50_000,
  taxIncluded: false,
};
const policy = { taxRateBps: 1_100, chargeFirstMonthUpfront: true };

const quote = (overrides: Partial<PricingInput> = {}) =>
  calculateOrderTotal({ package: pkg, policy, ...overrides });

describe('calculateOrderTotal', () => {
  it('adds tax on top of exclusive prices and charges first month today', () => {
    const t = quote();
    expect(t.oneTime).toEqual({
      charges: 250_000,
      reductions: 0,
      otherFees: 0,
      tax: 27_500,
      total: 277_500,
    });
    expect(t.firstMonth.total).toBe(333_000);
    expect(t.totalToday).toBe(610_500);
    expect(t.taxToday).toBe(60_500);
    expect(t.recurringMonthly.total).toBe(333_000);
  });

  it('shows the first month separately when it is not charged up-front', () => {
    const t = quote({ policy: { ...policy, chargeFirstMonthUpfront: false } });
    expect(t.firstMonthChargedToday).toBe(false);
    expect(t.totalToday).toBe(277_500);
    expect(t.firstMonth.total).toBe(333_000);
  });

  it('treats tax-included prices as gross and only reports the tax portion', () => {
    const t = quote({ package: { ...pkg, taxIncluded: true } });
    expect(t.totalToday).toBe(550_000);
    // Per group, half-up: 250_000·1100/11100 → 24_775; 300_000·1100/11100 → 29_730.
    expect(t.taxToday).toBe(54_505);
    expect(t.lines.some((l) => l.kind === 'TAX')).toBe(false);
  });

  it('applies promotions before discounts and never below zero per component', () => {
    const t = quote({
      reductions: [
        {
          kind: 'DISCOUNT',
          label: 'Diskon',
          target: 'INSTALLATION_FEE',
          type: 'FIXED',
          value: 150_000,
        },
        {
          kind: 'PROMOTION',
          label: 'Promo',
          target: 'INSTALLATION_FEE',
          type: 'PERCENT',
          value: 5_000,
        },
      ],
    });
    // promo 50% of 200k = 100k; discount capped at the remaining 100k.
    const reductionLines = t.lines.filter((l) => l.amount < 0);
    expect(reductionLines.map((l) => [l.kind, l.amount])).toEqual([
      ['PROMOTION', -100_000],
      ['DISCOUNT', -100_000],
    ]);
    expect(t.oneTime.reductions).toBe(200_000);
    expect(t.oneTime.total).toBe(Math.round(50_000 * 1.11));
  });

  it('respects maxAmount on percentage promotions and computes tax after reductions', () => {
    const t = quote({
      reductions: [
        {
          kind: 'PROMOTION',
          label: 'Promo',
          target: 'FIRST_MONTH',
          type: 'PERCENT',
          value: 5_000,
          maxAmount: 100_000,
        },
      ],
    });
    expect(t.firstMonth.reductions).toBe(100_000);
    expect(t.firstMonth.tax).toBe(22_000);
    expect(t.firstMonth.total).toBe(222_000);
    // Promotions do not change the standard recurring fee.
    expect(t.recurringMonthly.total).toBe(333_000);
  });

  it('includes other fees with their own taxability', () => {
    const t = quote({
      otherFees: [
        { label: 'Biaya kabel tambahan', amount: 100_000, recurring: false, taxable: true },
        { label: 'Materai', amount: 10_000, recurring: false, taxable: false },
        { label: 'Sewa perangkat', amount: 20_000, recurring: true, taxable: true },
      ],
    });
    expect(t.oneTime.otherFees).toBe(110_000);
    expect(t.oneTime.tax).toBe(Math.round(350_000 * 0.11));
    expect(t.recurringMonthly.total).toBe(Math.round(320_000 * 1.11));
    expect(t.lines.filter((l) => l.kind === 'OTHER_FEE')).toHaveLength(3);
  });

  it('every mandatory charge appears as a line', () => {
    const kinds = quote().lines.map((l) => l.kind);
    expect(kinds).toEqual(
      expect.arrayContaining(['MONTHLY_FEE', 'INSTALLATION_FEE', 'ACTIVATION_FEE', 'TAX']),
    );
  });

  it('refuses to price without configured policy instead of guessing', () => {
    expect(() => quote({ policy: { taxRateBps: null, chargeFirstMonthUpfront: true } })).toThrow(
      expect.objectContaining({ code: 'CONFIGURATION_MISSING' }),
    );
    expect(() => quote({ policy: { taxRateBps: 1_100, chargeFirstMonthUpfront: null } })).toThrow(
      AppError,
    );
  });

  it('rejects non-integer or negative money', () => {
    expect(() => quote({ package: { ...pkg, installationFee: 10.5 } })).toThrow(
      expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    );
    expect(() => quote({ package: { ...pkg, monthlyPrice: 0 } })).toThrow(AppError);
  });
});
