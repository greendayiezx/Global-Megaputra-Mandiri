import { createStateMachine, type TransitionTable } from '@/lib/state-machine';

export const TICKET_STATUSES = [
  'OPEN',
  'IN_PROGRESS',
  'WAITING_CUSTOMER',
  'RESOLVED',
  'CLOSED',
] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];
export const TICKET_CATEGORIES = [
  'INSTALLATION',
  'SERVICE_ISSUE',
  'BILLING',
  'PROVIDER_COMPLAINT',
  'ACCOUNT',
  'OTHER',
] as const;
export type TicketCategory = (typeof TICKET_CATEGORIES)[number];

/**
 * Staff move tickets along; a customer reply reopens a ticket waiting on them or recently
 * resolved. CLOSED is final (a new ticket is opened instead).
 */
const TRANSITIONS: TransitionTable<TicketStatus> = {
  OPEN: {
    IN_PROGRESS: { actors: ['PLATFORM'] },
    WAITING_CUSTOMER: { actors: ['PLATFORM'] },
    RESOLVED: { actors: ['PLATFORM'] },
    CLOSED: { actors: ['PLATFORM'] },
  },
  IN_PROGRESS: {
    WAITING_CUSTOMER: { actors: ['PLATFORM'] },
    RESOLVED: { actors: ['PLATFORM'] },
    CLOSED: { actors: ['PLATFORM'] },
  },
  WAITING_CUSTOMER: {
    OPEN: { actors: ['CUSTOMER'] },
    IN_PROGRESS: { actors: ['PLATFORM'] },
    RESOLVED: { actors: ['PLATFORM'] },
    CLOSED: { actors: ['PLATFORM'] },
  },
  RESOLVED: {
    OPEN: { actors: ['CUSTOMER', 'PLATFORM'] },
    CLOSED: { actors: ['PLATFORM', 'CUSTOMER'] },
  },
};

export const ticketStateMachine = createStateMachine('ticket', TRANSITIONS);

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  OPEN: 'Terbuka',
  IN_PROGRESS: 'Sedang ditangani',
  WAITING_CUSTOMER: 'Menunggu balasan Anda',
  RESOLVED: 'Selesai',
  CLOSED: 'Ditutup',
};
/** Same statuses worded for GMM staff. */
export const TICKET_STATUS_STAFF_LABEL: Record<TicketStatus, string> = {
  ...TICKET_STATUS_LABEL,
  WAITING_CUSTOMER: 'Menunggu pelanggan',
};
export const TICKET_STATUS_TONE: Record<
  TicketStatus,
  'neutral' | 'primary' | 'success' | 'warning' | 'danger'
> = {
  OPEN: 'warning',
  IN_PROGRESS: 'primary',
  WAITING_CUSTOMER: 'neutral',
  RESOLVED: 'success',
  CLOSED: 'neutral',
};
export const TICKET_CATEGORY_LABEL: Record<TicketCategory, string> = {
  INSTALLATION: 'Pemasangan / survei',
  SERVICE_ISSUE: 'Gangguan layanan',
  BILLING: 'Tagihan & biaya',
  PROVIDER_COMPLAINT: 'Keluhan terhadap provider',
  ACCOUNT: 'Akun GMM',
  OTHER: 'Lainnya',
};
