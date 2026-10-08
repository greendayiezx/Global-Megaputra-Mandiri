import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  completedTimelineIndex,
  CUSTOMER_TIMELINE_STEPS,
  type CustomerTimelineStep,
  type OrderStatus,
} from '@/modules/orders/domain/order-state-machine';

const LABEL: Record<CustomerTimelineStep, string> = {
  ORDER_CREATED: 'Pesanan dibuat',
  COVERAGE_VERIFIED: 'Coverage diverifikasi',
  PAYMENT: 'Pembayaran',
  PROVIDER_CONFIRMED: 'Provider dikonfirmasi',
  INSTALLATION_SCHEDULED: 'Instalasi dijadwalkan',
  INSTALLATION: 'Instalasi',
  ACTIVATED: 'Aktif',
};

/** Order timeline driven by the order state machine (same mapping the API uses). */
export function OrderTimeline({ status }: { status: OrderStatus | null }) {
  const done = status ? completedTimelineIndex(status) : -1;
  return (
    <ol className="space-y-0">
      {CUSTOMER_TIMELINE_STEPS.map((step, i) => {
        const complete = i <= done;
        const current = i === done + 1 && status !== null;
        return (
          <li key={step} className="relative flex gap-3 pb-5 last:pb-0">
            {i < CUSTOMER_TIMELINE_STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute top-7 bottom-0 left-[13px] w-0.5',
                  complete ? 'bg-primary' : 'bg-line',
                )}
              />
            )}
            <span
              className={cn(
                'relative z-10 grid size-7 shrink-0 place-items-center rounded-full border-2 text-xs font-semibold',
                complete && 'border-primary bg-primary text-white',
                current && 'border-primary bg-surface text-primary',
                !complete && !current && 'border-line-strong bg-surface text-fg-muted',
              )}
            >
              {complete ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
            </span>
            <div className="pt-1">
              <p
                className={cn(
                  'text-sm',
                  complete || current ? 'text-fg font-semibold' : 'text-fg-muted',
                )}
              >
                {LABEL[step]}
              </p>
              <span className="sr-only">
                {complete ? 'selesai' : current ? 'sedang berlangsung' : 'belum'}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
