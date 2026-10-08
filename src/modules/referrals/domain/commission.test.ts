import { describe, expect, it } from 'vitest';
import { calculateCommission, type CommissionRule } from './commission';

// Rule values are test fixtures; real rules are configured by Admin (D2/D11).
const rule: CommissionRule = {
  id: 'r1',
  basis: 'FIRST_MONTH_FEE',
  type: 'PERCENT',
  value: 1_000,
  cap: null,
  effectiveFrom: new Date('2026-01-01'),
  effectiveTo: null,
};
const amounts = { firstMonthFee: 300_000, orderTotal: 550_000 };
const at = new Date('2026-10-08');

describe('calculateCommission', () => {
  it('computes percentage of the configured basis', () => {
    expect(calculateCommission(rule, amounts, at)).toBe(30_000);
    expect(calculateCommission({ ...rule, basis: 'ORDER_TOTAL' }, amounts, at)).toBe(55_000);
  });

  it('applies caps and flat amounts', () => {
    expect(calculateCommission({ ...rule, cap: 20_000 }, amounts, at)).toBe(20_000);
    expect(
      calculateCommission(
        { ...rule, basis: 'FLAT_PER_ACTIVATION', type: 'FIXED', value: 75_000 },
        amounts,
        at,
      ),
    ).toBe(75_000);
  });

  it('refuses rules that are not effective at activation time', () => {
    expect(() =>
      calculateCommission({ ...rule, effectiveTo: new Date('2026-06-01') }, amounts, at),
    ).toThrow(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
  });
});
