import { describe, expect, it } from 'vitest';
import {
  canApproveFinancialAction,
  canCreateRefund,
  reducePaymentStatus,
  statusAfterRefunds,
} from './payment-rules';

const expected = { amount: 610_500, currency: 'IDR' };
const paid = { status: 'PAID' as const, amount: 610_500, currency: 'IDR' };

describe('reducePaymentStatus (webhook idempotency)', () => {
  it('applies the first terminal outcome from PENDING', () => {
    expect(reducePaymentStatus('PENDING', expected, paid)).toEqual({
      kind: 'APPLY',
      next: 'PAID',
      requiresReview: false,
    });
    expect(reducePaymentStatus('PENDING', expected, { ...paid, status: 'EXPIRED' })).toMatchObject({
      kind: 'APPLY',
      next: 'EXPIRED',
    });
  });

  it('ignores duplicate webhooks', () => {
    expect(reducePaymentStatus('PAID', expected, paid)).toEqual({
      kind: 'IGNORE',
      reason: 'DUPLICATE',
    });
  });

  it('ignores stale events that arrive after PAID', () => {
    expect(reducePaymentStatus('PAID', expected, { ...paid, status: 'EXPIRED' })).toEqual({
      kind: 'IGNORE',
      reason: 'STALE_EVENT',
    });
    expect(reducePaymentStatus('REFUNDED', expected, { ...paid, status: 'PENDING' })).toMatchObject(
      {
        kind: 'IGNORE',
      },
    );
  });

  it('records late money after expiry but flags it for review', () => {
    expect(reducePaymentStatus('EXPIRED', expected, paid)).toEqual({
      kind: 'APPLY',
      next: 'PAID',
      requiresReview: true,
    });
  });

  it('never marks a payment PAID with a mismatched amount or currency', () => {
    expect(reducePaymentStatus('PENDING', expected, { ...paid, amount: 1 })).toMatchObject({
      kind: 'REJECT',
      code: 'PAYMENT_AMOUNT_MISMATCH',
    });
    expect(reducePaymentStatus('PENDING', expected, { ...paid, currency: 'USD' })).toMatchObject({
      kind: 'REJECT',
    });
  });
});

describe('refunds', () => {
  const payment = { status: 'PAID' as const, amount: 500_000, refundedAmount: 0 };
  const policy = { allowAfterActivation: false };

  it('derives refund status from refunded total', () => {
    expect(statusAfterRefunds(500_000, 0)).toBe('PAID');
    expect(statusAfterRefunds(500_000, 100_000)).toBe('PARTIALLY_REFUNDED');
    expect(statusAfterRefunds(500_000, 500_000)).toBe('REFUNDED');
  });

  it('allows a refund within the refundable balance before activation', () => {
    expect(
      canCreateRefund({
        payment,
        orderStatus: 'INSTALLATION_FAILED',
        requestedAmount: 500_000,
        policy,
      }),
    ).toEqual({
      ok: true,
    });
  });

  it('blocks over-refunds, unpaid payments and post-activation refunds by default', () => {
    const over = canCreateRefund({
      payment: { ...payment, refundedAmount: 400_000, status: 'PARTIALLY_REFUNDED' },
      orderStatus: 'REFUND_PENDING',
      requestedAmount: 200_000,
      policy,
    });
    expect(over).toMatchObject({ ok: false, code: 'REFUND_NOT_ALLOWED' });

    expect(
      canCreateRefund({
        payment: { ...payment, status: 'PENDING' },
        orderStatus: 'PENDING_PAYMENT',
        requestedAmount: 1,
        policy,
      }),
    ).toMatchObject({ ok: false });

    expect(
      canCreateRefund({ payment, orderStatus: 'ACTIVE', requestedAmount: 1, policy }),
    ).toMatchObject({ ok: false });
    expect(
      canCreateRefund({
        payment,
        orderStatus: 'ACTIVE',
        requestedAmount: 1,
        policy: { allowAfterActivation: true },
      }),
    ).toEqual({ ok: true });
  });

  it('enforces four-eyes approval on money-moving actions', () => {
    expect(canApproveFinancialAction('u1', 'u1')).toMatchObject({ ok: false, code: 'FORBIDDEN' });
    expect(canApproveFinancialAction('u1', 'u2')).toEqual({ ok: true });
  });
});
