/**
 * Standardized application error codes (brief §34).
 *
 * Domain and application layers throw `AppError`; the HTTP layer maps it to
 * `{ success: false, error: { code, message } }` with `HTTP_STATUS[code]`.
 * Stack traces and `details` meant for logs are never sent to end users.
 */
export const ERROR_CODES = [
  'AUTH_REQUIRED',
  'FORBIDDEN',
  'VALIDATION_ERROR',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'PROVIDER_NOT_FOUND',
  'PROVIDER_NOT_VERIFIED',
  'PROVIDER_REJECTED',
  'PACKAGE_NOT_FOUND',
  'PACKAGE_NOT_AVAILABLE',
  'COVERAGE_NOT_AVAILABLE',
  'ORDER_NOT_FOUND',
  'INVALID_STATE_TRANSITION',
  'PAYMENT_FAILED',
  'PAYMENT_AMOUNT_MISMATCH',
  'REFUND_NOT_ALLOWED',
  'INSTALLATION_UNAVAILABLE',
  'CONFIGURATION_MISSING',
  'INTERNAL_ERROR',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export const HTTP_STATUS: Record<ErrorCode, number> = {
  AUTH_REQUIRED: 401,
  FORBIDDEN: 403,
  VALIDATION_ERROR: 422,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  PROVIDER_NOT_FOUND: 404,
  PROVIDER_NOT_VERIFIED: 409,
  PROVIDER_REJECTED: 409,
  PACKAGE_NOT_FOUND: 404,
  PACKAGE_NOT_AVAILABLE: 409,
  COVERAGE_NOT_AVAILABLE: 409,
  ORDER_NOT_FOUND: 404,
  INVALID_STATE_TRANSITION: 409,
  PAYMENT_FAILED: 402,
  PAYMENT_AMOUNT_MISMATCH: 409,
  REFUND_NOT_ALLOWED: 409,
  INSTALLATION_UNAVAILABLE: 409,
  CONFIGURATION_MISSING: 503,
  INTERNAL_ERROR: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  /** Internal diagnostic context. Logged (after redaction), never returned to clients. */
  readonly details: Record<string, unknown> | undefined;

  constructor(code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }

  get httpStatus(): number {
    return HTTP_STATUS[this.code];
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
