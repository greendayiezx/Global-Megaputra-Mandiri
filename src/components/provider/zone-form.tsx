'use client';

import { useEffect, useRef, useState } from 'react';
import { RegionPicker } from '@/components/coverage/region-picker';
import { useStickyAction } from '@/components/dashboard/use-sticky-action';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { Alert } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';
import { addZoneAction } from '@/modules/coverage/api/actions';

function ResultSelect({ error }: { error?: string }) {
  return (
    <Field id="zone-result" label="Status layanan" required error={error}>
      {(aria) => (
        <Select {...aria} name="result" defaultValue="AVAILABLE">
          <option value="AVAILABLE">Tersedia</option>
          <option value="LIMITED">Terbatas</option>
          <option value="REQUIRES_SURVEY">Perlu survei</option>
          <option value="EXCLUDED">Tidak dilayani (pengecualian)</option>
        </Select>
      )}
    </Field>
  );
}

export function ZoneForm() {
  const { state, onSubmit, pending } = useStickyAction(addZoneAction);
  const [mode, setMode] = useState<'RADIUS' | 'ADMIN_AREA'>('RADIUS');
  const [region, setRegion] = useState<{ code: string; label: string } | null>(null);
  const [pickerKey, setPickerKey] = useState(0);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === 'success') {
      ref.current?.reset();
      setRegion(null);
      setPickerKey((k) => k + 1);
    }
  }, [state]);
  const err = (k: string) => state.fieldErrors?.[k];

  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="strategy" value={mode} />
      <div
        role="tablist"
        aria-label="Jenis area"
        className="bg-subtle grid grid-cols-2 gap-1 rounded-lg p-1"
      >
        {(
          [
            ['RADIUS', 'Radius dari titik'],
            ['ADMIN_AREA', 'Kecamatan / kelurahan'],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              'rounded-md px-3 py-2 text-sm font-medium transition-colors',
              mode === m ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {state.status !== 'idle' && state.message && (
        <Alert tone={state.status === 'success' ? 'success' : 'danger'}>{state.message}</Alert>
      )}

      {mode === 'RADIUS' ? (
        <>
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
            Cara mendapatkan koordinat: buka Google Maps, klik kanan titik tengah area, lalu klik
            angka koordinat untuk menyalinnya.
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
            <ResultSelect error={err('result')} />
          </div>
        </>
      ) : (
        <>
          <input type="hidden" name="regionCode" value={region?.code ?? ''} />
          <input type="hidden" name="regionLabel" value={region?.label ?? ''} />
          <div>
            <p className="mb-1.5 text-sm font-medium">
              Wilayah
              <span aria-hidden="true" className="text-danger-fg ml-0.5">
                *
              </span>
            </p>
            <RegionPicker
              key={pickerKey}
              idPrefix="zone-region"
              onChange={(s) => setRegion(s ? { code: s.code, label: s.label } : null)}
            />
            {err('regionCode') ? (
              <p className="text-danger-fg mt-1.5 text-[13px]" role="alert">
                {err('regionCode')}
              </p>
            ) : (
              <p className="text-fg-muted mt-1.5 text-[13px]">
                Pilih sampai kecamatan (seluruh kecamatan) atau kelurahan. Area radius Anda di
                lokasi yang sama lebih diutamakan.
              </p>
            )}
          </div>
          <ResultSelect error={err('result')} />
        </>
      )}
      <Button type="submit" loading={pending}>
        Tambah area
      </Button>
    </form>
  );
}
