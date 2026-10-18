import { LockKeyhole } from 'lucide-react';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface ThreadMessage {
  id: string;
  authorKind: string;
  authorName: string | null;
  body: string;
  internal: boolean;
  createdAt: Date;
}

/** Conversation, oldest first. `viewer` decides which side is "mine". */
export function TicketThread({
  messages,
  viewer,
}: {
  messages: ThreadMessage[];
  viewer: 'CUSTOMER' | 'PLATFORM';
}) {
  return (
    <ol className="space-y-4">
      {messages.map((m) => {
        const mine = m.authorKind === viewer;
        return (
          <li key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[85%] rounded-2xl border px-4 py-3 text-sm sm:max-w-[75%]',
                m.internal
                  ? 'border-warning/40 bg-warning-soft'
                  : mine
                    ? 'border-primary/20 bg-primary-soft'
                    : 'border-line bg-surface',
              )}
            >
              <p className="text-fg-muted mb-1 flex flex-wrap items-center gap-1.5 text-xs">
                {m.internal && (
                  <span className="text-warning-fg inline-flex items-center gap-1 font-semibold">
                    <LockKeyhole className="size-3" aria-hidden="true" /> Catatan internal ·
                  </span>
                )}
                <span className="text-fg font-medium">{m.authorName ?? 'Tim GMM'}</span>·
                <time dateTime={m.createdAt.toISOString()}>{formatDateTime(m.createdAt)}</time>
              </p>
              <p className="whitespace-pre-wrap">{m.body}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
