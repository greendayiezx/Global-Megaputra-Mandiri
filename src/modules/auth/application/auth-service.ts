import { and, eq, inArray, isNull, like } from 'drizzle-orm';
import type { Db } from '@/db/client';
import { providers, providerUsers, roles, sessions, userRoles, users } from '@/db/schema';
import { audit } from '@/lib/audit';
import { AppError } from '@/lib/errors';
import { firstFreeSlug, kebab } from '@/lib/slug';
import type { RateLimiter } from '@/lib/rate-limit';
import {
  afterFailedLogin,
  isLocked,
  normalizeEmail,
  normalizeIndonesianPhone,
  passwordIssues,
} from '../domain/credentials';
import { authorize, ROLES, type Actor, type RoleKey } from '../domain/rbac';
import {
  hashPassword,
  hashToken,
  hmacIdentifier,
  newSessionToken,
  verifyAgainstDummy,
  verifyPassword,
} from '../infrastructure/crypto';

export interface AuthDeps {
  db: Db;
  limiter: RateLimiter;
  now?: () => Date;
  sessionTtlHours?: number;
}

export interface RequestContext {
  ip: string | null;
  userAgent: string | null;
}

export interface SessionIssued {
  userId: string;
  token: string;
  expiresAt: Date;
}

const TOO_MANY = 'Terlalu banyak percobaan. Silakan coba lagi dalam beberapa menit.';
const BAD_CREDENTIALS = 'Email atau kata sandi tidak sesuai.';

const nowOf = (d: AuthDeps) => (d.now ? d.now() : new Date());
const ttlHours = (d: AuthDeps) => d.sessionTtlHours ?? Number(process.env.SESSION_TTL_HOURS ?? 168);

async function issueSession(
  deps: AuthDeps,
  tx: Pick<Db, 'insert'>,
  userId: string,
  ctx: RequestContext,
): Promise<SessionIssued> {
  const token = newSessionToken();
  const expiresAt = new Date(nowOf(deps).getTime() + ttlHours(deps) * 3_600_000);
  await tx.insert(sessions).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt,
    ipHash: ctx.ip ? hmacIdentifier(ctx.ip) : null,
    userAgent: ctx.userAgent?.slice(0, 300) ?? null,
  });
  return { userId, token, expiresAt };
}

export interface RegisterInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

/** Customer self-registration. Collects only what an order needs (data minimisation). */
export async function registerCustomer(
  deps: AuthDeps,
  input: RegisterInput,
  ctx: RequestContext,
): Promise<SessionIssued> {
  const ipKey = ctx.ip ? hmacIdentifier(ctx.ip) : 'unknown';
  const rl = await deps.limiter.hit(`register:${ipKey}`, 10, 3600);
  if (!rl.allowed) throw new AppError('RATE_LIMITED', TOO_MANY, { retryAfter: rl.retryAfter });

  const email = normalizeEmail(input.email);
  const phone = normalizeIndonesianPhone(input.phone);
  const fullName = input.fullName.trim().replace(/\s+/g, ' ');
  const fieldErrors: Record<string, string> = {};
  if (fullName.length < 2) fieldErrors.fullName = 'Nama lengkap wajib diisi.';
  if (!phone) fieldErrors.phone = 'Gunakan nomor ponsel Indonesia, mis. 0812xxxxxxx.';
  const pwIssues = passwordIssues(input.password, email);
  if (pwIssues.length) fieldErrors.password = pwIssues.join(' ');
  if (Object.keys(fieldErrors).length) {
    throw new AppError('VALIDATION_ERROR', 'Periksa kembali data Anda.', { fieldErrors });
  }

  const passwordHash = await hashPassword(input.password);
  const { db } = deps;

  return db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: users.id, phone: users.phone, email: users.email })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing.length) {
      throw new AppError('CONFLICT', 'Email sudah terdaftar. Silakan masuk.', {
        fieldErrors: { email: 'Email sudah terdaftar.' },
      });
    }
    const phoneTaken = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.phone, phone!))
      .limit(1);
    if (phoneTaken.length) {
      throw new AppError('CONFLICT', 'Nomor ponsel sudah terdaftar.', {
        fieldErrors: { phone: 'Nomor ponsel sudah terdaftar.' },
      });
    }

    const [user] = await tx
      .insert(users)
      .values({ email, phone, fullName, passwordHash })
      .returning({ id: users.id });
    const [customerRole] = await tx
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.key, 'CUSTOMER'));
    if (!customerRole) throw new AppError('CONFIGURATION_MISSING', 'Roles are not initialised.');
    await tx.insert(userRoles).values({ userId: user!.id, roleId: customerRole.id });

    await audit(tx, {
      actorId: user!.id,
      actorKind: 'CUSTOMER',
      action: 'user_registered',
      entity: 'user',
      entityId: user!.id,
      after: { roles: ['CUSTOMER'] },
      ipHash: ctx.ip ? hmacIdentifier(ctx.ip) : null,
      userAgent: ctx.userAgent,
    });
    return issueSession(deps, tx, user!.id, ctx);
  });
}

