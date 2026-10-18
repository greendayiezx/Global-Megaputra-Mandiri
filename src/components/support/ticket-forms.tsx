'use client';

import { useEffect, useRef, useState } from 'react';
import type { ActionState } from '@/lib/action-state';
import { useStickyAction } from '@/components/dashboard/use-sticky-action';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field';
import { Alert } from '@/components/ui/primitives';
import {
  createTicketAction,
  customerReplyAction,
  staffTicketAction,
} from '@/modules/support/api/actions';
import {
  TICKET_CATEGORIES,
  TICKET_CATEGORY_LABEL,
  TICKET_STATUS_STAFF_LABEL,
  type TicketStatus,
} from '@/modules/support/domain/ticket-rules';

/** Resets the form after every successful save (each save returns a new state object). */
function useResetOnSuccess(state: ActionState, onReset?: () => void) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === 'success') {
      ref.current?.reset();
      onReset?.();
    }
    // Only a new result should trigger a reset (onReset is a stable state setter).
  }, [state]);
  return ref;
}

export function NewTicketForm() {
  const { state, onSubmit, pending } = useStickyAction(createTicketAction);
  const err = (k: string) => state.fieldErrors?.[k];
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {state.status === 'error' && state.message && <Alert tone="danger">{state.message}</Alert>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_240px]">
        <Field id="t-subject" label="Judul" required error={err('subject')}>
          {(aria) => (
            <Input
              {...aria}
              name="subject"
              maxLength={120}
              placeholder="Mis. Teknisi belum datang sesuai jadwal"
              required
            />
          )}
        </Field>
        <Field id="t-category" label="Kategori" required error={err('category')}>
          {(aria) => (
            <Select {...aria} name="category" defaultValue="INSTALLATION">
              {TICKET_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {TICKET_CATEGORY_LABEL[c]}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <Field
        id="t-body"
        label="Ceritakan masalahnya"
        required
        hint="Sertakan kode permintaan/pesanan bila ada."
        error={err('body')}
      >
        {(aria) => (
          <Textarea {...aria} name="body" maxLength={4000} className="min-h-32" required />
        )}
      </Field>
      <Button type="submit" loading={pending}>
        Kirim tiket
      </Button>
    </form>
  );
}

export function CustomerReplyForm({ id, closed }: { id: string; closed: boolean }) {
  const { state, onSubmit, pending } = useStickyAction(customerReplyAction);
  const ref = useResetOnSuccess(state);
  if (closed) {
    return (
      <p className="text-fg-muted text-sm">
        Tiket ini sudah ditutup. Buat tiket baru bila masih ada kendala.
      </p>
    );
  }
  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      {state.status === 'error' && state.message && <Alert tone="danger">{state.message}</Alert>}
      <Field id="reply" label="Balas" error={state.fieldErrors?.body}>
        {(aria) => <Textarea {...aria} name="body" maxLength={4000} required />}
      </Field>
      <Button type="submit" loading={pending}>
        Kirim balasan
      </Button>
    </form>
  );
}

export function StaffTicketForm({
  id,
  allowedNext,
  canInternal,
  canAssign,
  assigned,
}: {
  id: string;
  allowedNext: TicketStatus[];
  canInternal: boolean;
  canAssign: boolean;
  assigned: boolean;
}) {
  const { state, onSubmit, pending } = useStickyAction(staffTicketAction);
  const [internal, setInternal] = useState(false);
  // The internal box is unticked after every save so the next reply is not hidden by accident.
  const ref = useResetOnSuccess(state, () => setInternal(false));
  return (
    <div className="space-y-3">
      {state.status !== 'idle' && state.message && (
        <Alert tone={state.status === 'success' ? 'success' : 'danger'}>{state.message}</Alert>
      )}
      {canAssign && !assigned && (
        <form onSubmit={onSubmit}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="assignToMe" value="1" />
          <Button type="submit" variant="secondary" size="sm" disabled={pending}>
            Tangani tiket ini
          </Button>
        </form>
      )}
      <form ref={ref} onSubmit={onSubmit} className="space-y-3">
        <input type="hidden" name="id" value={id} />
        <Field id="s-body" label="Balasan" error={state.fieldErrors?.body}>
          {(aria) => <Textarea {...aria} name="body" maxLength={4000} className="min-h-28" />}
        </Field>
        {canInternal && (
          <Checkbox
            name="internal"
            label="Catatan internal (tidak terlihat pelanggan)"
            defaultChecked={false}
            onChange={(e) => setInternal(e.currentTarget.checked)}
          />
        )}
        {allowedNext.length > 0 && (
          <Field id="s-to" label="Status">
            {(aria) => (
              <Select {...aria} name="to" defaultValue="">
                <option value="">Tetap</option>
                {allowedNext.map((s) => (
                  <option key={s} value={s}>
                    {TICKET_STATUS_STAFF_LABEL[s]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
        <Button type="submit" loading={pending} variant={internal ? 'secondary' : 'primary'}>
          {internal ? 'Simpan catatan internal' : 'Kirim & simpan'}
        </Button>
      </form>
    </div>
  );
}
