import 'server-only';

import type { PricingPolicy } from '@/modules/orders/domain/pricing';

function optionalInt(name: string): number | null {
  const raw = process.env[name]?.trim();
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isInteger(n)) throw new Error(`${name} must be an integer`);
  return n;
}

function optionalBool(name: string): boolean | null {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return null;
  if (raw !== 'true' && raw !== 'false') throw new Error(`${name} must be true or false`);
  return raw === 'true';
}

const isProduction = process.env.NODE_ENV === 'production';

export const appConfig = {
  /** Demo data is visible by default only outside production. */
  showDemoData: optionalBool('APP_SHOW_DEMO_DATA') ?? !isProduction,
  /**
   * Pricing policy (D3, D4). Read from env for now; moves to system_settings in STEP 3.
   * Unset values are NOT defaulted — the UI shows the total as "pending configuration".
   */
  pricingPolicy: {
    taxRateBps: optionalInt('PRICING_TAX_RATE_BPS'),
    chargeFirstMonthUpfront: optionalBool('PRICING_CHARGE_FIRST_MONTH_UPFRONT'),
  } satisfies PricingPolicy,
};
