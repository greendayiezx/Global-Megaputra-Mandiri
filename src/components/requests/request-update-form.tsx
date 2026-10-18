'use client';

import { useEffect, useRef } from 'react';
import { useStickyAction } from '@/components/dashboard/use-sticky-action';
import { Button } from '@/components/ui/button';
import { Field, Select, Textarea } from '@/components/ui/field';
import { Alert } from '@/components/ui/primitives';
import { updateRequestAction } from '@/modules/requests/api/actions';
import { REQUEST_STATUS_LABEL, type RequestStatus } from '@/modules/requests/domain/request-rules';

export function RequestUpdateForm({
  id,
  allowedNext,
  adminNote,
}: {
  id: string;
  allowedNext: RequestStatus[];
  adminNote: string;
}) {
  const { state, onSubmit, pending } = useStickyAction(updateRequestAction);
  const publicRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (state.status === 'success' && publicRef.current) publicRef.current.value = '';
  }, [state]);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      {state.status !== 'idle' && state.message && (
        <Alert tone={state.status === 'success' ? 'success' : 'danger'}>{state.message}</Alert>
      )}
      {allowedNext.length > 0 && (
        <Field id="to" label="Ubah status">
          {(aria) => (
            <Select {...aria} name="to" defaultValue="">
              <option value="">Tetap (hanya catatan)</option>
              {allowedNext.map((s) => (
                <option key={s} value={s}>
                  {REQUEST_STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          )}
        </Field>
      )}
      <Field
        id="publicNote"
        label="Catatan untuk pelanggan"
        hint="Tampil di halaman Cek Status. Wajib saat membatalkan."
        error={state.fieldErrors?.publicNote}
      >
        {(aria) => (
          <Textarea
            {...aria}
            ref={publicRef}
            name="publicNote"
            maxLength={500}
            placeholder="Mis. Survei dijadwalkan Kamis pukul 10.00"
          />
        )}
      </Field>
      <Field id="adminNote" label="Catatan internal" hint="Hanya terlihat oleh tim GMM.">
        {(aria) => (
          <Textarea {...aria} name="adminNote" defaultValue={adminNote} maxLength={1000} />
        )}
      </Field>
      <Button type="submit" loading={pending}>
        Simpan
      </Button>
    </form>
  );
}
