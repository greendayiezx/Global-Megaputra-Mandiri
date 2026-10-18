'use client';

import { startTransition, useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { Alert, Badge, Card } from '@/components/ui/primitives';
import { formatDate } from '@/lib/format';
import { lookupRequestAction, type LookupState } from '@/modules/requests/api/actions';
import { REQUEST_KIND_LABEL, REQUEST_STATUS_LABEL } from '@/modules/requests/domain/request-rules';

export function LookupForm({ initialRef }: { initialRef: string }) {
  const [state, run, pending] = useActionState<LookupState, FormData>(lookupRequestAction, {
    status: 'idle',
  });

  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-7">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            startTransition(() => run(data));
          }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_180px_auto] sm:items-end"
        >
          <Field id="ref" label="Kode referensi">
            {(aria) => (
              <Input
                {...aria}
                name="ref"
                defaultValue={initialRef}
                placeholder="GMM-XXXXXX"
                className="uppercase"
                required
              />
            )}
          </Field>
          <Field id="last4" label="4 digit terakhir ponsel">
            {(aria) => (
              <Input
                {...aria}
                name="last4"
                inputMode="numeric"
                maxLength={4}
                pattern="[0-9]{4}"
                required
              />
            )}
          </Field>
          <Button type="submit" loading={pending} className="h-11">
            Cek status
          </Button>
        </form>
      </Card>

      {state.status === 'error' && state.message && <Alert tone="danger">{state.message}</Alert>}
      {state.status === 'found' && (
        <Card className="p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-fg-muted text-sm">
                {state.result.refCode} · {REQUEST_KIND_LABEL[state.result.kind]} · atas nama{' '}
                {state.result.maskedName}
              </p>
              {state.result.packageName && (
                <p className="mt-0.5 font-medium">{state.result.packageName}</p>
              )}
            </div>
            <Badge
              tone={
                state.result.status === 'CANCELLED'
                  ? 'danger'
                  : state.result.status === 'DONE'
                    ? 'success'
                    : 'primary'
              }
            >
              {REQUEST_STATUS_LABEL[state.result.status]}
            </Badge>
          </div>
          <ol className="border-line mt-6 space-y-5 border-l pl-5">
            {state.result.events.map((e, i) => (
              <li key={i} className="relative">
                <span
                  className="bg-primary absolute top-1.5 -left-[25px] size-2.5 rounded-full"
                  aria-hidden="true"
                />
                <p className="text-sm font-semibold">{REQUEST_STATUS_LABEL[e.status]}</p>
                <p className="text-fg-muted text-xs">{formatDate(new Date(e.createdAt))}</p>
                {e.publicNote && <p className="text-fg-secondary mt-1 text-sm">{e.publicNote}</p>}
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
}
