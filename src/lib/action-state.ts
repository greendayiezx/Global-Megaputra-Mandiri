import { isAppError } from './errors';

/** Result of a form server action, rendered by the form with `useActionState`. */
export interface ActionState {
  status: 'idle' | 'error' | 'success';
  message?: string;
  fieldErrors?: Record<string, string>;
}

export const IDLE: ActionState = { status: 'idle' };

/** Maps a thrown error to a user-facing state; unexpected errors never leak details. */
export function errorState(err: unknown, context: string): ActionState {
  if (isAppError(err)) {
    const fieldErrors = err.details?.fieldErrors as Record<string, string> | undefined;
    return { status: 'error', message: err.message, ...(fieldErrors ? { fieldErrors } : {}) };
  }
  console.error(`${context} failed`, err instanceof Error ? err.name : 'unknown');
  return { status: 'error', message: 'Terjadi kesalahan. Silakan coba lagi.' };
}
