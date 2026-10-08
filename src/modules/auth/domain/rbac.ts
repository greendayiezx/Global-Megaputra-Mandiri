import { decide, type Decision } from '@/lib/decision';

/**
 * Role-based access control (brief §3). Single source of truth: the database tables
 * `roles`, `permissions`, `role_permissions` are synced from this file on startup/seed,
 * and docs/06-rbac-matrix.md is generated from it (`npm run docs:rbac`).
 *
 * A permission key is `<action>.<scope>`:
 *   any      — platform-wide (GMM staff)
 *   provider — only resources belonging to the actor's provider
 *   own      — only resources owned by the actor
 * Callers ask `can(actor, 'order.read', resource)`; the scope is resolved here.
 */

export const ROLES = {
  SUPER_ADMIN: {
    scope: 'PLATFORM',
    name: 'Super Admin',
    description: 'Akses penuh, termasuk pengaturan sistem dan penetapan role.',
  },
  ADMIN: {
    scope: 'PLATFORM',
    name: 'Admin',
    description: 'Operasional marketplace: provider, paket, coverage, pesanan, konten.',
  },
  CUSTOMER_SUPPORT: {
    scope: 'PLATFORM',
    name: 'Customer Support',
    description: 'Menangani tiket, pesanan, dan instalasi pelanggan.',
  },
  FINANCE: {
    scope: 'PLATFORM',
    name: 'Finance',
    description: 'Pembayaran, refund, komisi, dan payout.',
  },
  SALES: {
    scope: 'PLATFORM',
    name: 'Sales',
    description: 'Leads, akuisisi provider, dan referral.',
  },
  PROVIDER_OWNER: {
    scope: 'PROVIDER',
    name: 'Pemilik Provider',
    description: 'Akses penuh atas data providernya, termasuk pengguna.',
  },
  PROVIDER_ADMIN: {
    scope: 'PROVIDER',
    name: 'Admin Provider',
    description: 'Mengelola paket, coverage, pesanan, dan instalasi provider.',
  },
  PROVIDER_SALES: {
    scope: 'PROVIDER',
    name: 'Sales Provider',
    description: 'Leads dan konfirmasi pesanan provider.',
  },
  PROVIDER_TECHNICIAN: {
    scope: 'PROVIDER',
    name: 'Teknisi Provider',
    description: 'Jadwal dan pelaksanaan instalasi.',
  },
  CUSTOMER: {
    scope: 'CUSTOMER',
    name: 'Pelanggan',
    description: 'Memesan dan memantau layanan miliknya.',
  },
  REFERRAL_PARTNER: {
    scope: 'PARTNER',
    name: 'Mitra Referral',
    description: 'Melihat referral dan komisinya (Fase 3).',
  },
} as const;

export type RoleKey = keyof typeof ROLES;
export type Scope = 'any' | 'provider' | 'own';

