'use client';

import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, FieldError, Input } from '@/components/ui/field';
import { Alert } from '@/components/ui/primitives';
import { loginAction, registerAction, type FormState } from '@/modules/auth/api/actions';

const initial: FormState = { status: 'idle' };

function PasswordInput(props: React.ComponentProps<'input'>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? 'text' : 'password'} className="pr-11" />
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
          <Input
            {...aria}
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={state.values?.email}
            required
          />
        )}
      </Field>
      <Field id="password" label="Kata sandi" required error={fe.password}>
        {(aria) => (
          <PasswordInput {...aria} name="password" autoComplete="current-password" required />
        )}
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Masuk
      </Button>
      <p className="text-fg-muted text-center text-sm">
        Belum punya akun?{' '}
        <Link
          href={`/register?next=${encodeURIComponent(next)}`}
          className="text-primary font-semibold hover:underline"
        >
          Daftar
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
      <Field id="fullName" label="Nama lengkap" required error={fe.fullName}>
        {(aria) => (
          <Input
            {...aria}
            name="fullName"
            autoComplete="name"
            defaultValue={state.values?.fullName}
            required
          />
        )}
      </Field>
      <Field
        id="email"
        label="Email"
        required
        error={fe.email}
        hint="Untuk konfirmasi pesanan dan tagihan."
      >
        {(aria) => (
          <Input
            {...aria}
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
        label="Nomor ponsel"
        required
        error={fe.phone}
        hint="Dipakai teknisi untuk mengatur jadwal pemasangan."
      >
        {(aria) => (
          <Input
            {...aria}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0812xxxxxxxx"
            defaultValue={state.values?.phone}
            required
          />
        )}
      </Field>
      <Field
        id="password"
        label="Kata sandi"
        required
        error={fe.password}
        hint="Minimal 10 karakter. Gunakan frasa yang mudah Anda ingat."
      >
        {(aria) => <PasswordInput {...aria} name="password" autoComplete="new-password" required />}
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
              dan
              <Link href="/privacy" className="text-primary underline">
                kebijakan privasi
              </Link>{' '}
              GMM.
            </>
          }
        />
        <FieldError>{fe.terms}</FieldError>
      </div>
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Buat Akun
      </Button>
      <p className="text-fg-muted text-center text-sm">
        Sudah punya akun?{' '}
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="text-primary font-semibold hover:underline"
        >
          Masuk
        </Link>
      </p>
    </form>
  );
}
