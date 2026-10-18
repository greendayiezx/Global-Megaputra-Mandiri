'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { PasswordInput } from '@/components/auth/auth-forms';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Textarea } from '@/components/ui/field';
import { Alert, Card } from '@/components/ui/primitives';
import { registerProviderAction, type FormState } from '@/modules/auth/api/actions';

const TECH: [string, string][] = [
  ['FIBER', 'Fiber optik'],
  ['FIXED_WIRELESS', 'Fixed wireless'],
  ['CABLE', 'Kabel coaxial'],
  ['SATELLITE', 'Satelit'],
];

const initial: FormState = { status: 'idle' };

function Section({
  step,
  title,
  hint,
  children,
}: {
  step: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5 sm:p-7">
      <p className="text-primary text-xs font-semibold tracking-wide uppercase">Langkah {step}</p>
      <h2 className="mt-1 text-lg font-semibold">{title}</h2>
      {hint && <p className="text-fg-muted mt-1 text-sm">{hint}</p>}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </Card>
  );
}

export function ProviderSignupForm() {
  const [state, action, pending] = useActionState(registerProviderAction, initial);
  const fe = state.fieldErrors ?? {};
  const v = state.values ?? {};
  const techs = (v.technologies ?? 'FIBER').split(',');

  return (
    <form action={action} noValidate className="space-y-5">
      {state.message && !Object.keys(fe).length && <Alert tone="danger">{state.message}</Alert>}
      {Object.keys(fe).length > 0 && (
        <Alert tone="danger">Periksa kembali isian yang ditandai.</Alert>
      )}

      <Section
        step={1}
        title="Data perusahaan"
        hint="Diperiksa tim GMM saat verifikasi. Belum tampil ke publik sebelum disetujui."
      >
        <Field
          id="displayName"
          label="Nama merek layanan"
          required
          hint="Nama yang dikenal pelanggan, mis. Contoh Net"
          error={fe.displayName}
        >
          {(aria) => (
            <Input
              {...aria}
              name="displayName"
              defaultValue={v.displayName}
              required
              maxLength={80}
            />
          )}
        </Field>
        <Field
          id="legalName"
          label="Nama badan usaha"
          required
          hint="Sesuai akta, mis. PT Contoh Net Indonesia"
          error={fe.legalName}
        >
          {(aria) => (
            <Input {...aria} name="legalName" defaultValue={v.legalName} required maxLength={160} />
          )}
        </Field>
        <Field
          id="nib"
          label="NIB"
          hint="13 digit dari OSS. Boleh dilengkapi nanti."
          error={fe.nib}
        >
          {(aria) => (
            <Input {...aria} name="nib" inputMode="numeric" defaultValue={v.nib} maxLength={13} />
          )}
        </Field>
        <Field id="address" label="Alamat kantor" required error={fe.address}>
          {(aria) => (
            <Input {...aria} name="address" defaultValue={v.address} required maxLength={300} />
          )}
        </Field>
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-sm font-medium">
            Teknologi layanan
            <span aria-hidden="true" className="text-danger-fg ml-0.5">
              *
            </span>
          </legend>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {TECH.map(([val, label]) => (
              <Checkbox
                key={val}
                name="technologies"
                value={val}
                label={label}
                defaultChecked={techs.includes(val)}
              />
            ))}
          </div>
          {fe.technologies && (
            <p className="text-danger-fg mt-1.5 text-[13px]" role="alert">
              {fe.technologies}
            </p>
          )}
        </fieldset>
        <Field
          id="serviceAreaNames"
          label="Wilayah layanan"
          hint="Satu per baris, mis. Jakarta Selatan. Area persisnya diatur setelah masuk portal."
          error={fe.serviceAreaNames}
          className="sm:col-span-2"
        >
          {(aria) => (
            <Textarea {...aria} name="serviceAreaNames" defaultValue={v.serviceAreaNames} />
          )}
        </Field>
      </Section>

      <Section
        step={2}
        title="Penanggung jawab & akun"
        hint="Akun ini menjadi pemilik akun provider di Portal Provider."
      >
        <Field id="fullName" label="Nama penanggung jawab" required error={fe.fullName}>
          {(aria) => (
            <Input
              {...aria}
              name="fullName"
              autoComplete="name"
              defaultValue={v.fullName}
              required
              maxLength={120}
            />
          )}
        </Field>
        <Field
          id="phone"
          label="Nomor ponsel"
          required
          hint="Untuk dihubungi tim verifikasi GMM"
          error={fe.phone}
        >
          {(aria) => (
            <Input
              {...aria}
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              defaultValue={v.phone}
              required
            />
          )}
        </Field>
        <Field id="email" label="Email kerja" required error={fe.email} className="sm:col-span-2">
          {(aria) => (
            <Input
              {...aria}
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={v.email}
              required
            />
          )}
        </Field>
        <Field
          id="password"
          label="Kata sandi"
          required
          hint="Minimal 10 karakter"
          error={fe.password}
        >
          {(aria) => (
            <PasswordInput {...aria} name="password" autoComplete="new-password" required />
          )}
        </Field>
        <Field id="passwordConfirm" label="Ulangi kata sandi" required error={fe.passwordConfirm}>
          {(aria) => (
            <PasswordInput {...aria} name="passwordConfirm" autoComplete="new-password" required />
          )}
        </Field>
      </Section>

      <Card className="p-5 sm:p-7">
        <Checkbox
          name="terms"
          label={
            <>
              Saya berwenang mewakili perusahaan ini dan menyetujui{' '}
              <Link href="/terms" className="text-primary underline">
                Syarat Layanan
              </Link>{' '}
              serta{' '}
              <Link href="/privacy" className="text-primary underline">
                Kebijakan Privasi
              </Link>{' '}
              GMM.
            </>
          }
        />
        {fe.terms && (
          <p className="text-danger-fg mt-1.5 text-[13px]" role="alert">
            {fe.terms}
          </p>
        )}
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-fg-muted text-sm">
            Sudah punya akun provider?{' '}
            <Link href="/login?next=/provider-dashboard" className="text-primary font-medium">
              Masuk
            </Link>
          </p>
          <Button type="submit" size="lg" loading={pending}>
            Daftarkan perusahaan
          </Button>
        </div>
      </Card>
    </form>
  );
}
