import { describe, expect, it } from 'vitest';
import {
  CUSTOMER_TIMELINE_STEPS,
  completedTimelineIndex,
  orderStateMachine,
  TERMINAL_STATUSES,
  transitionOrder,
  type OrderStatus,
} from './order-state-machine';
import type { Actor } from '@/lib/state-machine';

const customer: Actor = { kind: 'CUSTOMER', id: 'u-cust' };
const provider: Actor = { kind: 'PROVIDER', id: 'u-prov' };
const admin: Actor = { kind: 'PLATFORM', id: 'u-admin' };
const system: Actor = { kind: 'SYSTEM', id: null };

const step = (from: OrderStatus, to: OrderStatus, actor: Actor, reason?: string) =>
  transitionOrder({ orderId: 'o1', from, to, actor, ...(reason ? { reason } : {}) });

describe('order state machine', () => {
  it('walks the happy path to COMPLETED with the right actors', () => {
    const path: [OrderStatus, OrderStatus, Actor][] = [
      ['DRAFT', 'PENDING_CUSTOMER_DATA', customer],
      ['PENDING_CUSTOMER_DATA', 'PENDING_COVERAGE', customer],
      ['PENDING_COVERAGE', 'COVERAGE_VERIFIED', system],
      ['COVERAGE_VERIFIED', 'PENDING_PROVIDER_CONFIRMATION', system],
      ['PENDING_PROVIDER_CONFIRMATION', 'PENDING_PAYMENT', provider],
      ['PENDING_PAYMENT', 'PAYMENT_PROCESSING', system],
      ['PAYMENT_PROCESSING', 'PAID', system],
      ['PAID', 'PROVIDER_ASSIGNED', provider],
      ['PROVIDER_ASSIGNED', 'INSTALLATION_SCHEDULED', provider],
      ['INSTALLATION_SCHEDULED', 'INSTALLATION_IN_PROGRESS', provider],
      ['INSTALLATION_IN_PROGRESS', 'INSTALLATION_QC', provider],
      ['INSTALLATION_QC', 'ACTIVE', provider],
      ['ACTIVE', 'COMPLETED', system],
    ];
    for (const [from, to, actor] of path) {
      const h = step(from, to, actor);
      expect(h).toMatchObject({
        orderId: 'o1',
        fromStatus: from,
        toStatus: to,
        actorKind: actor.kind,
      });
    }
  });

  it('only SYSTEM (verified webhook) can mark an order PAID', () => {
    expect(() => step('PENDING_PAYMENT', 'PAID', admin)).toThrow(
      expect.objectContaining({ code: 'FORBIDDEN' }),
    );
    expect(() => step('PENDING_PAYMENT', 'PAID', customer)).toThrow(
      expect.objectContaining({ code: 'FORBIDDEN' }),
    );
    expect(step('PENDING_PAYMENT', 'PAID', system).toStatus).toBe('PAID');
  });

  it('rejects transitions that are not in the table', () => {
    expect(() => step('DRAFT', 'ACTIVE', admin)).toThrow(
      expect.objectContaining({ code: 'INVALID_STATE_TRANSITION' }),
    );
    expect(() => step('REFUNDED', 'PAID', system)).toThrow(
      expect.objectContaining({ code: 'INVALID_STATE_TRANSITION' }),
    );
  });

  it('requires a reason for exception paths', () => {
    expect(() => step('PENDING_PROVIDER_CONFIRMATION', 'REJECTED', provider)).toThrow(
      expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    );
    expect(() => step('PENDING_PROVIDER_CONFIRMATION', 'REJECTED', provider, '   ')).toThrow(
      expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    );
    expect(step('PENDING_PROVIDER_CONFIRMATION', 'REJECTED', provider, 'ODP full').reason).toBe(
      'ODP full',
    );
  });

  it('requires an actor id for non-system actors', () => {
    expect(() => step('DRAFT', 'PENDING_CUSTOMER_DATA', { kind: 'CUSTOMER', id: null })).toThrow(
      expect.objectContaining({ code: 'AUTH_REQUIRED' }),
    );
  });

  it('enforces provider pre-confirmation before payment by default (D5)', () => {
    expect(() => step('COVERAGE_VERIFIED', 'PENDING_PAYMENT', system)).toThrow(
      expect.objectContaining({ code: 'INVALID_STATE_TRANSITION' }),
    );
    const h = transitionOrder({
      orderId: 'o1',
      from: 'COVERAGE_VERIFIED',
      to: 'PENDING_PAYMENT',
      actor: system,
      policy: { requireProviderPreconfirmation: false },
    });
    expect(h.toStatus).toBe('PENDING_PAYMENT');
  });

  it('covers failure cases from the QA plan', () => {
    expect(step('PENDING_COVERAGE', 'COVERAGE_UNAVAILABLE', system, 'no zone').toStatus).toBe(
      'COVERAGE_UNAVAILABLE',
    );
    expect(step('PENDING_PAYMENT', 'PAYMENT_FAILED', system, 'gateway declined').toStatus).toBe(
      'PAYMENT_FAILED',
    );
    expect(step('PAYMENT_FAILED', 'PENDING_PAYMENT', customer).toStatus).toBe('PENDING_PAYMENT');
    expect(step('PENDING_PAYMENT', 'CANCELLED', customer, 'changed mind').toStatus).toBe(
      'CANCELLED',
    );
    expect(
      step('INSTALLATION_IN_PROGRESS', 'INSTALLATION_FAILED', provider, 'no line of sight')
        .toStatus,
    ).toBe('INSTALLATION_FAILED');
    expect(step('INSTALLATION_FAILED', 'REFUND_PENDING', customer, 'cannot install').toStatus).toBe(
      'REFUND_PENDING',
    );
    expect(step('REFUND_PENDING', 'REFUNDED', system).toStatus).toBe('REFUNDED');
    // A customer cannot simply cancel a paid order; it must go through a refund.
    expect(orderStateMachine.canTransition('PAID', 'CANCELLED', 'CUSTOMER')).toBe(false);
  });

  it('terminal statuses have no outgoing transitions', () => {
    for (const s of TERMINAL_STATUSES) {
      for (const kind of ['CUSTOMER', 'PROVIDER', 'PLATFORM', 'SYSTEM'] as const) {
        expect(orderStateMachine.allowedNext(s, kind)).toEqual([]);
      }
    }
  });

  it('maps statuses onto the customer timeline in the documented order', () => {
    expect(CUSTOMER_TIMELINE_STEPS[completedTimelineIndex('PENDING_COVERAGE')]).toBe(
      'ORDER_CREATED',
    );
    expect(CUSTOMER_TIMELINE_STEPS[completedTimelineIndex('PENDING_PAYMENT')]).toBe(
      'COVERAGE_VERIFIED',
    );
    expect(CUSTOMER_TIMELINE_STEPS[completedTimelineIndex('PAID')]).toBe('PAYMENT');
    expect(CUSTOMER_TIMELINE_STEPS[completedTimelineIndex('PROVIDER_ASSIGNED')]).toBe(
      'PROVIDER_CONFIRMED',
    );
    expect(CUSTOMER_TIMELINE_STEPS[completedTimelineIndex('ACTIVE')]).toBe('ACTIVATED');
    expect(completedTimelineIndex('CANCELLED')).toBe(-1);
  });
});
