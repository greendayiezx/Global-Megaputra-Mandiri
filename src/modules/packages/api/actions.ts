'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { errorState, type ActionState } from '@/lib/action-state';
import { getSession, requestContext } from '@/lib/auth/session';
import { getReadyDb } from '@/modules/auth/application/bootstrap';
import { changePackageStatus } from '@/modules/packages/application/package-review';
import {
  archiveOwnPackage,
  createOwnPackage,
  submitOwnPackage,
  updateOwnPackage,
  type PackageInput,
} from '@/modules/packages/application/package-self-service';
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

function packageInput(f: FormData) {
  const text = (k: string) => String(f.get(k) ?? '');
  const features = text('features')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf(':');
      return i > 0
        ? { label: l.slice(0, i).trim(), value: l.slice(i + 1).trim() }
        : { label: 'Catatan', value: l };
    });
  return {
    name: text('name'),
    description: text('description'),
    downloadMbps: text('downloadMbps'),
    uploadMbps: text('uploadMbps'),
    technology: text('technology'),
    monthlyPrice: text('monthlyPrice'),
    installationFee: text('installationFee'),
    activationFee: text('activationFee'),
    taxIncluded: f.get('taxIncluded') === 'on',
    contractMonths: text('contractMonths'),
    routerIncluded: f.get('routerIncluded') === 'on',
    fupPolicy: text('fupPolicy'),
    slaSummary: text('slaSummary'),
    supportHours: text('supportHours'),
    estInstallationDaysMin: text('estInstallationDaysMin'),
    estInstallationDaysMax: text('estInstallationDaysMax'),
    features,
  } as unknown as PackageInput;
}

/** Provider: create a draft (redirects to its page) or save changes to an existing package. */
export async function saveOwnPackageAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { status: 'error', message: 'Sesi berakhir. Silakan masuk lagi.' };
  const id = String(formData.get('id') ?? '');
  let createdId: string | null = null;
  let message = 'Perubahan tersimpan.';
  try {
    const db = await getReadyDb();
    const ctx = await requestContext();
    if (id) {
      const r = await updateOwnPackage(db, session.actor, id, packageInput(formData), ctx);
      if (r.changed.length === 0) message = 'Tidak ada perubahan.';
      else if (r.backToReview)
        message =
          'Tersimpan. Karena ada perubahan harga/spesifikasi, paket menunggu review GMM lagi.';
    } else {
      createdId = (await createOwnPackage(db, session.actor, packageInput(formData), ctx)).id;
    }
  } catch (err) {
    return errorState(err, 'package save');
  }
  revalidatePath('/provider-dashboard/packages', 'layout');
  revalidatePath('/', 'layout');
  if (createdId) redirect(`/provider-dashboard/packages/${createdId}?created=1`);
  return { status: 'success', message };
}

/** Provider: submit a draft for GMM review, or archive a package. */
export async function ownPackageStepAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { status: 'error', message: 'Sesi berakhir. Silakan masuk lagi.' };
  const id = String(formData.get('id') ?? '');
  const step = String(formData.get('to') ?? '');
  try {
    const db = await getReadyDb();
    const ctx = await requestContext();
    if (step === 'PENDING_REVIEW') await submitOwnPackage(db, session.actor, id, ctx);
    else if (step === 'ARCHIVED') await archiveOwnPackage(db, session.actor, id, ctx);
    else return { status: 'error', message: 'Pilih tindakan terlebih dahulu.' };
  } catch (err) {
    return errorState(err, 'package step');
  }
  revalidatePath('/provider-dashboard/packages', 'layout');
  revalidatePath('/admin/packages', 'layout');
  return {
    status: 'success',
    message: step === 'PENDING_REVIEW' ? 'Diajukan ke tim GMM untuk review.' : 'Paket diarsipkan.',
  };
}
