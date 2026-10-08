import type { Rupiah } from '@/lib/money';
import type { GatewayPaymentOutcome } from './payment-rules';

/**
 * Gateway-agnostic payment port (brief §12). Business logic depends only on this
 * interface; concrete adapters (Midtrans, Xendit, a test fake) live in
 * `payments/infrastructure` and are selected by the `PAYMENT_GATEWAY` env var.
 *
 * Adapters must never receive or return card numbers, CVV, or other raw credentials —
 * the customer pays on the gateway's hosted page / VA / QRIS.
 */
export interface PaymentProvider {
  readonly gateway: string;

  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;

  getPaymentStatus(gatewayRef: string): Promise<GatewayPaymentOutcome>;

  /** Verifies authenticity (signature / token) using the raw, unparsed request body. */
  verifyWebhook(request: RawWebhookRequest): Promise<boolean>;

  /** Parses an already-verified webhook into a normalised event. */
  parseWebhook(request: RawWebhookRequest): GatewayWebhookEvent;

  refundPayment(input: RefundInput): Promise<RefundResult>;
}

export interface CreatePaymentInput {
  /** Our payment id; also sent to the gateway as its order/reference id. */
  paymentId: string;
  amount: Rupiah;
  currency: 'IDR';
  /** Shown on the gateway page. No PII beyond what the gateway requires. */
  description: string;
  customer: { name: string; email: string; phone: string };
  expiresAt: Date;
  successRedirectUrl: string;
  failureRedirectUrl: string;
  idempotencyKey: string;
}

export interface CreatePaymentResult {
  gatewayRef: string;
  checkoutUrl: string;
  expiresAt: Date;
}

export interface RawWebhookRequest {
  headers: Record<string, string>;
  rawBody: string;
}

export interface GatewayWebhookEvent {
  /** Unique per gateway event; used for the (gateway, event_id) dedupe constraint. */
  eventId: string;
  gatewayRef: string;
  /** Our payment id as echoed back by the gateway. */
  paymentId: string;
  outcome: GatewayPaymentOutcome;
  /** Raw gateway status string, stored for reconciliation. */
  rawStatus: string;
  occurredAt: Date;
}

export interface RefundInput {
  gatewayRef: string;
  refundId: string;
  amount: Rupiah;
  reason: string;
  idempotencyKey: string;
}

export interface RefundResult {
  gatewayRefundRef: string;
  status: 'PROCESSING' | 'SUCCEEDED' | 'FAILED';
}
