import { AppError } from '@/lib/errors';
import {
  createStateMachine,
  type Actor,
  type ActorKind,
  type TransitionRule,
  type TransitionTable,
} from '@/lib/state-machine';

/** Order lifecycle (brief §11). */
export const ORDER_STATUSES = [
  'DRAFT',
  'PENDING_CUSTOMER_DATA',
  'PENDING_COVERAGE',
  'COVERAGE_VERIFIED',
  'PENDING_PROVIDER_CONFIRMATION',
  'PENDING_PAYMENT',
  'PAYMENT_PROCESSING',
  'PAID',
  'PROVIDER_ASSIGNED',
  'INSTALLATION_SCHEDULED',
  'INSTALLATION_IN_PROGRESS',
  'INSTALLATION_QC',
  'ACTIVE',
  'COMPLETED',
  // exceptions
  'CANCELLED',
  'REJECTED',
  'PAYMENT_FAILED',
  'COVERAGE_UNAVAILABLE',
  'INSTALLATION_FAILED',
  'REFUND_PENDING',
  'REFUNDED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

const C: ActorKind = 'CUSTOMER';
const P: ActorKind = 'PROVIDER';
const A: ActorKind = 'PLATFORM';
const S: ActorKind = 'SYSTEM';

const cancelByCustomerOrPlatform: TransitionRule = { actors: [C, A], requiresReason: true };

/**
 * Exhaustive transition table. Anything not listed is rejected.
 *
 * Payment outcomes (PAID / PAYMENT_FAILED) can only be set by SYSTEM, i.e. by the verified
 * webhook or reconciliation job — never by a person clicking a button.
 */
const TRANSITIONS: TransitionTable<OrderStatus> = {
  DRAFT: {
    PENDING_CUSTOMER_DATA: { actors: [C, A] },
    CANCELLED: cancelByCustomerOrPlatform,
  },
  PENDING_CUSTOMER_DATA: {
    PENDING_COVERAGE: { actors: [C, A] },
    CANCELLED: cancelByCustomerOrPlatform,
  },
  PENDING_COVERAGE: {
    // SYSTEM may verify only when the coverage engine returned AVAILABLE (guarded in application).
    COVERAGE_VERIFIED: { actors: [P, A, S] },
    COVERAGE_UNAVAILABLE: { actors: [P, A, S], requiresReason: true },
    CANCELLED: cancelByCustomerOrPlatform,
  },
  COVERAGE_VERIFIED: {
    PENDING_PROVIDER_CONFIRMATION: { actors: [C, A, S] },
    // Only allowed when policy `orders.require_provider_preconfirmation` is false (D5).
    PENDING_PAYMENT: { actors: [C, A, S] },
    CANCELLED: cancelByCustomerOrPlatform,
  },
  PENDING_PROVIDER_CONFIRMATION: {
    PENDING_PAYMENT: { actors: [P, A] },
    REJECTED: { actors: [P, A], requiresReason: true },
    COVERAGE_UNAVAILABLE: { actors: [P, A], requiresReason: true },
    CANCELLED: cancelByCustomerOrPlatform,
  },
  PENDING_PAYMENT: {
    PAYMENT_PROCESSING: { actors: [S] },
    PAID: { actors: [S] },
    PAYMENT_FAILED: { actors: [S], requiresReason: true },
    CANCELLED: { actors: [C, A, S], requiresReason: true },
  },
  PAYMENT_PROCESSING: {
    PAID: { actors: [S] },
    PAYMENT_FAILED: { actors: [S], requiresReason: true },
  },
  PAYMENT_FAILED: {
    PENDING_PAYMENT: { actors: [C, A] },
    CANCELLED: { actors: [C, A, S], requiresReason: true },
  },
  PAID: {
    PROVIDER_ASSIGNED: { actors: [P, A] },
    REFUND_PENDING: { actors: [C, A], requiresReason: true },
  },
  PROVIDER_ASSIGNED: {
    INSTALLATION_SCHEDULED: { actors: [P, A] },
    REFUND_PENDING: { actors: [C, A], requiresReason: true },
  },
  INSTALLATION_SCHEDULED: {
    INSTALLATION_IN_PROGRESS: { actors: [P, A] },
    INSTALLATION_FAILED: { actors: [P, A], requiresReason: true },
    REFUND_PENDING: { actors: [C, A], requiresReason: true },
  },
  INSTALLATION_IN_PROGRESS: {
    INSTALLATION_QC: { actors: [P, A] },
    INSTALLATION_FAILED: { actors: [P, A], requiresReason: true },
  },
  INSTALLATION_QC: {
    ACTIVE: { actors: [P, A] },
    // QC rejected: back to the field for rework.
    INSTALLATION_IN_PROGRESS: { actors: [P, A], requiresReason: true },
    INSTALLATION_FAILED: { actors: [P, A], requiresReason: true },
  },
  INSTALLATION_FAILED: {
    INSTALLATION_SCHEDULED: { actors: [P, A] },
    REFUND_PENDING: { actors: [C, A], requiresReason: true },
  },
  ACTIVE: {
    COMPLETED: { actors: [A, S] },
  },
  REFUND_PENDING: {
    // TODO_BUSINESS_DECISION D6: path when a refund request is denied.
    REFUNDED: { actors: [S, A] },
  },
};

export const TERMINAL_STATUSES: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
  'COMPLETED',
  'CANCELLED',
  'REJECTED',
  'COVERAGE_UNAVAILABLE',
  'REFUNDED',
]);

