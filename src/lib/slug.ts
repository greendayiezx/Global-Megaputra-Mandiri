/** URL-safe lowercase slug: "PT Contoh Net" → "pt-contoh-net". */
export function kebab(s: string, max = 60): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
    .replace(/-+$/, '');
}

/** First of base, base-2, base-3, … not in `taken`. */
export function firstFreeSlug(base: string, taken: ReadonlySet<string>): string {
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}
