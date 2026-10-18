'use client';

import { usePathname } from 'next/navigation';
import { whatsappLink } from '@/config/contact';
import { WhatsAppIcon } from './whatsapp-icon';

/** Pages that already lead with the consultation form. */
const HIDDEN_ON = ['/konsultasi'];

/**
 * Floating WhatsApp shortcut on public pages. The message is written at tap time from the
 * page the visitor is on, so the team knows what they were looking at.
 */
export function WhatsAppFab() {
  const pathname = usePathname();
  if (HIDDEN_ON.includes(pathname)) return null;

  const open = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const title = document.title.replace(/\s*[|·–—-]\s*GMM$/, '').trim();
    const where = pathname === '/' ? 'website GMM' : `halaman "${title}"`;
    e.currentTarget.href = whatsappLink(
      `Halo GMM, saya butuh bantuan memilih internet. Saya sedang melihat ${where} (${location.href}).`,
    );
  };

  return (
    <a
      href={whatsappLink('Halo GMM, saya butuh bantuan memilih internet.')}
      onClick={open}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Konsultasi gratis lewat WhatsApp"
      className="wa-fab group fixed right-4 bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] z-40 flex h-14 min-w-14 items-center justify-center gap-2 rounded-full bg-[#25D366] px-3.5 text-white shadow-[0_10px_30px_-8px_rgba(18,140,74,0.6)] transition-[transform,background-color] duration-200 hover:bg-[#1ebe5b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#128C4A] motion-safe:hover:-translate-y-0.5 sm:pr-5 lg:right-6 lg:bottom-6"
    >
      <WhatsAppIcon className="size-7" />
      <span className="hidden text-sm font-semibold sm:inline">Konsultasi</span>
    </a>
  );
}