export interface ProviderRegistrationInput {
  /** Account owner = the provider's PIC. */
  fullName: string;
  email: string;
  phone: string;
  password: string;
  company: {
    displayName: string;
    legalName: string;
    nib: string | null;
    address: string;
    technologies: string[];
    serviceAreaNames: string[];
  };
}

/**
 * Self-service provider sign-up: creates the owner account, a provider in PENDING
 * verification (invisible to the public until GMM approves), the PROVIDER_OWNER
 * membership, and a session, all in one transaction.
 */
export async function registerProvider(
  deps: AuthDeps,
  input: ProviderRegistrationInput,
  ctx: RequestContext,
): Promise<SessionIssued & { providerId: string }> {
  const ipKey = ctx.ip ? hmacIdentifier(ctx.ip) : 'unknown';
  const rl = await deps.limiter.hit(`register:${ipKey}`, 10, 3600);
  if (!rl.allowed) throw new AppError('RATE_LIMITED', TOO_MANY, { retryAfter: rl.retryAfter });

  const email = normalizeEmail(input.email);
  const phone = normalizeIndonesianPhone(input.phone);
  const fullName = input.fullName.trim().replace(/\s+/g, ' ');
  const c = input.company;
  const fieldErrors: Record<string, string> = {};
  if (fullName.length < 2) fieldErrors.fullName = 'Nama penanggung jawab wajib diisi.';
  if (!phone) fieldErrors.phone = 'Gunakan nomor ponsel Indonesia, mis. 0812xxxxxxx.';
  if (c.displayName.trim().length < 2) fieldErrors.displayName = 'Nama merek wajib diisi.';
  if (c.legalName.trim().length < 2) fieldErrors.legalName = 'Nama badan usaha wajib diisi.';
  if (c.nib && !/^\d{13}$/.test(c.nib)) fieldErrors.nib = 'NIB terdiri dari 13 digit angka.';
  if (c.address.trim().length < 10) fieldErrors.address = 'Tulis alamat kantor lengkap.';
  if (c.technologies.length === 0) fieldErrors.technologies = 'Pilih minimal satu teknologi.';
  const pwIssues = passwordIssues(input.password, email);
  if (pwIssues.length) fieldErrors.password = pwIssues.join(' ');
  if (Object.keys(fieldErrors).length) {
    throw new AppError('VALIDATION_ERROR', 'Periksa kembali data Anda.', { fieldErrors });
  }

  const passwordHash = await hashPassword(input.password);
  return deps.db.transaction(async (tx) => {
    const [emailTaken] = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email));
    if (emailTaken) {
      throw new AppError(
        'CONFLICT',
        'Email sudah terdaftar. Masuk dengan akun tersebut atau gunakan email lain.',
        {
          fieldErrors: { email: 'Email sudah terdaftar.' },
        },
      );
    }
    const [phoneTaken] = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.phone, phone!));
    if (phoneTaken) {
      throw new AppError('CONFLICT', 'Nomor ponsel sudah terdaftar.', {
        fieldErrors: { phone: 'Nomor ponsel sudah terdaftar.' },
      });
    }

    const [user] = await tx
      .insert(users)
      .values({ email, phone, fullName, passwordHash })
      .returning({ id: users.id });

    const base = kebab(c.displayName) || 'provider';
    const taken = new Set(
      (
        await tx
          .select({ slug: providers.slug })
          .from(providers)
          .where(like(providers.slug, `${base}%`))
      ).map((r) => r.slug),
    );
    const [provider] = await tx
      .insert(providers)
      .values({
        slug: firstFreeSlug(base, taken),
        displayName: c.displayName.trim(),
        legalName: c.legalName.trim(),
        nib: c.nib || null,
        address: c.address.trim(),
        picName: fullName,
        picPhone: phone,
        picEmail: email,
        technologies: c.technologies,
        serviceAreaNames: c.serviceAreaNames,
        verificationStatus: 'PENDING',
      })
      .returning({ id: providers.id });

    const [ownerRole] = await tx
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.key, 'PROVIDER_OWNER'));
    if (!ownerRole) throw new AppError('CONFIGURATION_MISSING', 'Roles are not initialised.');
    await tx
      .insert(providerUsers)
      .values({ providerId: provider!.id, userId: user!.id, roleId: ownerRole.id });

    await audit(tx, {
      actorId: user!.id,
      actorKind: 'PROVIDER',
      action: 'provider_registered',
      entity: 'provider',
      entityId: provider!.id,
      after: { displayName: c.displayName.trim(), verificationStatus: 'PENDING' },
      ipHash: ctx.ip ? hmacIdentifier(ctx.ip) : null,
      userAgent: ctx.userAgent,
    });
    const session = await issueSession(deps, tx, user!.id, ctx);
    return { ...session, providerId: provider!.id };
  });
}

