import 'server-only';

import { count, desc, eq } from 'drizzle-orm';
import type { Db } from '@/db/client';
import { auditLogs, providerUsers, roles, userRoles, users } from '@/db/schema';
import { AppError } from '@/lib/errors';
import { authorize, type Action, type Actor } from '@/modules/auth/domain/rbac';

function guard(actor: Actor, action: Action) {
  const d = authorize(actor, action);
  if (!d.ok) throw new AppError(d.code, 'Akses ditolak.');
}

export async function listUsersWithRoles(db: Db, actor: Actor) {
  guard(actor, 'user.manage');
  const rows = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      status: users.status,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(200);
  const platform = await db
    .select({ userId: userRoles.userId, key: roles.key })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId));
  const provider = await db
    .select({ userId: providerUsers.userId, key: roles.key, providerId: providerUsers.providerId })
    .from(providerUsers)
    .innerJoin(roles, eq(roles.id, providerUsers.roleId));
  return rows.map((u) => ({
    ...u,
    roles: [
      ...platform.filter((r) => r.userId === u.id).map((r) => r.key),
      ...provider.filter((r) => r.userId === u.id).map((r) => `${r.key} (${r.providerId})`),
    ],
  }));
}

export async function listAuditLogs(db: Db, actor: Actor, limit = 100) {
  guard(actor, 'audit.read');
  return db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entity: auditLogs.entity,
      entityId: auditLogs.entityId,
      actorKind: auditLogs.actorKind,
      actorName: users.fullName,
      before: auditLogs.before,
      after: auditLogs.after,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

export async function platformCounts(db: Db, actor: Actor) {
  guard(actor, 'dashboard.platform');
  const [customers] = await db
    .select({ n: count() })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(eq(roles.key, 'CUSTOMER'));
  const [allUsers] = await db.select({ n: count() }).from(users);
  return { customers: customers?.n ?? 0, users: allUsers?.n ?? 0 };
}
