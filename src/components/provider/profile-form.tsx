'use client';

import { useStickyAction } from '@/components/dashboard/use-sticky-action';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Textarea } from '@/components/ui/field';
import { Alert, Card } from '@/components/ui/primitives';
import { updateOwnProfileAction } from '@/modules/providers/api/actions';

export interface ProfileValues {
  displayName: string;
  legalName: string;
  nib: string;
  address: string;
  picName: string;
  picPhone: string;
  picEmail: string;
  description: string;
  website: string;
  supportPhone: string;
  supportEmail: string;
  supportHours: string;
  slaSummary: string;
  installationInfo: string;
  technologies: string[];
  serviceAreaNames: string;
}

const TECH: [string, string][] = [
  ['FIBER', 'Fiber optik'],
  ['FIXED_WIRELESS', 'Fixed wireless'],
  ['CABLE', 'Kabel coaxial'],
  ['SATELLITE', 'Satelit'],
];

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

export function ProfileForm({ values, locked }: { values: ProfileValues; locked: string[] }) {
  const { state, onSubmit, pending } = useStickyAction(updateOwnProfileAction);
  const err = (k: string) => state.fieldErrors?.[k];
  const text = (
    name: keyof ProfileValues,
    label: string,
    opts: {
      required?: boolean;
      hint?: string;
      type?: string;
      wide?: boolean;
      inputMode?: 'numeric' | 'tel' | 'email';
    } = {},
  ) => (
    <Field
      id={name}
      label={label}
      required={opts.required}
      hint={
        locked.includes(name)
          ? 'Terkunci setelah verifikasi; hubungi tim GMM untuk mengubah.'
          : opts.hint
      }
      error={err(name)}
      className={opts.wide ? 'sm:col-span-2' : undefined}
    >
      {(aria) => (
        <Input
          {...aria}
          name={name}
          type={opts.type ?? 'text'}
          inputMode={opts.inputMode}
          defaultValue={values[name] as string}
          readOnly={locked.includes(name)}
          required={opts.required}
        />
      )}
    </Field>
  );
  const area = (name: keyof ProfileValues, label: string, hint?: string) => (
    <Field id={name} label={label} hint={hint} error={err(name)} className="sm:col-span-2">
      {(aria) => <Textarea {...aria} name={name} defaultValue={values[name] as string} />}
    </Field>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {state.status !== 'idle' && state.message && (
        <Alert tone={state.status === 'success' ? 'success' : 'danger'}>{state.message}</Alert>
      )}
      <Section title="Identitas usaha" hint="Diperiksa tim GMM saat verifikasi.">
        {text('legalName', 'Nama badan usaha', {
          required: true,
          hint: 'Sesuai akta, mis. PT Contoh Net Indonesia.',
        })}
        {text('nib', 'NIB', { hint: '13 digit Nomor Induk Berusaha (OSS).', inputMode: 'numeric' })}
        {text('address', 'Alamat kantor', { wide: true })}
      </Section>
      <Section
        title="Penanggung jawab (PIC)"
        hint="Kontak internal untuk GMM; tidak ditampilkan ke pelanggan."
      >
        {text('picName', 'Nama PIC')}
        {text('picPhone', 'Telepon PIC', { type: 'tel', inputMode: 'tel' })}
        {text('picEmail', 'Email PIC', { type: 'email', inputMode: 'email' })}
      </Section>
      <Section title="Tampilan di marketplace" hint="Dilihat pelanggan di halaman provider Anda.">
        {text('displayName', 'Nama tampilan', { required: true })}
        {text('website', 'Situs web', { type: 'url', hint: 'Awali dengan https://' })}
        {area('description', 'Deskripsi singkat')}
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-sm font-medium">Teknologi</legend>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {TECH.map(([v, l]) => (
              <Checkbox
                key={v}
                name="technologies"
                value={v}
                label={l}
                defaultChecked={values.technologies.includes(v)}
              />
            ))}
          </div>
        </fieldset>
        {area(
          'serviceAreaNames',
          'Nama area layanan',
          'Satu per baris, mis. "Jakarta Selatan". Wilayah persisnya diatur di menu Area Layanan.',
        )}
      </Section>
      <Section title="Layanan pelanggan">
        {text('supportPhone', 'Telepon dukungan', { type: 'tel', inputMode: 'tel' })}
        {text('supportEmail', 'Email dukungan', { type: 'email', inputMode: 'email' })}
        {text('supportHours', 'Jam dukungan', { hint: 'Mis. Setiap hari 08.00–22.00 WIB.' })}
        {text('slaSummary', 'Ringkasan SLA', {
          hint: 'Tampil sebagai pernyataan provider, bukan jaminan GMM.',
        })}
        {area(
          'installationInfo',
          'Info pemasangan',
          'Langkah setelah pesanan: survei, jadwal teknisi, perangkat.',
        )}
      </Section>
      <div className="flex justify-end">
        <Button type="submit" loading={pending} size="lg">
          Simpan profil
        </Button>
      </div>
    </form>
  );
}
