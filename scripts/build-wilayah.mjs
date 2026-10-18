// Builds public/data/wilayah/* from cahyadsn/wilayah (MIT), Kepmendagri No 300.2.2-2138/2025.
// Usage: node scripts/build-wilayah.mjs <wilayah.sql> <wilayah_level_1_2.sql>
// Output: provinces.json (provinces with their cities and centre points) and one
// cities/<kode>.json per city with its districts and villages, loaded on demand.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [names, coords] = process.argv.slice(2);
if (!names || !coords) {
  console.error('usage: node scripts/build-wilayah.mjs <wilayah.sql> <wilayah_level_1_2.sql>');
  process.exit(1);
}

const title = (s) =>
  s
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/(^|[\s(/-])([a-z])/g, (_, p, c) => p + c.toUpperCase())
    .replace(/\bDki\b/, 'DKI')
    .replace(/\bDi\b/, 'DI');

const nameOf = new Map();
for (const m of readFileSync(names, 'utf8').matchAll(/\('([\d.]+)','((?:[^'\\]|\\.|'')*)'\)/g)) {
  nameOf.set(m[1], m[2].replace(/''/g, "'").replace(/\\'/g, "'"));
}

const point = new Map();
const coordSql = readFileSync(coords, 'utf8');
for (const m of coordSql.matchAll(
  /\('([\d.]+)','(?:[^'\\]|\\.|'')*','(?:[^'\\]|\\.|'')*',\s*(-?[\d.]+|NULL),\s*(-?[\d.]+|NULL)/g,
)) {
  if (m[2] !== 'NULL' && m[3] !== 'NULL') point.set(m[1], [Number(m[2]), Number(m[3])]);
}

const level = (k) => k.split('.').length;
const codes = [...nameOf.keys()].sort();
const childrenOf = new Map();
for (const k of codes) {
  const parent = k.split('.').slice(0, -1).join('.');
  if (!childrenOf.has(parent)) childrenOf.set(parent, []);
  childrenOf.get(parent).push(k);
}
const kids = (k) => childrenOf.get(k) ?? [];
const out = join('public', 'data', 'wilayah');
rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'cities'), { recursive: true });

const r5 = (n) => Math.round(n * 1e5) / 1e5;
const provinces = kids('').map((p) => ({
  c: p,
  n: title(nameOf.get(p)),
  cities: kids(p).map((k) => {
    const pt = point.get(k) ?? point.get(p);
    return { c: k, n: title(nameOf.get(k)), ...(pt ? { lat: r5(pt[0]), lng: r5(pt[1]) } : {}) };
  }),
}));

let villages = 0;
for (const p of provinces) {
  for (const city of p.cities) {
    const districts = kids(city.c).map((d) => {
      const v = kids(d).map((k) => [k.slice(d.length + 1), title(nameOf.get(k))]);
      villages += v.length;
      return { c: d, n: title(nameOf.get(d)), v };
    });
    writeFileSync(join(out, 'cities', `${city.c}.json`), JSON.stringify(districts));
  }
}
writeFileSync(
  join(out, 'provinces.json'),
  JSON.stringify({
    source: 'Kepmendagri No 300.2.2-2138 Tahun 2025, via github.com/cahyadsn/wilayah (MIT)',
    provinces,
  }),
);
console.log(
  `provinces ${provinces.length}, cities ${provinces.reduce((a, p) => a + p.cities.length, 0)}, villages ${villages}`,
);
