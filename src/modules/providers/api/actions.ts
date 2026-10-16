'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { errorState, type ActionState } from '@/lib/action-state';
import { getSession, requestContext } from '@/lib/auth/session';
import { getReadyDb } from '@/modules/auth/application/bootstrap';
import { changeProviderStatus } from '@/modules/providers/application/provider-review';
import { PROVIDER_VERIFICATION_STATUSES } from '@/modules/providers/domain/provider-rules';

const statusSchema = z.object({
  id: z.string().min(1).max(100),
  to: z.enum(PROVIDER_VERIFICATION_STATUSES, { error: 'Pilih tindakan.' }),
  reason: z.string().max(1000).optional(),
});

/** Admin: verification decision on a provider. */
export async function changeProviderStatusAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { status: 'error', message: 'Sesi berakhir. Silakan masuk lagi.' };
  const parsed = statusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: 'error', message: 'Pilih tindakan terlebih dahulu.' };
  try {
    await changeProviderStatus(
      await getReadyDb(),
      session.actor,
      { providerId: parsed.data.id, to: parsed.data.to, reason: parsed.data.reason },
      await requestContext(),
    );
  } catch (err) {
    return errorState(err, 'provider status change');
  }
  revalidatePath('/admin/providers', 'layout');
  revalidatePath('/', 'layout');
  return { status: 'success', message: 'Status provider diperbarui.' };
}
