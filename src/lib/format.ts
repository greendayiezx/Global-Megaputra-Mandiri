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

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Jakarta',
});

/** "18 Okt, 14.05" in WIB. */
export function formatDateTime(date: Date): string {
  return dateTimeFormatter.format(date);
}

/** Age for queues: "baru saja", "35 menit", "5 jam", "3 hari". */
export function formatAge(date: Date, now = new Date()): string {
  const minutes = Math.max(0, Math.round((now.getTime() - date.getTime()) / 60_000));
  if (minutes < 1) return 'baru saja';
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} jam`;
  return `${Math.round(hours / 24)} hari`;
}
