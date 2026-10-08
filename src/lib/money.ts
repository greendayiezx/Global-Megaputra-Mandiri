import { AppError } from './errors';

/**
 * Integer rupiah. IDR has no minor unit in practice, so every amount in the
 * system is a safe integer number of rupiah (stored as `bigint` in Postgres).
 */
export type Rupiah = number;

/** Basis points: 10_000 bps = 100%. Used for tax and percentage promotions. */
export type BasisPoints = number;

export function assertRupiah(value: number, field: string): Rupiah {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new AppError(
      'VALIDATION_ERROR',
      `${field} must be a non-negative integer rupiah amount`,
      {
        field,
        value,
      },
    );
  }
  return value;
}

export function assertBasisPoints(value: number, field: string): BasisPoints {
  if (!Number.isInteger(value) || value < 0 || value > 10_000) {
    throw new AppError('VALIDATION_ERROR', `${field} must be an integer between 0 and 10000 bps`, {
      field,
      value,
    });
  }
  return value;
}

/** `amount * bps / 10000`, rounded half-up to whole rupiah. */
export function applyBps(amount: Rupiah, bps: BasisPoints): Rupiah {
  return Math.round((amount * bps) / 10_000);
}

export function sum(values: readonly Rupiah[]): Rupiah {
  return values.reduce((acc, v) => acc + v, 0);
}

const idrFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export function formatRupiah(amount: Rupiah): string {
  return idrFormatter.format(amount);
}