/** action → allowed scopes + description. */
const ACTIONS = {
  'dashboard.platform': { scopes: ['any'], description: 'Membuka portal admin GMM' },
  'dashboard.provider': { scopes: ['provider'], description: 'Membuka portal provider' },
  'dashboard.customer': { scopes: ['own'], description: 'Membuka dashboard pelanggan' },

  'provider.apply': { scopes: ['own'], description: 'Mendaftarkan perusahaan sebagai provider' },
  'provider.read': {
    scopes: ['provider', 'any'],
    description: 'Melihat data provider (termasuk non-publik)',
  },
  'provider.update': { scopes: ['provider', 'any'], description: 'Mengubah profil provider' },
  'provider.verify': { scopes: ['any'], description: 'Menyetujui / menolak verifikasi provider' },
  'provider.suspend': { scopes: ['any'], description: 'Menangguhkan provider' },
  'provider_document.upload': { scopes: ['provider'], description: 'Mengunggah dokumen legal' },
  'provider_document.read': {
    scopes: ['provider', 'any'],
    description: 'Membuka dokumen legal (signed URL)',
  },
  'provider_document.verify': { scopes: ['any'], description: 'Memverifikasi dokumen legal' },
  'provider_user.manage': {
    scopes: ['provider', 'any'],
    description: 'Mengelola pengguna provider',
  },

  'package.manage': { scopes: ['provider', 'any'], description: 'Membuat / mengubah paket' },
  'package.submit': { scopes: ['provider', 'any'], description: 'Mengajukan paket untuk ditinjau' },
  'package.publish': { scopes: ['any'], description: 'Menerbitkan / menangguhkan paket' },
  'coverage.manage': { scopes: ['provider', 'any'], description: 'Mengelola area layanan' },

  'order.create': { scopes: ['own'], description: 'Membuat pesanan' },
  'order.read': { scopes: ['own', 'provider', 'any'], description: 'Melihat pesanan' },
  'order.cancel': { scopes: ['own', 'any'], description: 'Membatalkan pesanan (sebelum dibayar)' },
  'order.confirm': { scopes: ['provider', 'any'], description: 'Konfirmasi / tolak pesanan' },
  'installation.manage': {
    scopes: ['provider', 'any'],
    description: 'Menjadwalkan dan memperbarui instalasi',
  },

  'payment.read': { scopes: ['own', 'provider', 'any'], description: 'Melihat status pembayaran' },
  'refund.request': { scopes: ['own', 'any'], description: 'Mengajukan refund' },
  'refund.approve': { scopes: ['any'], description: 'Menyetujui refund (four-eyes)' },
  'commission.read': { scopes: ['provider', 'any'], description: 'Melihat komisi' },
  'commission.manage': { scopes: ['any'], description: 'Mengatur aturan & penyesuaian komisi' },
  'payout.approve': { scopes: ['any'], description: 'Menyetujui payout (four-eyes)' },

  'ticket.create': { scopes: ['own'], description: 'Membuat tiket bantuan' },
  'ticket.read': { scopes: ['own', 'provider', 'any'], description: 'Melihat tiket' },
  'ticket.reply': { scopes: ['own', 'provider', 'any'], description: 'Membalas tiket' },
  'ticket.internal_note': {
    scopes: ['provider', 'any'],
    description: 'Menulis catatan internal (tidak terlihat pelanggan)',
  },
  'ticket.assign': { scopes: ['any'], description: 'Menugaskan tiket' },

  'review.create': { scopes: ['own'], description: 'Menulis ulasan' },
  'review.moderate': { scopes: ['any'], description: 'Moderasi ulasan' },
  'customer.read': {
    scopes: ['provider', 'any'],
    description: 'Melihat data pelanggan (seperlunya)',
  },
  'data.export': { scopes: ['any'], description: 'Mengekspor data (diaudit)' },
  'lead.read': {
    scopes: ['provider', 'any'],
    description: 'Melihat leads (dengan persetujuan pelanggan)',
  },
  'lead.manage': { scopes: ['any'], description: 'Mengelola & menugaskan leads' },
  'referral.read': { scopes: ['own', 'any'], description: 'Melihat referral' },
  'referral.manage': { scopes: ['any'], description: 'Mengelola program referral' },
  'analytics.read': { scopes: ['provider', 'any'], description: 'Melihat analitik' },

  'content.manage': { scopes: ['any'], description: 'CMS, FAQ, blog, promo, banner' },
  'user.manage': { scopes: ['any'], description: 'Mengelola akun pengguna' },
  'user.role.assign': { scopes: ['any'], description: 'Menetapkan / mencabut role' },
  'settings.manage': {
    scopes: ['any'],
    description: 'Mengubah pengaturan sistem (pajak, kebijakan)',
  },
  'audit.read': { scopes: ['any'], description: 'Membaca audit log' },
} as const satisfies Record<string, { scopes: readonly Scope[]; description: string }>;

export type Action = keyof typeof ACTIONS;
export type PermissionKey = `${Action}.${Scope}`;

export const PERMISSIONS: {
  key: PermissionKey;
  action: Action;
  scope: Scope;
  description: string;
}[] = (Object.keys(ACTIONS) as Action[]).flatMap((action) =>
  (ACTIONS[action].scopes as readonly Scope[]).map((scope) => ({
    key: `${action}.${scope}` as PermissionKey,
    action,
    scope,
    description: ACTIONS[action].description,
  })),
);

const ALL_KEYS = new Set(PERMISSIONS.map((p) => p.key));
const withScope = (scope: Scope) => PERMISSIONS.filter((p) => p.scope === scope).map((p) => p.key);
const except = (keys: PermissionKey[], excluded: PermissionKey[]) =>
  keys.filter((k) => !excluded.includes(k));

const PROVIDER_ALL = withScope('provider');

