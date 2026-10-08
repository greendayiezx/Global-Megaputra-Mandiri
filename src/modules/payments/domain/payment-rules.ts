import { decide, type Decision } from '@/lib/decision';
import type { ErrorCode } from '@/lib/errors';
import type { Rupiah } from '@/lib/money';
import type { OrderStatus } from '@/modules/orders/domain/order-state-machine';

export const PAYMENT_STATUSES = [
  'PENDING',
  'PAID',
  'FAILED',
  'EXPIRED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Outcome reported by a gateway (webhook or status poll), already normalised by the adapter. */
export interface GatewayPaymentOutcome {
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';
  amount: Rupiah;
  currency: string;
}

export type PaymentReduction =
  | { kind: 'APPLY'; next: PaymentStatus; requiresReview: boolean }
  | { kind: 'IGNORE'; reason: 'DUPLICATE' | 'STALE_EVENT' }
  | { kind: 'REJECT'; code: ErrorCode; reason: string };

/**
 * Applies a gateway outcome to a payment. Pure and monotonic so that duplicate and
 * out-of-order webhooks are harmless (idempotency layer 2; layer 1 is the unique
 * (gateway, event_id) constraint on payment_webhooks).
 *
 * - Once PAID, later PENDING/FAILED/EXPIRED events are stale and ignored.
 * - Money received after FAILED/EXPIRED is still recorded as PAID (the money exists),
 *   but flagged for manual review because the order may already be cancelled.
 * - A PAID event whose amount or currency differs from what we charged is rejected and
 *   must be reconciled manually — the payment is never marked paid with a wrong amount.
 * - Refund states are driven by refund records, not by charge webhooks.
 */
export function reducePaymentStatus(
  current: PaymentStatus,
  expected: { amount: Rupiah; currency: string },
  outcome: GatewayPaymentOutcome,
): PaymentReduction {
  if (
    outcome.status === 'PAID' &&
    (outcome.amount !== expected.amount || outcome.currency !== expected.currency)
  ) {
    return {
      kind: 'REJECT',
      code: 'PAYMENT_AMOUNT_MISMATCH',
      reason: 'Gateway amount/currency does not match the payment record',
    };
  }
  if (outcome.status === current) return { kind: 'IGNORE', reason: 'DUPLICATE' };

  switch (current) {
    case 'PENDING':
      return { kind: 'APPLY', next: outcome.status, requiresReview: false };
    case 'FAILED':
    case 'EXPIRED':
      return outcome.status === 'PAID'
        ? { kind: 'APPLY', next: 'PAID', requiresReview: true }
        : { kind: 'IGNORE', reason: 'STALE_EVENT' };
    case 'PAID':
    case 'REFUNDED':
    case 'PARTIALLY_REFUNDED':
      return { kind: 'IGNORE', reason: 'STALE_EVENT' };
  }
}

/** Refund status derived from the sum of successful refund transactions. */
export function statusAfterRefunds(paidAmount: Rupiah, refundedAmount: Rupiah): PaymentStatus {
  if (refundedAmount <= 0) return 'PAID';
  return refundedAmount >= paidAmount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
}

export interface RefundPolicy {
  /** TODO_BUSINESS_DECISION D6. Default false. */
  allowAfterActivation: boolean;
}

const POST_ACTIVATION: ReadonlySet<OrderStatus> = new Set(['ACTIVE', 'COMPLETED']);

export function canCreateRefund(input: {
  payment: { status: PaymentStatus; amount: Rupiah; refundedAmount: Rupiah };
  orderStatus: OrderStatus;
  requestedAmount: Rupiah;
  policy: RefundPolicy;
}): Decision {
  const { payment, requestedAmount } = input;
  const reasons: string[] = [];
  if (payment.status !== 'PAID' && payment.status !== 'PARTIALLY_REFUNDED') {
    reasons.push(`payment is ${payment.status}`);
  }
  if (!Number.isSafeInteger(requestedAmount) || requestedAmount <= 0) {
    reasons.push('refund amount must be a positive integer');
  } else if (requestedAmount > payment.amount - payment.refundedAmount) {
    reasons.push('refund amount exceeds the refundable balance');
  }
  if (POST_ACTIVATION.has(input.orderStatus) && !input.policy.allowAfterActivation) {
    reasons.push('refunds after activation are not allowed by policy');
  }
  return decide('REFUND_NOT_ALLOWED', reasons);
}

/**
 * Four-eyes rule for money-moving admin actions (refund, payout, commission adjustment,
 * price override): the approver must be a different person from the requester.
 */
export function canApproveFinancialAction(requestedBy: string, approverId: string): Decision {
  return requestedBy !== approverId
    ? { ok: true }
    : { ok: false, code: 'FORBIDDEN', reasons: ['requester cannot approve their own request'] };
}
