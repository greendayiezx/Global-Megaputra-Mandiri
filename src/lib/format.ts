export { formatRupiah } from './money';

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
});

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

export function formatSpeed(mbps: number): string {
  return `${mbps} Mbps`;
}

export function formatInstallWindow(min: number | null, max: number | null): string {
  if (min === null || max === null) return 'Belum ditentukan';
  return min === max ? `${min} hari kerja` : `${min}–${max} hari kerja`;
}

export function formatContract(months: number): string {
  return months === 0 ? 'Tanpa kontrak' : `${months} bulan`;
}
