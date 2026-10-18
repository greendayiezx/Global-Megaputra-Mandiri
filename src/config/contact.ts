/**
 * GMM consultation channel. The number can be overridden per environment with
 * NEXT_PUBLIC_WHATSAPP_NUMBER (local format 08… or international 628…).
 */
const RAW = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '085397074845';

/** wa.me wants the international form without "+" or leading zero: 0853… → 62853… */
export const WHATSAPP_NUMBER = RAW.replace(/\D/g, '').replace(/^0/, '62');

export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * Consultation photos in public/images. Hero: wide banner for /konsultasi (2880×900).
 * Card: homepage block (1600×1200, 4:3); falls back to the hero photo, then a stock one.
 */
export const CONSULT_IMAGE = '/images/Konsultasi_GMM.png';
export const CONSULT_CARD_IMAGE = '/images/Konsultasi_GMM_Card.png';
export const CONSULT_IMAGE_FALLBACK = '/images/Hub%20Konektivitas%20Digital%20Modern.png';
