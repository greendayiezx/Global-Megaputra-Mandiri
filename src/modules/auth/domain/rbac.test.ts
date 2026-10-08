import { describe, expect, it } from 'vitest';
import {
  authorize,
  can,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLES,
  scopeFor,
  type Actor,
  type RoleKey,
} from './rbac';

const actor = (roles: RoleKey[], providerId: string | null = null, userId = 'u1'): Actor => ({
  userId,
  roles,
  providerId,
});

describe('RBAC matrix', () => {
  it('defines every role from the brief', () => {
    expect(Object.keys(ROLES).sort()).toEqual(
      [
        'SUPER_ADMIN',
        'ADMIN',
        'CUSTOMER_SUPPORT',
        'FINANCE',
        'SALES',
        'PROVIDER_OWNER',
        'PROVIDER_ADMIN',
        'PROVIDER_SALES',
        'PROVIDER_TECHNICIAN',
        'CUSTOMER',
        'REFERRAL_PARTNER',
      ].sort(),
    );
  });

  it('gives every role at least one explicit permission', () => {
    for (const role of Object.keys(ROLES) as RoleKey[]) {
      expect(ROLE_PERMISSIONS[role].length, role).toBeGreaterThan(0);
    }
  });

  it('never gives provider or customer roles platform-wide permissions', () => {
    for (const role of [
      'PROVIDER_OWNER',
      'PROVIDER_ADMIN',
      'PROVIDER_SALES',
      'PROVIDER_TECHNICIAN',
      'CUSTOMER',
      'REFERRAL_PARTNER',
    ] as RoleKey[]) {
      expect(
        ROLE_PERMISSIONS[role].filter((k) => k.endsWith('.any')),
        role,
      ).toEqual([]);
    }
  });

  it('reserves money approvals and role assignment for the right roles', () => {
    expect(can(actor(['ADMIN']), 'refund.approve')).toBe(false);
    expect(can(actor(['FINANCE']), 'refund.approve')).toBe(true);
    expect(can(actor(['ADMIN']), 'user.role.assign')).toBe(false);
    expect(can(actor(['SUPER_ADMIN']), 'user.role.assign')).toBe(true);
    expect(can(actor(['ADMIN']), 'settings.manage')).toBe(false);
  });

  it('only GMM staff can verify providers or publish packages', () => {
    expect(can(actor(['PROVIDER_OWNER'], 'p1'), 'provider.verify')).toBe(false);
    expect(can(actor(['PROVIDER_OWNER'], 'p1'), 'package.publish')).toBe(false);
    expect(can(actor(['ADMIN']), 'provider.verify')).toBe(true);
  });

  it('keys are unique', () => {
    const keys = PERMISSIONS.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('scoped authorization', () => {
  it('customers can only read their own orders', () => {
    const c = actor(['CUSTOMER'], null, 'cust-1');
    expect(can(c, 'order.read', { ownerUserId: 'cust-1' })).toBe(true);
    expect(can(c, 'order.read', { ownerUserId: 'cust-2' })).toBe(false);
    expect(scopeFor(c, 'order.read')).toBe('own');
  });

  it('provider staff are confined to their provider', () => {
    const p = actor(['PROVIDER_ADMIN'], 'prov-A');
    expect(can(p, 'order.read', { providerId: 'prov-A' })).toBe(true);
    expect(can(p, 'order.read', { providerId: 'prov-B' })).toBe(false);
    expect(scopeFor(p, 'order.read')).toBe('provider');
  });

  it('a provider role without provider membership grants nothing', () => {
    const orphan = actor(['PROVIDER_OWNER'], null);
    expect(can(orphan, 'dashboard.provider')).toBe(false);
    expect(scopeFor(orphan, 'order.read')).toBeNull();
  });

  it('technicians cannot confirm orders or manage packages', () => {
    const t = actor(['PROVIDER_TECHNICIAN'], 'prov-A');
    expect(can(t, 'installation.manage', { providerId: 'prov-A' })).toBe(true);
    expect(can(t, 'order.confirm', { providerId: 'prov-A' })).toBe(false);
    expect(can(t, 'package.manage', { providerId: 'prov-A' })).toBe(false);
  });

  it('platform staff with .any see everything', () => {
    expect(
      can(actor(['CUSTOMER_SUPPORT']), 'order.read', { ownerUserId: 'x', providerId: 'y' }),
    ).toBe(true);
    expect(scopeFor(actor(['CUSTOMER_SUPPORT']), 'order.read')).toBe('any');
  });

  it('anonymous users are asked to log in; others are forbidden', () => {
    expect(authorize(null, 'order.read')).toMatchObject({ ok: false, code: 'AUTH_REQUIRED' });
    expect(authorize(actor(['CUSTOMER']), 'audit.read')).toMatchObject({
      ok: false,
      code: 'FORBIDDEN',
    });
  });

  it('internal ticket notes are not available to customers', () => {
    expect(can(actor(['CUSTOMER']), 'ticket.internal_note')).toBe(false);
  });
});