export interface GoogleProfile {
  /** Must already be verified by Google (email_verified = true). */
  email: string;
  fullName: string;
}

/**
 * Sign in (or sign up) with a Google-verified email.
 * - New email: creates a CUSTOMER account. It gets an unguessable random password, so it can
 *   only sign in with Google until the user sets a password.
 * - Existing customer: signs in (Google has proven ownership of the email).
 * - Existing staff/provider account: refused, those must use email + password, so an
 *   external identity can never open a privileged account.
 */
export async function loginWithGoogle(
  deps: AuthDeps,
  profile: GoogleProfile,
  ctx: RequestContext,
): Promise<SessionIssued> {
  const { db } = deps;
  const now = nowOf(deps);
  const email = normalizeEmail(profile.email);
  const ipHash = ctx.ip ? hmacIdentifier(ctx.ip) : null;

  const rl = await deps.limiter.hit(`login:ip:${ipHash ?? 'unknown'}`, 30, 900);
  if (!rl.allowed) throw new AppError('RATE_LIMITED', TOO_MANY, { retryAfter: rl.retryAfter });

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .limit(1);

  if (user) {
    if (user.status === 'DISABLED') throw new AppError('AUTH_REQUIRED', BAD_CREDENTIALS);
    const roleRows = await db
      .select({ key: roles.key })
      .from(userRoles)
      .innerJoin(roles, eq(roles.id, userRoles.roleId))
      .where(eq(userRoles.userId, user.id));
    const isCustomerOnly = roleRows.every((r) => r.key === 'CUSTOMER');
    const ownsProvider = (
      await db
        .select({ id: providerUsers.userId })
        .from(providerUsers)
        .where(eq(providerUsers.userId, user.id))
        .limit(1)
    ).length;
    if (!isCustomerOnly || ownsProvider) {
      throw new AppError('FORBIDDEN', 'Akun ini harus masuk dengan email dan kata sandi.');
    }
    return db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          failedLoginCount: 0,
          lockedUntil: null,
          lastLoginAt: now,
          emailVerifiedAt: user.emailVerifiedAt ?? now,
        })
        .where(eq(users.id, user.id));
      await audit(tx, {
        actorId: user.id,
        actorKind: 'CUSTOMER',
        action: 'login_succeeded',
        entity: 'user',
        entityId: user.id,
        after: { method: 'google' },
        ipHash,
        userAgent: ctx.userAgent,
      });
      return issueSession(deps, tx, user.id, ctx);
    });
  }

  const fullName = profile.fullName.trim().replace(/\s+/g, ' ').slice(0, 120) || email;
  const passwordHash = await hashPassword(newSessionToken());
  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(users)
      .values({
        email,
        phone: null,
        fullName,
        passwordHash,
        emailVerifiedAt: now,
        lastLoginAt: now,
      })
      .returning({ id: users.id });
    const [customerRole] = await tx
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.key, 'CUSTOMER'));
    if (!customerRole) throw new AppError('CONFIGURATION_MISSING', 'Roles are not initialised.');
    await tx.insert(userRoles).values({ userId: created!.id, roleId: customerRole.id });
    await audit(tx, {
      actorId: created!.id,
      actorKind: 'CUSTOMER',
      action: 'user_registered',
      entity: 'user',
      entityId: created!.id,
      after: { roles: ['CUSTOMER'], method: 'google' },
      ipHash,
      userAgent: ctx.userAgent,
    });
    return issueSession(deps, tx, created!.id, ctx);
  });
}

