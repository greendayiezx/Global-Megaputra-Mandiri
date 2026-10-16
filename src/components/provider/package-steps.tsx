'use client';

import { useStickyAction } from '@/components/dashboard/use-sticky-action';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/primitives';
import { ownPackageStepAction } from '@/modules/packages/api/actions';

/** Submit-for-review and archive buttons for the provider's own package. */
export function PackageSteps({
  id,
  canSubmit,
  canArchive,
}: {
  id: string;
  canSubmit: boolean;
  canArchive: boolean;
}) {
  const { state, onSubmit, pending } = useStickyAction(ownPackageStepAction);
  const message = state.status !== 'idle' && state.message && (
    <Alert tone={state.status === 'success' ? 'success' : 'danger'}>{state.message}</Alert>
  );
  // After a successful step the buttons may disappear; the confirmation must not.
  if (!canSubmit && !canArchive) return message || null;
  return (
    <div className="space-y-3">
      {message}
      <div className="flex flex-wrap gap-2">
        {canSubmit && (
          <form onSubmit={onSubmit}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="to" value="PENDING_REVIEW" />
            <Button type="submit" loading={pending}>
              Ajukan ke GMM
            </Button>
          </form>
        )}
        {canArchive && (
          <form
            onSubmit={(e) => {
              if (!confirm('Arsipkan paket ini? Paket tidak akan tampil di mana pun.')) {
                e.preventDefault();
                return;
              }
              onSubmit(e);
            }}
          >
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="to" value="ARCHIVED" />
            <Button type="submit" variant="secondary" disabled={pending}>
              Arsipkan
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
