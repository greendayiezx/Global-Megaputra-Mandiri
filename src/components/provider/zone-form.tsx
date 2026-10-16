'use client';

import { useEffect, useRef } from 'react';
import { useStickyAction } from '@/components/dashboard/use-sticky-action';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { Alert } from '@/components/ui/primitives';
import { addZoneAction } from '@/modules/coverage/api/actions';

export function ZoneForm() {
  const { state, onSubmit, pending } = useStickyAction(addZoneAction);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === 'success') ref.current?.reset();
  }, [state]);
  const err = (k: string) => state.fieldErrors?.[k];

  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-4">
      {state.status !== 'idle' && state.message && (
        <Alert tone={state.status === 'success' ? 'success' : 'danger'}>{state.message}</Alert>
      )}
      <Field
        id="zone-name"
        label="Nama area"
        required
        error={err('name')}
        hint="Mis. Kebayoran Baru – blok A"
      >
        {(aria) => <Input {...aria} name="name" required />}
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field id="zone-lat" label="Latitude titik tengah" required error={err('lat')}>
          {(aria) => (
            <Input {...aria} name="lat" inputMode="decimal" placeholder="-6.2440" required />
          )}
        </Field>
        <Field id="zone-lng" label="Longitude titik tengah" required error={err('lng')}>
          {(aria) => (
            <Input {...aria} name="lng" inputMode="decimal" placeholder="106.7990" required />
          )}
        </Field>
      </div>
      <p className="text-fg-muted text-[13px]">
        Cara mendapatkan koordinat: buka Google Maps, klik kanan titik tengah area, lalu klik angka
        koordinat untuk menyalinnya.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Field
          id="zone-radius"
          label="Radius"
          required
          error={err('radiusM')}
          hint="Meter (100–30.000)"
        >
          {(aria) => (
            <Input {...aria} name="radiusM" inputMode="numeric" defaultValue="1000" required />
          )}
        </Field>
        <Field id="zone-result" label="Status layanan" required error={err('result')}>
          {(aria) => (
            <Select {...aria} name="result" defaultValue="AVAILABLE">
              <option value="AVAILABLE">Tersedia</option>
              <option value="LIMITED">Terbatas</option>
              <option value="REQUIRES_SURVEY">Perlu survei</option>
              <option value="EXCLUDED">Tidak dilayani (pengecualian)</option>
            </Select>
          )}
        </Field>
      </div>
      <Button type="submit" loading={pending}>
        Tambah area
      </Button>
    </form>
  );
}
