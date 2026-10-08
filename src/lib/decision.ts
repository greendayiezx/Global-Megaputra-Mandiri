import type { ErrorCode } from './errors';

/** Result of a business-rule check: allowed, or denied with an error code and reasons. */
export type Decision = { ok: true } | { ok: false; code: ErrorCode; reasons: string[] };

export function decide(code: ErrorCode, reasons: string[]): Decision {
  return reasons.length === 0 ? { ok: true } : { ok: false, code, reasons };
}
