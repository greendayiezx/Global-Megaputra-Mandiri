'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { errorState, type ActionState } from '@/lib/action-state';
import { getSession, requestContext } from '@/lib/auth/session';
import { getRateLimiter } from '@/lib/rate-limit';
import { getReadyDb } from '@/modules/auth/application/bootstrap';
import {
  lookupServiceRequest,
  submitServiceRequest,
  updateServiceRequest,
} from '@/modules/requests/application/service-requests';
import { REQUEST_STATUSES, type RequestStatus } from '@/modules/requests/domain/request-rules';

/** Public: survey / installation request. Redirects to the confirmation with the code. */
export async function submitRequestAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const text = (k: string) => String(formData.get(k) ?? '');
  const num = (k: string) => (text(k) ? text(k) : null);
  let refCode: string;
  try {
    ({ refCode } = await submitServiceRequest(
      await getReadyDb(),
      getRateLimiter(),
      {
        kind: text('kind') === 'INSTALLATION' ? 'INSTALLATION' : 'SURVEY',
        name: text('name'),
        phone: text('phone'),
        email: text('email'),
        address: text('address'),
        lat: num('lat') as unknown as number | null,
        lng: num('lng') as unknown as number | null,
        packageSlug: text('package') || null,
        note: text('note'),
        consent: (formData.get('consent') === 'on') as true,
      },
      await requestContext(),
    ));
  } catch (err) {
    return errorState(err, 'service request submit');
  }
  revalidatePath('/admin/requests');
  redirect(`/permintaan/terkirim?ref=${encodeURIComponent(refCode)}`);
}

export type LookupState =
  | { status: 'idle' | 'error'; message?: string }
  | { status: 'found'; result: NonNullable<Awaited<ReturnType<typeof lookupServiceRequest>>> };

/** Public: status by reference code + last 4 phone digits. */
export async function lookupRequestAction(
  _prev: LookupState,
  formData: FormData,
): Promise<LookupState> {
  try {
    const result = await lookupServiceRequest(
      await getReadyDb(),
      getRateLimiter(),
      String(formData.get('ref') ?? ''),
      String(formData.get('last4') ?? '').trim(),
      await requestContext(),
    );
    if (!result) {
      return {
        status: 'error',
        message:
          'Permintaan tidak ditemukan. Periksa kode referensi dan 4 digit terakhir nomor ponsel.',
      };
    }
    return { status: 'found', result };
  } catch (err) {
    const s = errorState(err, 'service request lookup');
    return { status: 'error', message: s.message };
  }
}

/** Staff: move a request forward, add a note for the visitor, or update the internal note. */
export async function updateRequestAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { status: 'error', message: 'Sesi berakhir. Silakan masuk lagi.' };
  const to = String(formData.get('to') ?? '');
  try {
    const r = await updateServiceRequest(
      await getReadyDb(),
      session.actor,
      {
        id: String(formData.get('id') ?? ''),
        to: (REQUEST_STATUSES as readonly string[]).includes(to) ? (to as RequestStatus) : null,
        publicNote: String(formData.get('publicNote') ?? ''),
        adminNote: String(formData.get('adminNote') ?? ''),
      },
      await requestContext(),
    );
    revalidatePath('/admin/requests', 'layout');
    return {
      status: 'success',
      message: r.changed ? 'Permintaan diperbarui.' : 'Tidak ada perubahan.',
    };
  } catch (err) {
    return errorState(err, 'service request update');
  }
}