export const orderStateMachine = createStateMachine('order', TRANSITIONS);

export interface OrderPolicy {
  /**
   * TODO_BUSINESS_DECISION D5. Default true: the provider confirms feasibility before the
   * customer is asked to pay, so nobody pays for an installation that cannot happen.
   */
  requireProviderPreconfirmation: boolean;
}

export const DEFAULT_ORDER_POLICY: OrderPolicy = { requireProviderPreconfirmation: true };

export interface OrderTransitionRequest {
  orderId: string;
  from: OrderStatus;
  to: OrderStatus;
  actor: Actor;
  reason?: string;
  metadata?: Record<string, unknown>;
  policy?: OrderPolicy;
}

/** Row to insert into `order_status_history` in the same transaction as the status update. */
export interface OrderStatusHistoryDraft {
  orderId: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  actorId: string | null;
  actorKind: ActorKind;
  reason: string | null;
  metadata: Record<string, unknown>;
}

export function transitionOrder(req: OrderTransitionRequest): OrderStatusHistoryDraft {
  const policy = req.policy ?? DEFAULT_ORDER_POLICY;
  if (
    policy.requireProviderPreconfirmation &&
    req.from === 'COVERAGE_VERIFIED' &&
    req.to === 'PENDING_PAYMENT'
  ) {
    throw new AppError(
      'INVALID_STATE_TRANSITION',
      'The provider must confirm this order before payment.',
      { from: req.from, to: req.to, policy: 'requireProviderPreconfirmation' },
    );
  }
  const { reason } = orderStateMachine.validate(req.from, req.to, req.actor, req.reason);
  return {
    orderId: req.orderId,
    fromStatus: req.from,
    toStatus: req.to,
    actorId: req.actor.id,
    actorKind: req.actor.kind,
    reason,
    metadata: req.metadata ?? {},
  };
}

/** Customer-facing timeline (brief §14). Internal states collapse into these steps. */
export const CUSTOMER_TIMELINE_STEPS = [
  'ORDER_CREATED',
  'COVERAGE_VERIFIED',
  'PAYMENT',
  'PROVIDER_CONFIRMED',
  'INSTALLATION_SCHEDULED',
  'INSTALLATION',
  'ACTIVATED',
] as const;
export type CustomerTimelineStep = (typeof CUSTOMER_TIMELINE_STEPS)[number];

const STEP_REACHED_BY: Record<OrderStatus, CustomerTimelineStep | null> = {
  DRAFT: null,
  PENDING_CUSTOMER_DATA: null,
  PENDING_COVERAGE: 'ORDER_CREATED',
  COVERAGE_VERIFIED: 'COVERAGE_VERIFIED',
  PENDING_PROVIDER_CONFIRMATION: 'COVERAGE_VERIFIED',
  // Pre-payment feasibility confirmation (D5) is shown as a sub-step of coverage.
  PENDING_PAYMENT: 'COVERAGE_VERIFIED',
  PAYMENT_PROCESSING: 'COVERAGE_VERIFIED',
  PAYMENT_FAILED: 'COVERAGE_VERIFIED',
  PAID: 'PAYMENT',
  PROVIDER_ASSIGNED: 'PROVIDER_CONFIRMED',
  INSTALLATION_SCHEDULED: 'INSTALLATION_SCHEDULED',
  INSTALLATION_IN_PROGRESS: 'INSTALLATION',
  INSTALLATION_QC: 'INSTALLATION',
  INSTALLATION_FAILED: 'INSTALLATION_SCHEDULED',
  ACTIVE: 'ACTIVATED',
  COMPLETED: 'ACTIVATED',
  CANCELLED: null,
  REJECTED: null,
  COVERAGE_UNAVAILABLE: null,
  REFUND_PENDING: null,
  REFUNDED: null,
};

/**
 * Index of the last completed timeline step, or -1 when none is reached yet.
 * Exception states return -1 here; the UI renders them from the status history instead.
 */
export function completedTimelineIndex(status: OrderStatus): number {
  const step = STEP_REACHED_BY[status];
  return step ? CUSTOMER_TIMELINE_STEPS.indexOf(step) : -1;
}
