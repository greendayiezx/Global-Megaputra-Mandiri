import { createStateMachine, type TransitionTable } from '@/lib/state-machine';

export const REQUEST_STATUSES = [
  'NEW',
  'CONTACTED',
  'SURVEY_SCHEDULED',
  'FORWARDED',
  'DONE',
  'CANCELLED',
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];
export type RequestKind = 'SURVEY' | 'INSTALLATION';

/** Work moves forward only; closed requests stay closed (a new request is made instead). */
const TRANSITIONS: TransitionTable<RequestStatus> = {
  NEW: {
    CONTACTED: { actors: ['PLATFORM'] },
    SURVEY_SCHEDULED: { actors: ['PLATFORM'] },
    FORWARDED: { actors: ['PLATFORM'] },
    CANCELLED: { actors: ['PLATFORM'], requiresReason: true },
  },
  CONTACTED: {
    SURVEY_SCHEDULED: { actors: ['PLATFORM'] },
    FORWARDED: { actors: ['PLATFORM'] },
    DONE: { actors: ['PLATFORM'] },
    CANCELLED: { actors: ['PLATFORM'], requiresReason: true },
  },
  SURVEY_SCHEDULED: {
    FORWARDED: { actors: ['PLATFORM'] },
    DONE: { actors: ['PLATFORM'] },
    CANCELLED: { actors: ['PLATFORM'], requiresReason: true },
  },
  FORWARDED: {
    DONE: { actors: ['PLATFORM'] },
    CANCELLED: { actors: ['PLATFORM'], requiresReason: true },
  },
};

export const requestStateMachine = createStateMachine('service request', TRANSITIONS);

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  NEW: 'Diterima',
  CONTACTED: 'Sudah dihubungi',
  SURVEY_SCHEDULED: 'Survei dijadwalkan',
  FORWARDED: 'Diteruskan ke provider',
  DONE: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

export const REQUEST_STATUS_TONE: Record<
  RequestStatus,
  'neutral' | 'primary' | 'success' | 'warning' | 'danger'
> = {
  NEW: 'warning',
  CONTACTED: 'primary',
  SURVEY_SCHEDULED: 'primary',
  FORWARDED: 'primary',
  DONE: 'success',
  CANCELLED: 'neutral',
};

export const REQUEST_KIND_LABEL: Record<RequestKind, string> = {
  SURVEY: 'Survei lokasi',
  INSTALLATION: 'Minat pemasangan',
};

/** Shown next to the checkbox; bump the version whenever the wording changes. */
export const REQUEST_CONSENT_VERSION = 'permintaan-v1';
export const REQUEST_CONSENT_TEXT =
  'Saya setuju GMM menghubungi saya dan membagikan data ini kepada provider terkait, hanya untuk keperluan survei dan pemasangan internet.';

const REF_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** GMM-XXXXXX without look-alike characters (0/O, 1/I/L). */
export function newRefCode(random: (n: number) => Uint8Array): string {
  const bytes = random(6);
  return `GMM-${Array.from(bytes, (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join('')}`;
}

export function normalizeRefCode(raw: string): string {
  const s = raw.trim().toUpperCase().replace(/\s+/g, '');
  return s.startsWith('GMM-') ? s : `GMM-${s.replace(/^GMM/, '')}`;
}
