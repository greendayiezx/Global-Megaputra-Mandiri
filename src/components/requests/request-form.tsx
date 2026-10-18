'use client';

import { useStickyAction } from '@/components/dashboard/use-sticky-action';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Textarea } from '@/components/ui/field';
import { Alert } from '@/components/ui/primitives';
import { submitRequestAction } from '@/modules/requests/api/actions';
import { REQUEST_CONSENT_TEXT } from '@/modules/requests/domain/request-rules';

export function RequestForm({
  kind,
  lat,
  lng,
  packageSlug,
  address,
}: {
  kind: 'SURVEY' | 'INSTALLATION';
  lat: number | null;
  lng: number | null;
  packageSlug: string | null;
  address: string;
}) {
  const { state, onSubmit, pending } = useStickyAction(submitRequestAction);
  const err = (k: string) => state.fieldErrors?.[k];

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <input type="hidden" name="kind" value={kind} />
      {lat !== null && <input type="hidden" name="lat" value={lat} />}
      {lng !== null && <input type="hidden" name="lng" value={lng} />}
      {packageSlug && <input type="hidden" name="package" value={packageSlug} />}
      {state.status === 'error' && state.message && <Alert tone="danger">{state.message}</Alert>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="r-name" label="Nama" required error={err('name')}>
          {(aria) => <Input {...aria} name="name" autoComplete="name" maxLength={80} required />}
        </Field>
        <Field id="r-phone" label="Nomor ponsel (WhatsApp)" required error={err('phone')}>
          {(aria) => (
            <Input {...aria} name="phone" type="tel" inputMode="tel" autoComplete="tel" required />
          )}
        </Field>
        <Field
          id="r-email"
          label="Email"
          hint="Opsional"
          error={err('email')}
          className="sm:col-span-2"
        >
          {(aria) => <Input {...aria} name="email" type="email" autoComplete="email" />}
        </Field>
        <Field
          id="r-address"
          label="Alamat pemasangan"
          required
          hint="Nama jalan, nomor, RT/RW, kelurahan, kecamatan, kota"
          error={err('address')}
          className="sm:col-span-2"
        >
          {(aria) => (
            <Input {...aria} name="address" defaultValue={address} maxLength={300} required />
          )}
        </Field>
        <Field
          id="r-note"
          label="Catatan"
          hint="Opsional, mis. waktu yang nyaman dihubungi, jumlah lantai"
          error={err('note')}
          className="sm:col-span-2"
        >
          {(aria) => <Textarea {...aria} name="note" maxLength={600} />}
        </Field>
      </div>
      <div>
        <Checkbox name="consent" label={REQUEST_CONSENT_TEXT} />
        {err('consent') && (
          <p className="text-danger-fg mt-1.5 text-[13px]" role="alert">
            {err('consent')}
          </p>
        )}
      </div>
      <Button type="submit" size="lg" loading={pending} className="w-full sm:w-auto">
        Kirim permintaan
      </Button>
    </form>
  );
}
