'use client';

import { useEffect, useState } from 'react';
import { Select } from '@/components/ui/field';
import { regionChain } from '@/lib/wilayah/codes';
import {
  loadDistricts,
  loadProvinces,
  type City,
  type District,
  type Province,
} from '@/lib/wilayah/client';

export interface RegionSelection {
  /** Deepest selected code, e.g. 31.71.01.1001 (or a shorter prefix). */
  code: string;
  /** Human label, smallest unit first: "Kel. Gambir, Kec. Gambir, Kota … , DKI Jakarta". */
  label: string;
  /** Centre of the chosen city, when known. */
  city: City | null;
}

/**
 * Province → city → district → village, from the official Kemendagri list. Village data
 * per city is fetched only when that city is chosen.
 */
export function RegionPicker({
  initialCode,
  depth = 4,
  name,
  onChange,
  idPrefix = 'region',
}: {
  initialCode?: string | null;
  /** 3 = stop at district (kecamatan), 4 = village (kelurahan/desa). */
  depth?: 3 | 4;
  /** Form field carrying the deepest selected code. */
  name?: string;
  onChange?: (s: RegionSelection | null) => void;
  idPrefix?: string;
}) {
  const [provinces, setProvinces] = useState<Province[] | null>(null);
  const [districts, setDistricts] = useState<District[] | null>(null);
  const [failed, setFailed] = useState(false);
  const chain = regionChain(initialCode);
  const [prov, setProv] = useState(chain[0] ?? '');
  const [city, setCity] = useState(chain[1] ?? '');
  const [dist, setDist] = useState(chain[2] ?? '');
  const [vill, setVill] = useState(chain[3] ?? '');

  useEffect(() => {
    loadProvinces().then(setProvinces, () => setFailed(true));
  }, []);
  useEffect(() => {
    setDistricts(null);
    if (city) loadDistricts(city).then(setDistricts, () => setFailed(true));
  }, [city]);

  const province = provinces?.find((p) => p.c === prov) ?? null;
  const cityObj = province?.cities.find((c) => c.c === city) ?? null;
  const district = districts?.find((d) => d.c === dist) ?? null;
  const village = district?.v.find(([s]) => `${dist}.${s}` === vill) ?? null;
  const code = vill || dist || city || prov;

  useEffect(() => {
    if (!onChange) return;
    if (!code || !province) return onChange(null);
    const label = [village?.[1], district && `Kec. ${district.n}`, cityObj?.n, province.n]
      .filter(Boolean)
      .join(', ');
    onChange({ code, label, city: cityObj });
    // Report only when the selection itself changes.
  }, [code, provinces, districts]);

  if (failed) {
    return (
      <p className="text-fg-muted text-[13px]">
        Daftar wilayah gagal dimuat. Anda tetap bisa menandai titik langsung di peta.
      </p>
    );
  }

  const sel = (
    id: string,
    label: string,
    value: string,
    set: (v: string) => void,
    options: { value: string; label: string }[] | null,
    disabled: boolean,
  ) => (
    <div>
      <label htmlFor={`${idPrefix}-${id}`} className="sr-only">
        {label}
      </label>
      <Select
        id={`${idPrefix}-${id}`}
        value={value}
        onChange={(e) => set(e.target.value)}
        disabled={disabled || !options}
        className="h-10 text-sm"
      >
        <option value="">{options ? label : 'Memuat…'}</option>
        {options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {name && <input type="hidden" name={name} value={code} />}
      {sel(
        'prov',
        'Provinsi',
        prov,
        (v) => {
          setProv(v);
          setCity('');
          setDist('');
          setVill('');
        },
        provinces?.map((p) => ({ value: p.c, label: p.n })) ?? null,
        false,
      )}
      {sel(
        'city',
        'Kota / kabupaten',
        city,
        (v) => {
          setCity(v);
          setDist('');
          setVill('');
        },
        province ? province.cities.map((c) => ({ value: c.c, label: c.n })) : [],
        !prov,
      )}
      {sel(
        'dist',
        'Kecamatan',
        dist,
        (v) => {
          setDist(v);
          setVill('');
        },
        city ? (districts?.map((d) => ({ value: d.c, label: d.n })) ?? null) : [],
        !city,
      )}
      {depth === 4 &&
        sel(
          'vill',
          'Kelurahan / desa',
          vill,
          setVill,
          district ? district.v.map(([s, n]) => ({ value: `${dist}.${s}`, label: n })) : [],
          !dist,
        )}
    </div>
  );
}
