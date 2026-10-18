'use server';

import { revalidatePath } from 'next/cache';
import { errorState, type ActionState } from '@/lib/action-state';
import { getSession, requestContext } from '@/lib/auth/session';
import { getReadyDb } from '@/modules/auth/application/bootstrap';
import {
  addOwnAdminAreaZone,
  addOwnRadiusZone,
  setOwnZoneStatus,
  type RadiusZoneInput,
} from '@/modules/coverage/application/zone-self-service';

/** Provider: add a circular service area. */
export async function addZoneAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { status: 'error', message: 'Sesi berakhir. Silakan masuk lagi.' };
  try {
    const db = await getReadyDb();
    const ctx = await requestContext();
    const raw = Object.fromEntries(formData) as Record<string, string>;
    if (raw.strategy === 'ADMIN_AREA') {
      await addOwnAdminAreaZone(
        db,
        session.actor,
        {
          regionCode: raw.regionCode ?? '',
          name: raw.regionLabel ?? '',
          result: raw.result as 'AVAILABLE',
        },
        ctx,
      );
    } else {
      await addOwnRadiusZone(db, session.actor, raw as unknown as RadiusZoneInput, ctx);
    }
  } catch (err) {
    return errorState(err, 'zone add');
  }
  revalidatePath('/provider-dashboard/coverage');
  revalidatePath('/', 'layout');
  return { status: 'success', message: 'Area ditambahkan dan langsung dipakai di Cek Coverage.' };
}

/** Provider: switch a zone on or off. */
export async function toggleZoneAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) return;
  const status = formData.get('status') === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE';
  await setOwnZoneStatus(
    await getReadyDb(),
    session.actor,
    String(formData.get('id') ?? ''),
    status,
    await requestContext(),
  );
  revalidatePath('/provider-dashboard/coverage');
  revalidatePath('/', 'layout');
}
