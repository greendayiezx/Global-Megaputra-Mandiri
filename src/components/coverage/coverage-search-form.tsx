'use client';

import { Crosshair, Search } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
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

/**
 * Homepage hero: address first, then the pin is confirmed on the coverage page map.
 * Works without JavaScript (plain GET form); with JS the address is normalised first.
 */
export function HeroLocationForm({ className }: { className?: string }) {
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const raw = new FormData(e.currentTarget).get('address');
    const address = typeof raw === 'string' ? raw.trim().replace(/\s+/g, ' ').slice(0, 200) : '';
    router.push(address ? `/coverage?address=${encodeURIComponent(address)}` : '/coverage');
  }

  return (
    <form action="/coverage" method="get" onSubmit={onSubmit} className={cn('w-full', className)}>
      <label htmlFor="hero-address" className="sr-only">
        Masukkan alamat lengkap Anda
      </label>
      <div className="bg-surface focus-within:ring-primary/25 flex flex-col gap-2 rounded-xl p-2 shadow-[0_8px_24px_rgba(5,18,43,0.18)] transition-shadow focus-within:ring-3 sm:h-[60px] sm:flex-row sm:items-center sm:gap-0 sm:p-1.5 sm:pl-2">
        <div className="relative flex-1 self-stretch">
          <Search
            aria-hidden="true"
            className="text-fg-muted pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2"
          />
          <input
            id="hero-address"
            name="address"
            autoComplete="street-address"
            maxLength={200}
            placeholder="Masukkan alamat lengkap Anda"
            className="placeholder:text-fg-muted h-12 w-full rounded-lg bg-transparent pr-3 pl-10 text-[15px] focus:outline-none sm:h-full"
          />
        </div>
        <Button
          type="submit"
          className="h-11 w-full rounded-lg transition-colors duration-150 sm:w-auto sm:px-6"
        >
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
