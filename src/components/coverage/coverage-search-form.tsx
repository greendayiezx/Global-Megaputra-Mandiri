'use client';

import { Crosshair, MapPin, Search } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FieldError, FieldHint, Input, Label } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';
import type { GeoPoint } from '@/modules/coverage/domain/coverage';

const LocationMap = dynamic(() => import('./location-map').then((m) => m.LocationMap), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});

/** Homepage hero: address first, then the pin is confirmed on the coverage page map. */
export function HeroLocationForm() {
  return (
    <form action="/coverage" method="get" className="w-full">
      <label htmlFor="hero-address" className="sr-only">
        Masukkan alamat pemasangan Anda
      </label>
      <div className="border-line-strong bg-surface shadow-card flex flex-col gap-2 rounded-lg border p-2 sm:flex-row">
        <div className="relative flex-1">
          <MapPin
            aria-hidden="true"
            className="text-primary pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2"
          />
          <input
            id="hero-address"
            name="address"
            autoComplete="street-address"
            placeholder="Masukkan alamat pemasangan Anda"
            className="placeholder:text-fg-muted h-12 w-full rounded-md bg-transparent pr-3 pl-10 text-[15px] focus:outline-none"
          />
        </div>
        <Button type="submit" size="lg">
          <Search aria-hidden="true" />
          Cek Ketersediaan
        </Button>
      </div>
    </form>
  );
}

type GeoState = { kind: 'idle' } | { kind: 'locating' } | { kind: 'error'; message: string };

/** Coverage page: address note + map pin (source of truth) + device location. */
export function CoverageLocator({
  defaultAddress = '',
  defaultPoint = null,
  carry = {},
}: {
  defaultAddress?: string;
  defaultPoint?: GeoPoint | null;
  carry?: Record<string, string>;
}) {
  const [point, setPoint] = useState<GeoPoint | null>(defaultPoint);
  const [geo, setGeo] = useState<GeoState>({ kind: 'idle' });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function locate() {
    if (!('geolocation' in navigator)) {
      setGeo({ kind: 'error', message: 'Browser Anda tidak mendukung deteksi lokasi.' });
      return;
    }
    setGeo({ kind: 'locating' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPoint({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeo({ kind: 'idle' });
        setSubmitError(null);
      },
      (err) =>
        setGeo({
          kind: 'error',
          message:
            err.code === err.PERMISSION_DENIED
              ? 'Izin lokasi ditolak. Tandai titik pemasangan langsung di peta.'
              : 'Lokasi tidak dapat dideteksi. Tandai titik pemasangan di peta.',
        }),
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  }

  return (
    <form
      ref={formRef}
      action="/coverage"
      method="get"
      noValidate
      onSubmit={(e) => {
        if (!point) {
          e.preventDefault();
          setSubmitError('Tandai titik pemasangan di peta atau gunakan lokasi Anda.');
        }
      }}
      className="space-y-4"
    >
      {Object.entries(carry).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <input type="hidden" name="lat" value={point ? point.lat.toFixed(6) : ''} />
      <input type="hidden" name="lng" value={point ? point.lng.toFixed(6) : ''} />

      <div>
        <Label htmlFor="cov-address">Alamat pemasangan</Label>
        <Input
          id="cov-address"
          name="address"
          defaultValue={defaultAddress}
          autoComplete="street-address"
          placeholder="Masukkan alamat pemasangan"
          aria-describedby="cov-address-hint"
        />
        <FieldHint id="cov-address-hint">
          Alamat menjadi catatan untuk teknisi. Hasil cek ditentukan oleh titik pin di peta.
        </FieldHint>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <p className="text-sm font-medium" id="map-label">
            Titik pemasangan{' '}
            <span className="text-danger-fg" aria-hidden="true">
              *
            </span>
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={locate}
            loading={geo.kind === 'locating'}
            className="text-primary"
          >
            {geo.kind !== 'locating' && <Crosshair aria-hidden="true" />}
            Lokasi saya
          </Button>
        </div>
        <div
          className={cn(
            'relative h-72 overflow-hidden rounded-md border sm:h-80',
            submitError ? 'border-danger-fg' : 'border-line-strong',
          )}
          aria-labelledby="map-label"
        >
          <LocationMap
            value={point}
            onChange={(p) => {
              setPoint(p);
              setSubmitError(null);
            }}
            className="h-full w-full"
          />
        </div>
        <p className="text-fg-muted mt-1.5 text-[13px]" aria-live="polite">
          {point
            ? `Pin: ${point.lat.toFixed(5)}, ${point.lng.toFixed(5)} — geser pin bila belum tepat.`
            : 'Klik peta pada lokasi rumah/kantor Anda untuk menaruh pin.'}
        </p>
        <FieldError>{geo.kind === 'error' ? geo.message : submitError}</FieldError>
      </div>

      <Button type="submit" size="lg" className="w-full">
        <Search aria-hidden="true" />
        Cek Ketersediaan
      </Button>
    </form>
  );
}
