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

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(loginAction, initial);
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
      <Button type="submit" size="lg" className="h-12 w-full" loading={pending}>
        Masuk <ArrowRight aria-hidden="true" />
      </Button>
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
