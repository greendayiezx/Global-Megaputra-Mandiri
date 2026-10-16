'use client';

import { startTransition, useActionState, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, Textarea } from '@/components/ui/field';
import { Alert } from '@/components/ui/primitives';
import { IDLE, type ActionState } from '@/lib/action-state';
import { cn } from '@/lib/utils';

export interface StatusOption {
  value: string;
  label: string;
  hint: string;
  needsReason: boolean;
  tone?: 'default' | 'danger';
}

/**
 * Picks one allowed next status and submits it with an optional/required reason. Only the
 * moves the server allows are offered; the server re-checks everything anyway.
 */
export function StatusChangeForm({
  id,
  options,
  action,
  submitLabel = 'Simpan keputusan',
}: {
  id: string;
  options: StatusOption[];
  action: (prev: ActionState, data: FormData) => Promise<ActionState>;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE);
  const [picked, setPicked] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const option = options.find((o) => o.value === picked);

  // Clear the form only after a successful decision; on errors the choice and reason stay.
  useEffect(() => {
    if (state.status === 'success') {
      formRef.current?.reset();
      setPicked(null);
    }
  }, [state]);

  if (options.length === 0) {
    return <p className="text-fg-muted text-sm">Tidak ada tindakan lanjutan untuk status ini.</p>;
  }

  return (
    <form
      ref={formRef}
      // Submitted by hand so React does not reset the fields when the server returns an error.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      className="space-y-4"
    >
      <input type="hidden" name="id" value={id} />
      {state.status !== 'idle' && state.message && (
        <Alert tone={state.status === 'success' ? 'success' : 'danger'}>{state.message}</Alert>
      )}
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Tindakan</legend>
        <div className="grid grid-cols-1 gap-2">
          {options.map((o) => (
            <label
              key={o.value}
              className={cn(
                'border-line hover:border-fg-muted flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                picked === o.value &&
                  (o.tone === 'danger'
                    ? 'border-danger-fg bg-danger-soft'
                    : 'border-primary bg-primary-soft'),
              )}
            >
              <input
                type="radio"
                name="to"
                value={o.value}
                checked={picked === o.value}
                onChange={() => setPicked(o.value)}
                className="accent-primary mt-1"
              />
              <span>
                <span className="block text-sm font-semibold">{o.label}</span>
                <span className="text-fg-muted block text-[13px]">{o.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <Field
        id={`reason-${id}`}
        label={option?.needsReason ? 'Alasan' : 'Catatan (opsional)'}
        required={option?.needsReason}
        hint="Tersimpan di riwayat dan audit log; alasan ditampilkan ke provider."
        error={state.fieldErrors?.reason}
      >
        {(aria) => (
          <Textarea
            {...aria}
            name="reason"
            maxLength={1000}
            required={option?.needsReason}
            placeholder={option?.needsReason ? 'Jelaskan alasannya…' : ''}
          />
        )}
      </Field>
      <Button
        type="submit"
        loading={pending}
        disabled={!picked}
        variant={option?.tone === 'danger' ? 'danger' : 'primary'}
      >
        {submitLabel}
      </Button>
    </form>
  );
}
