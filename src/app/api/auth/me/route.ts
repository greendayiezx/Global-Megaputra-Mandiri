import { getSession } from '@/lib/auth/session';
import { AppError } from '@/lib/errors';
import { jsonError, jsonOk } from '@/lib/http';
import { permissionsOf } from '@/modules/auth/domain/rbac';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) throw new AppError('AUTH_REQUIRED', 'Silakan masuk terlebih dahulu.');
    return jsonOk(
      {
        user: session.user,
        roles: session.actor.roles,
        providerId: session.actor.providerId,
        permissions: [...permissionsOf(session.actor)].sort(),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    return jsonError(err);
  }
}
