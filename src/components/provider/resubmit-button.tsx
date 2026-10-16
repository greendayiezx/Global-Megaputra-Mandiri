'use client';

import { useStickyAction } from '@/components/dashboard/use-sticky-action';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/primitives';
import { resubmitOwnProviderAction } from '@/modules/providers/api/actions';

export function ResubmitButton() {
  const { state, onSubmit, pending } = useStickyAction(resubmitOwnProviderAction);
  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-3">
      {state.status === 'error' && <Alert tone="danger">{state.message}</Alert>}
      <Button type="submit" loading={pending} variant="secondary" size="sm">
        Ajukan ulang ke GMM
      </Button>
    </form>
  );
}