export const ROLE_PERMISSIONS: Record<RoleKey, PermissionKey[]> = {
  SUPER_ADMIN: withScope('any'),
  ADMIN: except(withScope('any'), [
    'settings.manage.any',
    'user.role.assign.any',
    'refund.approve.any',
    'payout.approve.any',
    'commission.manage.any',
  ]),
  CUSTOMER_SUPPORT: [
    'dashboard.platform.any',
    'provider.read.any',
    'order.read.any',
    'order.cancel.any',
    'installation.manage.any',
    'payment.read.any',
    'refund.request.any',
    'ticket.read.any',
    'ticket.reply.any',
    'ticket.internal_note.any',
    'ticket.assign.any',
    'review.moderate.any',
    'customer.read.any',
  ],
  FINANCE: [
    'dashboard.platform.any',
    'order.read.any',
    'payment.read.any',
    'refund.request.any',
    'refund.approve.any',
    'commission.read.any',
    'commission.manage.any',
    'payout.approve.any',
    'analytics.read.any',
  ],
  SALES: [
    'dashboard.platform.any',
    'provider.read.any',
    'order.read.any',
    'lead.read.any',
    'lead.manage.any',
    'referral.read.any',
    'referral.manage.any',
    'analytics.read.any',
  ],
  PROVIDER_OWNER: PROVIDER_ALL,
  PROVIDER_ADMIN: except(PROVIDER_ALL, ['provider_user.manage.provider']),
  PROVIDER_SALES: [
    'dashboard.provider.provider',
    'provider.read.provider',
    'order.read.provider',
    'order.confirm.provider',
    'payment.read.provider',
    'customer.read.provider',
    'lead.read.provider',
    'analytics.read.provider',
  ],
  PROVIDER_TECHNICIAN: [
    'dashboard.provider.provider',
    'order.read.provider',
    'installation.manage.provider',
    'ticket.read.provider',
    'ticket.reply.provider',
    'ticket.internal_note.provider',
  ],
  CUSTOMER: [
    'dashboard.customer.own',
    'provider.apply.own',
    'order.create.own',
    'order.read.own',
    'order.cancel.own',
    'payment.read.own',
    'refund.request.own',
    'ticket.create.own',
    'ticket.read.own',
    'ticket.reply.own',
    'review.create.own',
  ],
  REFERRAL_PARTNER: ['referral.read.own'],
};

for (const [role, keys] of Object.entries(ROLE_PERMISSIONS)) {
  for (const k of keys) {
    if (!ALL_KEYS.has(k)) throw new Error(`Unknown permission ${k} in role ${role}`);
  }
}

export interface Actor {
  userId: string;
  roles: RoleKey[];
  /** Set when the user belongs to a provider (with a PROVIDER_* role). */
  providerId: string | null;
}

/** Resource ownership facts needed for scoped checks. Omit for platform-wide resources. */
export interface ResourceRef {
  ownerUserId?: string | null;
  providerId?: string | null;
}

export function permissionsOf(actor: Actor): Set<PermissionKey> {
  return new Set(actor.roles.flatMap((r) => ROLE_PERMISSIONS[r] ?? []));
}

/**
 * Widest scope the actor holds for an action. List queries MUST filter by it:
 * 'any' → no filter, 'provider' → WHERE provider_id = actor.providerId,
 * 'own' → WHERE owner = actor.userId, null → deny.
 */
export function scopeFor(actor: Actor | null, action: Action): Scope | null {
  if (!actor) return null;
  const granted = permissionsOf(actor);
  if (granted.has(`${action}.any` as PermissionKey)) return 'any';
  if (granted.has(`${action}.provider` as PermissionKey) && actor.providerId !== null) {
    return 'provider';
  }
  if (granted.has(`${action}.own` as PermissionKey)) return 'own';
  return null;
}

/**
 * Server-side authorization. Must be called inside every application use case — UI
 * route hiding is never sufficient.
 *
 * With `resource`, ownership is enforced. Without it, the answer is "may perform this
 * action at some scope" (e.g. open a section) — list queries must then use `scopeFor`.
 */
export function can(actor: Actor | null, action: Action, resource?: ResourceRef): boolean {
  if (!actor) return false;
  const granted = permissionsOf(actor);
  if (granted.has(`${action}.any` as PermissionKey)) return true;
  if (
    granted.has(`${action}.provider` as PermissionKey) &&
    actor.providerId !== null &&
    (resource === undefined || resource.providerId === actor.providerId)
  ) {
    return true;
  }
  if (
    granted.has(`${action}.own` as PermissionKey) &&
    (resource === undefined || resource.ownerUserId === actor.userId)
  ) {
    return true;
  }
  return false;
}

export function authorize(actor: Actor | null, action: Action, resource?: ResourceRef): Decision {
  if (!actor) return { ok: false, code: 'AUTH_REQUIRED', reasons: ['login required'] };
  return decide('FORBIDDEN', can(actor, action, resource) ? [] : [`missing permission ${action}`]);
}

export function isPlatformStaff(actor: Actor | null): boolean {
  return can(actor, 'dashboard.platform');
}

export function isProviderMember(actor: Actor | null): boolean {
  return can(actor, 'dashboard.provider');
}
