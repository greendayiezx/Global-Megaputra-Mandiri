import { NextResponse } from 'next/server';
import { AppError, isAppError } from './errors';

/** Consistent API envelope (brief §33). Never leaks stack traces or internal details. */
export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export function jsonError(err: unknown) {
  const e = isAppError(err)
    ? err
    : new AppError('INTERNAL_ERROR', 'Terjadi kesalahan pada server.');
  if (!isAppError(err))
    console.error('unhandled API error', err instanceof Error ? err.name : 'unknown');
  return NextResponse.json(
    { success: false, error: { code: e.code, message: e.message } },
    { status: e.httpStatus, headers: { 'Cache-Control': 'no-store' } },
  );
}