export async function login(
  deps: AuthDeps,
  input: { email: string; password: string },
  ctx: RequestContext,
): Promise<SessionIssued> {
  const { db } = deps;
  const now = nowOf(deps);
  const email = normalizeEmail(input.email);
  const ipHash = ctx.ip ? hmacIdentifier(ctx.ip) : null;

  const [byIp, byAccount] = await Promise.all([
    deps.limiter.hit(`login:ip:${ipHash ?? 'unknown'}`, 30, 900),
    deps.limiter.hit(`login:acct:${hmacIdentifier(email)}`, 10, 900),
  ]);
  if (!byIp.allowed || !byAccount.allowed) {
    throw new AppError('RATE_LIMITED', TOO_MANY, {
      retryAfter: Math.max(byIp.retryAfter, byAccount.retryAfter),
    });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .limit(1);

  if (!user || user.status === 'DISABLED') {
    await verifyAgainstDummy(input.password);
    await audit(db, {
      actorId: null,
      actorKind: 'ANONYMOUS',
      action: 'login_failed',
      entity: 'user',
      entityId: null,
      after: { reason: user ? 'disabled' : 'unknown_account', emailHash: hmacIdentifier(email) },
      ipHash,
      userAgent: ctx.userAgent,
    });
    throw new AppError('AUTH_REQUIRED', BAD_CREDENTIALS);
  }

  if (isLocked(user.lockedUntil, now)) {
    // Same message as rate limiting: does not confirm that the account exists.
    throw new AppError('RATE_LIMITED', TOO_MANY);
  }

  const ok = await verifyPassword(user.passwordHash, input.password);
  if (!ok) {
    const next = afterFailedLogin(user.failedLoginCount, now);
    await db.transaction(async (tx) => {
      await tx.update(users).set(next).where(eq(users.id, user.id));
      await audit(tx, {
        actorId: null,
        actorKind: 'ANONYMOUS',
        action: next.lockedUntil ? 'login_locked' : 'login_failed',
        entity: 'user',
        entityId: user.id,
        after: { reason: 'bad_password', lockedUntil: next.lockedUntil?.toISOString() ?? null },
        ipHash,
        userAgent: ctx.userAgent,
      });
    });
    throw new AppError(
      next.lockedUntil ? 'RATE_LIMITED' : 'AUTH_REQUIRED',
      next.lockedUntil ? TOO_MANY : BAD_CREDENTIALS,
    );
  }

  return db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ failedLoginCount: 0, lockedUntil: null, lastLoginAt: now })
      .where(eq(users.id, user.id));
    await audit(tx, {
      actorId: user.id,
      actorKind: 'CUSTOMER',
      action: 'login_succeeded',
      entity: 'user',
      entityId: user.id,
      ipHash,
      userAgent: ctx.userAgent,
    });
    return issueSession(deps, tx, user.id, ctx);
  });
}

