/**
 * GMM consultation channel. The number can be overridden per environment with
 * NEXT_PUBLIC_WHATSAPP_NUMBER (local format 08… or international 628…).
 */
const RAW = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '085397074845';

/** wa.me wants the international form without "+" or leading zero: 0853… → 62853… */
export const WHATSAPP_NUMBER = RAW.replace(/\D/g, '').replace(/^0/, '62');

/** Human-readable form, e.g. 0853-9707-4845. */
export const WHATSAPP_DISPLAY = `0${WHATSAPP_NUMBER.slice(2)}`.replace(
  /^(\d{4})(\d{4})(\d+)$/,
  '$1-$2-$3',
);

export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/** Photo for consultation sections; falls back until the file is added to public/images. */
export const CONSULT_IMAGE = '/images/Konsultasi_GMM.png';
export const CONSULT_IMAGE_FALLBACK = '/images/Hub%20Konektivitas%20Digital%20Modern.png';
