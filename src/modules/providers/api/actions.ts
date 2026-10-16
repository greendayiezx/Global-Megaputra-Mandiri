'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { errorState, type ActionState } from '@/lib/action-state';
import { getSession, requestContext } from '@/lib/auth/session';
import { getReadyDb } from '@/modules/auth/application/bootstrap';
import { changeProviderStatus } from '@/modules/providers/application/provider-review';
import {
  resubmitOwnProvider,
  updateOwnProfile,
} from '@/modules/providers/application/provider-self-service';
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

const lines = (v: FormDataEntryValue | null) =>
  String(v ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

/** Provider: edit own company profile. */
export async function updateOwnProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { status: 'error', message: 'Sesi berakhir. Silakan masuk lagi.' };
  const text = (k: string) => String(formData.get(k) ?? '');
  try {
    const { changed } = await updateOwnProfile(
      await getReadyDb(),
      session.actor,
      {
        displayName: text('displayName'),
        legalName: text('legalName'),
        nib: text('nib'),
        address: text('address'),
        picName: text('picName'),
        picPhone: text('picPhone'),
        picEmail: text('picEmail'),
        description: text('description'),
        website: text('website'),
        supportPhone: text('supportPhone'),
        supportEmail: text('supportEmail'),
        supportHours: text('supportHours'),
        slaSummary: text('slaSummary'),
        installationInfo: text('installationInfo'),
        technologies: formData.getAll('technologies').map(String) as never,
        serviceAreaNames: lines(formData.get('serviceAreaNames')),
      },
      await requestContext(),
    );
    revalidatePath('/provider-dashboard', 'layout');
    revalidatePath('/', 'layout');
    return {
      status: 'success',
      message: changed.length ? 'Profil tersimpan.' : 'Tidak ada perubahan.',
    };
  } catch (err) {
    return errorState(err, 'provider profile update');
  }
}

/** Provider: send a rejected profile back to GMM after fixing it. */
export async function resubmitOwnProviderAction(
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { status: 'error', message: 'Sesi berakhir. Silakan masuk lagi.' };
  try {
    await resubmitOwnProvider(await getReadyDb(), session.actor, await requestContext());
  } catch (err) {
    return errorState(err, 'provider resubmit');
  }
  revalidatePath('/provider-dashboard', 'layout');
  return { status: 'success', message: 'Diajukan ulang ke tim GMM.' };
}
