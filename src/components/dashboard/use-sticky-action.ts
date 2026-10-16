'use client';

import { startTransition, useActionState, type FormEvent } from 'react';
import { IDLE, type ActionState } from '@/lib/action-state';

/**
 * `useActionState` without React's automatic form reset: the fields keep what the user
 * typed when the server answers with validation errors.
 */
export function useStickyAction(
  action: (prev: ActionState, data: FormData) => Promise<ActionState>,
) {
  const [state, run, pending] = useActionState(action, IDLE);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => run(data));
  };
  return { state, onSubmit, pending };
}