export async function logout(deps: AuthDeps, token: string, ctx: RequestContext): Promise<void> {
  const { db } = deps;
  const [s] = await db
    .update(sessions)
    .set({ revokedAt: nowOf(deps) })
    .where(and(eq(sessions.tokenHash, hashToken(token)), isNull(sessions.revokedAt)))
    .returning({ userId: sessions.userId });
  if (s) {
    await audit(db, {
      actorId: s.userId,
      actorKind: 'CUSTOMER',
      action: 'logout',
      entity: 'session',
      ipHash: ctx.ip ? hmacIdentifier(ctx.ip) : null,
      userAgent: ctx.userAgent,
    });
  }
}

export interface SessionUser {
  id: string;
  fullName: string;
  email: string;
}

/** Resolves the cookie token into an actor. Returns null for missing/expired/revoked/disabled. */
export async function resolveSession(
  deps: AuthDeps,
  token: string,
): Promise<{ actor: Actor; user: SessionUser } | null> {
  const { db } = deps;
  const now = nowOf(deps);
  const [row] = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      revokedAt: sessions.revokedAt,
      lastSeenAt: sessions.lastSeenAt,
      user: {
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        status: users.status,
        deletedAt: users.deletedAt,
      },
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.tokenHash, hashToken(token)))
    .limit(1);

  if (
    !row ||
    row.revokedAt ||
    row.expiresAt.getTime() <= now.getTime() ||
    row.user.status !== 'ACTIVE' ||
    row.user.deletedAt
  ) {
    return null;
  }

  const [platformRoles, membership] = await Promise.all([
    db
      .select({ key: roles.key })
      .from(userRoles)
      .innerJoin(roles, eq(roles.id, userRoles.roleId))
      .where(eq(userRoles.userId, row.user.id)),
    db
      .select({ providerId: providerUsers.providerId, key: roles.key })
      .from(providerUsers)
      .innerJoin(roles, eq(roles.id, providerUsers.roleId))
      .where(and(eq(providerUsers.userId, row.user.id), eq(providerUsers.status, 'ACTIVE')))
      .limit(1),
  ]);

  const roleKeys = new Set<RoleKey>();
  for (const r of platformRoles) if (r.key in ROLES) roleKeys.add(r.key as RoleKey);
  const member = membership[0];
  if (member && member.key in ROLES) roleKeys.add(member.key as RoleKey);

  if (now.getTime() - row.lastSeenAt.getTime() > 5 * 60_000) {
    await db.update(sessions).set({ lastSeenAt: now }).where(eq(sessions.id, row.sessionId));
  }

  return {
    actor: { userId: row.user.id, roles: [...roleKeys], providerId: member?.providerId ?? null },
    user: { id: row.user.id, fullName: row.user.fullName, email: row.user.email },
  };
}

/** Platform role assignment (SUPER_ADMIN only), fully audited. */
export async function setPlatformRoles(
  deps: AuthDeps,
  actor: Actor,
  targetUserId: string,
  nextRoles: RoleKey[],
): Promise<void> {
  const decision = authorize(actor, 'user.role.assign');
  if (!decision.ok) throw new AppError(decision.code, 'Anda tidak berhak mengubah role.');
  if (nextRoles.some((r) => ROLES[r].scope === 'PROVIDER')) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Provider roles are assigned through provider membership.',
    );
  }
  await deps.db.transaction(async (tx) => {
    const current = await tx
      .select({ key: roles.key, id: roles.id })
      .from(userRoles)
      .innerJoin(roles, eq(roles.id, userRoles.roleId))
      .where(eq(userRoles.userId, targetUserId));
    await tx.delete(userRoles).where(eq(userRoles.userId, targetUserId));
    if (nextRoles.length) {
      const ids = await tx
        .select({ id: roles.id })
        .from(roles)
        .where(inArray(roles.key, nextRoles));
      await tx
        .insert(userRoles)
        .values(ids.map((r) => ({ userId: targetUserId, roleId: r.id, grantedBy: actor.userId })));
    }
    await audit(tx, {
      actorId: actor.userId,
      actorKind: 'PLATFORM',
      action: 'user_role_changed',
      entity: 'user',
      entityId: targetUserId,
      before: { roles: current.map((r) => r.key).sort() },
      after: { roles: [...nextRoles].sort() },
    });
  });
}
