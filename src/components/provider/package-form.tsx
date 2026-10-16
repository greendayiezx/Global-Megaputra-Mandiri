'use client';

import { useStickyAction } from '@/components/dashboard/use-sticky-action';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field';
import { Alert, Card } from '@/components/ui/primitives';
import { saveOwnPackageAction } from '@/modules/packages/api/actions';

export interface PackageValues {
  name: string;
  description: string;
  downloadMbps: string;
  uploadMbps: string;
  technology: string;
  monthlyPrice: string;
  installationFee: string;
  activationFee: string;
  taxIncluded: boolean;
  contractMonths: string;
  routerIncluded: boolean;
  fupPolicy: string;
  slaSummary: string;
  supportHours: string;
  estInstallationDaysMin: string;
  estInstallationDaysMax: string;
  features: string;
}

export const EMPTY_PACKAGE: PackageValues = {
  name: '',
  description: '',
  downloadMbps: '',
  uploadMbps: '',
  technology: 'FIBER',
  monthlyPrice: '',
  installationFee: '0',
  activationFee: '0',
  taxIncluded: false,
  contractMonths: '0',
  routerIncluded: true,
  fupPolicy: '',
  slaSummary: '',
  supportHours: '',
  estInstallationDaysMin: '',
  estInstallationDaysMax: '',
  features: '',
};

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="font-semibold">{title}</h2>
      {hint && <p className="text-fg-muted mt-1 text-sm">{hint}</p>}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </Card>
  );
}

export function PackageForm({
  id,
  values,
  disabled,
  live,
}: {
  id?: string;
  values: PackageValues;
  disabled?: boolean;
  /** Published: warn that material edits send it back to review. */
  live?: boolean;
}) {
  const { state, onSubmit, pending } = useStickyAction(saveOwnPackageAction);
  const err = (k: string) => state.fieldErrors?.[k];
  const num = (
    name: keyof PackageValues,
    label: string,
    opts: { suffix?: string; hint?: string; required?: boolean } = {},
  ) => (
    <Field
      id={name}
      label={label}
      required={opts.required ?? true}
      hint={opts.hint}
      error={err(name)}
    >
      {(aria) => (
        <div className="relative">
          <Input
            {...aria}
            name={name}
            inputMode="numeric"
            pattern="[0-9]*"
            defaultValue={values[name] as string}
            disabled={disabled}
            required={opts.required ?? true}
            className={opts.suffix ? 'pr-16' : undefined}
          />
          {opts.suffix && (
            <span className="text-fg-muted pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">
              {opts.suffix}
            </span>
          )}
        </div>
      )}
    </Field>
  );
  const text = (
    name: keyof PackageValues,
    label: string,
    opts: { hint?: string; required?: boolean; wide?: boolean } = {},
  ) => (
    <Field
      id={name}
      label={label}
      required={opts.required}
      hint={opts.hint}
      error={err(name)}
      className={opts.wide ? 'sm:col-span-2' : undefined}
    >
      {(aria) => (
        <Input
          {...aria}
          name={name}
          defaultValue={values[name] as string}
          disabled={disabled}
          required={opts.required}
        />
      )}
    </Field>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {id && <input type="hidden" name="id" value={id} />}
      {state.status !== 'idle' && state.message && (
        <Alert tone={state.status === 'success' ? 'success' : 'danger'}>{state.message}</Alert>
      )}
      {live && (
        <Alert tone="warning">
          Paket ini sedang tampil. Mengubah harga, kecepatan, teknologi, kontrak, router, atau FUP
          akan menurunkannya dari marketplace sampai ditinjau ulang GMM.
        </Alert>
      )}
      <Section title="Paket">
        {text('name', 'Nama paket', { required: true, hint: 'Mis. Rumah 50 Mbps.' })}
        <Field id="technology" label="Teknologi" required error={err('technology')}>
          {(aria) => (
            <Select
              {...aria}
              name="technology"
              defaultValue={values.technology}
              disabled={disabled}
            >
              <option value="FIBER">Fiber optik</option>
              <option value="FIXED_WIRELESS">Fixed wireless</option>
              <option value="CABLE">Kabel coaxial</option>
              <option value="SATELLITE">Satelit</option>
            </Select>
          )}
        </Field>
        <Field
          id="description"
          label="Deskripsi"
          error={err('description')}
          className="sm:col-span-2"
        >
          {(aria) => (
            <Textarea
              {...aria}
              name="description"
              defaultValue={values.description}
              disabled={disabled}
            />
          )}
        </Field>
        {num('downloadMbps', 'Kecepatan download', { suffix: 'Mbps' })}
        {num('uploadMbps', 'Kecepatan upload', { suffix: 'Mbps' })}
      </Section>
      <Section
        title="Harga & biaya"
        hint="Semua biaya wajib diisi; tulis 0 bila gratis. Rupiah tanpa titik."
      >
        {num('monthlyPrice', 'Harga bulanan', { suffix: 'Rp' })}
        {num('installationFee', 'Biaya instalasi', { suffix: 'Rp' })}
        {num('activationFee', 'Biaya aktivasi', { suffix: 'Rp' })}
        {num('contractMonths', 'Masa kontrak', { suffix: 'bulan', hint: '0 = tanpa kontrak.' })}
        <div className="flex flex-col gap-3 sm:col-span-2">
          <Checkbox
            name="taxIncluded"
            label="Harga sudah termasuk pajak (PPN)"
            defaultChecked={values.taxIncluded}
            disabled={disabled}
          />
          <Checkbox
            name="routerIncluded"
            label="Router termasuk dalam paket"
            defaultChecked={values.routerIncluded}
            disabled={disabled}
          />
        </div>
      </Section>
      <Section title="Layanan">
        {text('supportHours', 'Jam dukungan', {
          required: true,
          hint: 'Mis. 24 jam / 08.00–22.00 WIB.',
        })}
        {text('slaSummary', 'Ringkasan SLA', { hint: 'Kosongkan bila tidak ada.' })}
        {num('estInstallationDaysMin', 'Instalasi paling cepat', { suffix: 'hari' })}
        {num('estInstallationDaysMax', 'Instalasi paling lama', { suffix: 'hari' })}
        {text('fupPolicy', 'Kebijakan FUP', {
          wide: true,
          hint: 'Kosongkan bila tanpa FUP. Mis. turun ke 10 Mbps setelah 500 GB/bulan.',
        })}
        <Field
          id="features"
          label="Keterangan tambahan"
          hint='Satu per baris dengan format "Label: nilai", mis. "IP publik: Tersedia".'
          error={err('features')}
          className="sm:col-span-2"
        >
          {(aria) => (
            <Textarea
              {...aria}
              name="features"
              defaultValue={values.features}
              disabled={disabled}
            />
          )}
        </Field>
      </Section>
      {!disabled && (
        <div className="flex justify-end">
          <Button type="submit" loading={pending} size="lg">
            {id ? 'Simpan perubahan' : 'Simpan sebagai draf'}
          </Button>
        </div>
      )}
    </form>
  );
}
