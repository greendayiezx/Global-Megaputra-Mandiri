import { decide, type Decision } from '@/lib/decision';
import type { OrderStatus } from '@/modules/orders/domain/order-state-machine';
import type { PaymentStatus } from '@/modules/payments/domain/payment-rules';

/**
 * A subscription becomes ACTIVE together with the order's QC → ACTIVE transition, and only
 * when the money and the installation evidence are both in place.
 */
export function canActivateSubscription(input: {
  orderStatus: OrderStatus;
  initialPaymentStatus: PaymentStatus | null;
  installationQcPassedAt: Date | null;
}): Decision {
  const reasons: string[] = [];
  if (input.orderStatus !== 'INSTALLATION_QC') {
    reasons.push(`order must be in INSTALLATION_QC (is ${input.orderStatus})`);
  }
  if (input.initialPaymentStatus !== 'PAID') {
    reasons.push('initial payment is not settled');
  }
  if (input.installationQcPassedAt === null) {
    reasons.push('installation QC has not passed');
  }
  return decide('INVALID_STATE_TRANSITION', reasons);
}
