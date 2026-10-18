import Link from 'next/link';
import { whatsappLink } from '@/config/contact';
import { cn } from '@/lib/utils';
import { WhatsAppIcon } from './whatsapp-icon';

/** Inline "ask GMM on WhatsApp" row, placed where visitors tend to get stuck. */
export function ConsultPrompt({
  title,
  body,
  message,
  action,
  className,
}: {
  title: string;
  body?: string;
  message: string;
  /** Optional in-site alternative, e.g. a survey request form. */
  action?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-[#25D366]/30 bg-[#25D366]/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div>
        <p className="font-semibold">{title}</p>
        {body && <p className="text-fg-secondary mt-0.5 text-sm">{body}</p>}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {action && (
          <Link
            href={action.href}
            className="border-line-strong bg-surface hover:bg-subtle inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-semibold transition-colors"
          >
            {action.label}
          </Link>
        )}
        <a
          href={whatsappLink(message)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-[#25D366] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1ebe5b]"
        >
          <WhatsAppIcon className="size-4.5" /> Tanya tim GMM
        </a>
      </div>
    </div>
  );
}
