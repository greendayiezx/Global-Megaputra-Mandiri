'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { errorState, type ActionState } from '@/lib/action-state';
import { getSession, requestContext } from '@/lib/auth/session';
import { getReadyDb } from '@/modules/auth/application/bootstrap';
import { changePackageStatus } from '@/modules/packages/application/package-review';
import { PACKAGE_STATUSES } from '@/modules/packages/domain/package-rules';

const statusSchema = z.object({
  id: z.string().min(1).max(100),
  to: z.enum(PACKAGE_STATUSES, { error: 'Pilih tindakan.' }),
  reason: z.string().max(1000).optional(),
});

/** Admin: publish / send back / suspend a package. */
export async function changePackageStatusAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { status: 'error', message: 'Sesi berakhir. Silakan masuk lagi.' };
  const parsed = statusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: 'error', message: 'Pilih tindakan terlebih dahulu.' };
  try {
    await changePackageStatus(
      await getReadyDb(),
      session.actor,
      { packageId: parsed.data.id, to: parsed.data.to, reason: parsed.data.reason },
      await requestContext(),
    );
  } catch (err) {
    return errorState(err, 'package status change');
  }
  revalidatePath('/admin/packages', 'layout');
  revalidatePath('/', 'layout');
  return { status: 'success', message: 'Status paket diperbarui.' };
}
