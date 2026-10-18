'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { errorState, type ActionState } from '@/lib/action-state';
import { getSession, requestContext } from '@/lib/auth/session';
import { getRateLimiter } from '@/lib/rate-limit';
import { getReadyDb } from '@/modules/auth/application/bootstrap';
import {
  createTicket,
  replyAsCustomer,
  staffUpdateTicket,
} from '@/modules/support/application/tickets';
import { TICKET_STATUSES, type TicketStatus } from '@/modules/support/domain/ticket-rules';

const expired: ActionState = { status: 'error', message: 'Sesi berakhir. Silakan masuk lagi.' };

/** Customer: open a ticket, then go to it. */
export async function createTicketAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession();
  if (!session) return expired;
  let id: string;
  try {
    ({ id } = await createTicket(
      await getReadyDb(),
      getRateLimiter(),
      session.actor,
      {
        subject: String(formData.get('subject') ?? ''),
        category: String(formData.get('category') ?? '') as 'OTHER',
        body: String(formData.get('body') ?? ''),
      },
      await requestContext(),
    ));
  } catch (err) {
    return errorState(err, 'ticket create');
  }
  revalidatePath('/dashboard/support', 'layout');
  revalidatePath('/admin/tickets', 'layout');
  redirect(`/dashboard/support/${id}?created=1`);
}

/** Customer: reply in their own ticket. */
export async function customerReplyAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession();
  if (!session) return expired;
  const id = String(formData.get('id') ?? '');
  try {
    await replyAsCustomer(
      await getReadyDb(),
      session.actor,
      id,
      String(formData.get('body') ?? ''),
    );
  } catch (err) {
    return errorState(err, 'ticket reply');
  }
  revalidatePath(`/dashboard/support/${id}`);
  revalidatePath('/admin/tickets', 'layout');
  return { status: 'success', message: 'Balasan terkirim.' };
}

/** Staff: reply, internal note, status change, or take the ticket. */
export async function staffTicketAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession();
  if (!session) return expired;
  const id = String(formData.get('id') ?? '');
  const to = String(formData.get('to') ?? '');
  try {
    const r = await staffUpdateTicket(
      await getReadyDb(),
      session.actor,
      {
        id,
        body: String(formData.get('body') ?? ''),
        internal: formData.get('internal') === 'on',
        to: (TICKET_STATUSES as readonly string[]).includes(to) ? (to as TicketStatus) : null,
        assignToMe: formData.get('assignToMe') === '1',
      },
      await requestContext(),
    );
    revalidatePath('/admin/tickets', 'layout');
    revalidatePath(`/dashboard/support/${id}`);
    return { status: 'success', message: r.changed ? 'Tiket diperbarui.' : 'Tidak ada perubahan.' };
  } catch (err) {
    return errorState(err, 'ticket staff update');
  }
}
