import { and, eq, notInArray } from 'drizzle-orm';
import { getDb, type Db } from '@/db/client';
import { permissions, providerUsers, rolePermissions, roles, userRoles, users } from '@/db/schema';
import { PERMISSIONS, ROLE_PERMISSIONS, ROLES, type RoleKey } from '../domain/rbac';
import { hashPassword } from '../infrastructure/crypto';

/** Upserts roles/permissions/role_permissions from the code matrix (idempotent). */
export async function syncRbac(db: Db): Promise<void> {
  await db.transaction(async (tx) => {
    for (const p of PERMISSIONS) {
      await tx
        .insert(permissions)
        .values({ key: p.key, description: p.description })
        .onConflictDoUpdate({ target: permissions.key, set: { description: p.description } });
    }
    for (const [key, r] of Object.entries(ROLES)) {
      await tx
        .insert(roles)
        .values({ key, name: r.name, scope: r.scope, description: r.description })
        .onConflictDoUpdate({
          target: roles.key,
          set: { name: r.name, scope: r.scope, description: r.description },
        });
    }
    const roleRows = await tx.select({ id: roles.id, key: roles.key }).from(roles);
    const permRows = await tx
      .select({ id: permissions.id, key: permissions.key })
      .from(permissions);
    const permId = new Map(permRows.map((p) => [p.key, p.id]));

    for (const role of roleRows) {
      const wanted = (ROLE_PERMISSIONS[role.key as RoleKey] ?? []).map((k) => permId.get(k)!);
      if (wanted.length) {
        await tx
          .delete(rolePermissions)
          .where(
            and(
              eq(rolePermissions.roleId, role.id),
              notInArray(rolePermissions.permissionId, wanted),
            ),
          );
        await tx
          .insert(rolePermissions)
          .values(wanted.map((permissionId) => ({ roleId: role.id, permissionId })))
          .onConflictDoNothing();
      } else {
        await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));
      }
    }
  });
}

/**
 * DEMO ACCOUNTS — local development only, never created in production. Credentials are
 * documented in README so the portals can be explored without real data.
 */
export const DEMO_PASSWORD = 'GmmDemo#2026';
export const DEMO_ACCOUNTS: {
  email: string;
  fullName: string;
  role: RoleKey;
  providerId?: string;
}[] = [
  { email: 'pelanggan@demo.gmm.invalid', fullName: 'Pelanggan Demo', role: 'CUSTOMER' },
  {
    email: 'provider@demo.gmm.invalid',
    fullName: 'Pemilik Demo Provider 001',
    role: 'PROVIDER_OWNER',
    providerId: 'demo-prov-001',
  },
  { email: 'admin@demo.gmm.invalid', fullName: 'Super Admin Demo', role: 'SUPER_ADMIN' },
];

export async function seedDemoAccounts(db: Db): Promise<void> {
  if (process.env.NODE_ENV === 'production') return;
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  for (const acc of DEMO_ACCOUNTS) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, acc.email));
    if (existing) continue;
    await db.transaction(async (tx) => {
      const [u] = await tx
        .insert(users)
        .values({ email: acc.email, fullName: acc.fullName, passwordHash })
        .returning({ id: users.id });
      const [role] = await tx.select({ id: roles.id }).from(roles).where(eq(roles.key, acc.role));
      if (acc.providerId) {
        await tx
          .insert(providerUsers)
          .values({ providerId: acc.providerId, userId: u!.id, roleId: role!.id });
      } else {
        await tx.insert(userRoles).values({ userId: u!.id, roleId: role!.id });
      }
    });
  }
}

const globalForReady = globalThis as unknown as { __gmmReady?: Promise<Db> };

/** Database with migrations applied, RBAC synced, and (dev only) demo accounts present. */
export function getReadyDb(): Promise<Db> {
  globalForReady.__gmmReady ??= (async () => {
    const db = await getDb();
    await syncRbac(db);
    const showDemo =
      process.env.APP_SHOW_DEMO_DATA !== 'false' && process.env.NODE_ENV !== 'production';
    if (showDemo) await seedDemoAccounts(db);
    return db;
  })().catch((err) => {
    globalForReady.__gmmReady = undefined;
    throw err;
  });
  return globalForReady.__gmmReady;
}
