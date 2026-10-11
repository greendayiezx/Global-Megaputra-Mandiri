'use client';

import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, FieldError, Input } from '@/components/ui/field';
import { Alert } from '@/components/ui/primitives';
import { loginAction, registerAction, type FormState } from '@/modules/auth/api/actions';

const initial: FormState = { status: 'idle' };

/** Input with a leading icon, as on the auth screens. */
function IconInput({ icon: Icon, ...props }: React.ComponentProps<'input'> & { icon: LucideIcon }) {
  return (
    <div className="relative">
      <Icon
        aria-hidden="true"
        className="text-fg-muted pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2"
      />
      <Input {...props} className="h-12 pl-11" />
    </div>
  );
}

function PasswordInput(props: React.ComponentProps<'input'>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock
        aria-hidden="true"
        className="text-fg-muted pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2"
      />
      <Input {...props} type={show ? 'text' : 'password'} className="h-12 pr-11 pl-11" />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="text-fg-muted hover:bg-subtle hover:text-fg absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-sm"
        aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
        aria-pressed={show}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

/** Google "G" mark (official four-colour glyph). */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

export function LoginForm({ next, googleEnabled }: { next: string; googleEnabled: boolean }) {
  const [state, action, pending] = useActionState(loginAction, initial);
  const [remember, setRemember] = useState(true);
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} noValidate className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {state.message && <Alert tone="danger">{state.message}</Alert>}
      <Field id="email" label="Email" required error={fe.email}>
        {(aria) => (
          <IconInput
            {...aria}
            icon={Mail}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="contoh@email.com"
            defaultValue={state.values?.email}
            required
          />
        )}
      </Field>
      <Field id="password" label="Password" required error={fe.password}>
        {(aria) => (
          <PasswordInput
            {...aria}
            name="password"
            autoComplete="current-password"
            placeholder="Masukkan password Anda"
            required
          />
        )}
      </Field>
      <Checkbox
        name="remember"
        value="1"
        checked={remember}
        onChange={(e) => setRemember(e.currentTarget.checked)}
        label="Ingat saya"
      />
      <Button type="submit" size="lg" className="h-12 w-full" loading={pending}>
        Masuk <ArrowRight aria-hidden="true" />
      </Button>
      <div className="text-fg-muted flex items-center gap-3 text-xs">
        <span className="bg-line h-px flex-1" />
        atau
        <span className="bg-line h-px flex-1" />
      </div>
      {googleEnabled ? (
        <a
          href={`/api/auth/google?next=${encodeURIComponent(next)}${remember ? '&remember=1' : ''}`}
          className="border-line-strong text-fg hover:bg-subtle flex h-12 w-full items-center justify-center gap-3 rounded-md border bg-white text-[15px] font-semibold transition-colors"
        >
          <GoogleIcon /> Masuk dengan Google
        </a>
      ) : (
        <div>
          <button
            type="button"
            disabled
            aria-describedby="google-hint"
            className="border-line text-fg-muted flex h-12 w-full cursor-not-allowed items-center justify-center gap-3 rounded-md border bg-white text-[15px] font-semibold opacity-70"
          >
            <GoogleIcon /> Masuk dengan Google
          </button>
          <p id="google-hint" className="text-fg-muted mt-1.5 text-center text-xs">
            Login dengan Google belum diaktifkan oleh administrator.
          </p>
        </div>
      )}
      <p className="text-fg-muted text-center text-sm">
        Belum punya akun?{' '}
        <Link
          href={`/register?next=${encodeURIComponent(next)}`}
          className="text-primary font-semibold hover:underline"
        >
          Daftar di sini
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(registerAction, initial);
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} noValidate className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {state.message && !Object.keys(fe).length && <Alert tone="danger">{state.message}</Alert>}
      <Field id="fullName" label="Nama Lengkap" required error={fe.fullName}>
        {(aria) => (
          <IconInput
            {...aria}
            icon={UserRound}
            placeholder="Masukkan nama lengkap Anda"
            name="fullName"
            autoComplete="name"
            defaultValue={state.values?.fullName}
            required
          />
        )}
      </Field>
      <Field id="email" label="Email" required error={fe.email}>
        {(aria) => (
          <IconInput
            {...aria}
            icon={Mail}
            placeholder="contoh@email.com"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={state.values?.email}
            required
          />
        )}
      </Field>
      <Field
        id="phone"
        label="Nomor Telepon"
        required
        error={fe.phone}
        hint="Dipakai teknisi untuk mengatur jadwal pemasangan."
      >
        {(aria) => (
          <IconInput
            {...aria}
            icon={Phone}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0812 3456 7890"
            defaultValue={state.values?.phone}
            required
          />
        )}
      </Field>
      <Field
        id="password"
        label="Password"
        required
        error={fe.password}
        hint="Minimal 10 karakter. Gunakan frasa yang mudah Anda ingat."
      >
        {(aria) => (
          <PasswordInput
            {...aria}
            name="password"
            autoComplete="new-password"
            placeholder="Minimal 10 karakter"
            required
          />
        )}
      </Field>
      <Field id="passwordConfirm" label="Konfirmasi Password" required error={fe.passwordConfirm}>
        {(aria) => (
          <PasswordInput
            {...aria}
            name="passwordConfirm"
            autoComplete="new-password"
            placeholder="Ulangi password"
            required
          />
        )}
      </Field>
      <div>
        <Checkbox
          name="terms"
          required
          aria-invalid={fe.terms ? true : undefined}
          label={
            <>
              Saya menyetujui{' '}
              <Link href="/terms" className="text-primary underline">
                syarat layanan
              </Link>{' '}
              dan{' '}
              <Link href="/privacy" className="text-primary underline">
                kebijakan privasi
              </Link>{' '}
              GMM.
            </>
          }
        />
        <FieldError>{fe.terms}</FieldError>
      </div>
      <Button type="submit" size="lg" className="h-12 w-full" loading={pending}>
        Daftar Sekarang <ArrowRight aria-hidden="true" />
      </Button>
      <p className="text-fg-muted text-center text-sm">
        Sudah punya akun?{' '}
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="text-primary font-semibold hover:underline"
        >
          Masuk di sini
        </Link>
      </p>
    </form>
  );
}
