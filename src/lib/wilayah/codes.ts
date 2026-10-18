/** Kemendagri code like 31.71.01.1001 (province.city.district.village). */
export const REGION_CODE = /^\d{2}(\.\d{2}(\.\d{2}(\.\d{4})?)?)?$/;

/** "31.71.01.1001" → ["31", "31.71", "31.71.01", "31.71.01.1001"]; invalid → []. */
export function regionChain(code: string | null | undefined): string[] {
  if (!code || !REGION_CODE.test(code)) return [];
  const parts = code.split('.');
  return parts.map((_, i) => parts.slice(0, i + 1).join('.'));
}
