/** Kemendagri region data served from /data/wilayah (built by scripts/build-wilayah.mjs). */
export interface City {
  c: string;
  n: string;
  lat?: number;
  lng?: number;
}
export interface Province {
  c: string;
  n: string;
  cities: City[];
}
export interface District {
  c: string;
  n: string;
  /** [suffix code, name]; full code = `${district.c}.${suffix}` */
  v: [string, string][];
}

let provinces: Promise<Province[]> | null = null;
const districtsByCity = new Map<string, Promise<District[]>>();

export function loadProvinces(): Promise<Province[]> {
  provinces ??= fetch('/data/wilayah/provinces.json')
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error('wilayah'))))
    .then((d: { provinces: Province[] }) => d.provinces)
    .catch((e) => {
      provinces = null;
      throw e;
    });
  return provinces;
}

export function loadDistricts(cityCode: string): Promise<District[]> {
  if (!/^\d{2}\.\d{2}$/.test(cityCode)) return Promise.resolve([]);
  let p = districtsByCity.get(cityCode);
  if (!p) {
    p = fetch(`/data/wilayah/cities/${cityCode}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('wilayah'))))
      .catch((e) => {
        districtsByCity.delete(cityCode);
        throw e;
      });
    districtsByCity.set(cityCode, p);
  }
  return p;
}
