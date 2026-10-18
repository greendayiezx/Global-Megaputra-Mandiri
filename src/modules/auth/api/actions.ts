'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import {
  authDeps,
  clearSessionCookie,
  readSessionToken,
  requestContext,
  setSessionCookie,
} from '@/lib/auth/session';
import { isAppError } from '@/lib/errors';
import {
  login,
  logout,
  registerCustomer,
  registerProvider,
  resolveSession,
} from '@/modules/auth/application/auth-service';
import { safeRedirectPath } from '@/modules/auth/domain/credentials';
import { homePathFor } from '@/modules/auth/domain/rbac';

export interface FormState {
  status: 'idle' | 'error';
  message?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
}

const loginSchema = z.object({
  email: z.email({ error: 'Masukkan email yang valid.' }).max(254),
  password: z.string().min(1, { error: 'Kata sandi wajib diisi.' }).max(128),
  remember: z.literal('1').optional(),
  next: z.string().max(500).optional(),
});

const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, { error: 'Nama lengkap wajib diisi.' }).max(120),
    email: z.email({ error: 'Masukkan email yang valid.' }).max(254),
    phone: z.string().trim().min(8, { error: 'Nomor ponsel wajib diisi.' }).max(20),
    password: z.string().max(128),
    passwordConfirm: z.string().max(128),
    terms: z.literal('on', { error: 'Anda perlu menyetujui syarat & kebijakan privasi.' }),
    next: z.string().max(500).optional(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    path: ['passwordConfirm'],
    error: 'Konfirmasi password tidak sama.',
  });

function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    out[key] ??= issue.message;
  }
  return out;
}

function toState(err: unknown, values: Record<string, string>): FormState {
  if (isAppError(err)) {
    const fieldErrors =
      (err.details?.fieldErrors as Record<string, string> | undefined) ?? undefined;
    return {
      status: 'error',
      message: err.message,
      ...(fieldErrors ? { fieldErrors } : {}),
      values,
    };
  }
  console.error('auth action failed', err instanceof Error ? err.name : 'unknown');
  return { status: 'error', message: 'Terjadi kesalahan. Silakan coba lagi.', values };
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const values = { email: raw.email ?? '' };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 'error', fieldErrors: fieldErrorsOf(parsed.error), values };
  }
  let home: string;
  try {
    const deps = await authDeps();
    const s = await login(deps, parsed.data, await requestContext());
    await setSessionCookie(s.token, s.expiresAt, parsed.data.remember === '1');
    // Go straight to the user's own area. Landing on /dashboard first and bouncing to a
    // portal from there flashed the public header and footer in between.
    home = homePathFor((await resolveSession(deps, s.token))?.actor ?? null);
  } catch (err) {
    return toState(err, values);
  }
  redirect(safeRedirectPath(parsed.data.next, home));
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const values = { fullName: raw.fullName ?? '', email: raw.email ?? '', phone: raw.phone ?? '' };
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 'error', fieldErrors: fieldErrorsOf(parsed.error), values };
  }
  try {
    const s = await registerCustomer(await authDeps(), parsed.data, await requestContext());
    await setSessionCookie(s.token, s.expiresAt);
  } catch (err) {
    return toState(err, values);
  }
  redirect(safeRedirectPath(parsed.data.next));
}

export async function logoutAction(): Promise<void> {
  const token = await readSessionToken();
  if (token) {
    try {
      await logout(await authDeps(), token, await requestContext());
    } catch {
      // The cookie is cleared regardless; a failed revoke expires naturally.
    }
  }
  await clearSessionCookie();
  redirect('/');
}

const providerSignupSchema = z
  .object({
    displayName: z.string().max(80),
    legalName: z.string().max(160),
    nib: z.string().trim().max(20).optional(),
    address: z.string().max(300),
    serviceAreaNames: z.string().max(1000).optional(),
    fullName: z.string().max(120),
    email: z.email({ error: 'Masukkan email yang valid.' }).max(254),
    phone: z.string().trim().max(20),
    password: z.string().max(128),
    passwordConfirm: z.string().max(128),
    terms: z.literal('on', { error: 'Anda perlu menyetujui syarat & kebijakan privasi.' }),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    path: ['passwordConfirm'],
    error: 'Konfirmasi password tidak sama.',
  });

/** Provider self sign-up from /mitra/daftar. */
export async function registerProviderAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const keep = [
    'displayName',
    'legalName',
    'nib',
    'address',
    'serviceAreaNames',
    'fullName',
    'email',
    'phone',
  ];
  const values = Object.fromEntries(keep.map((k) => [k, raw[k] ?? '']));
  const technologies = formData.getAll('technologies').map(String);
  values.technologies = technologies.join(',');
  const parsed = providerSignupSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 'error', fieldErrors: fieldErrorsOf(parsed.error), values };
  }
  const d = parsed.data;
  try {
    const s = await registerProvider(
      await authDeps(),
      {
        fullName: d.fullName,
        email: d.email,
        phone: d.phone,
        password: d.password,
        company: {
          displayName: d.displayName,
          legalName: d.legalName,
          nib: d.nib || null,
          address: d.address,
          technologies: technologies.filter((t) =>
            ['FIBER', 'FIXED_WIRELESS', 'CABLE', 'SATELLITE'].includes(t),
          ),
          serviceAreaNames: (d.serviceAreaNames ?? '')
            .split('\n')
            .map((x) => x.trim())
            .filter(Boolean)
            .slice(0, 30),
        },
      },
      await requestContext(),
    );
    await setSessionCookie(s.token, s.expiresAt);
  } catch (err) {
    return toState(err, values);
  }
  redirect('/provider-dashboard/guide?welcome=1');
}
