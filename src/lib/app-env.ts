/**
 * Which deployment this is. `NODE_ENV` is `production` for every built app (staging too), so
 * staging identifies itself with `APP_ENV=staging`.
 *
 * Staging may show demo data and create the demo accounts (shared, publicly documented
 * password), so it must be opted into twice — `APP_ENV=staging` AND `APP_SHOW_DEMO_DATA=true` —
 * to keep a single mistyped variable from planting demo accounts in production.
 */
export const isStaging = () =>
  process.env.APP_ENV === 'staging' && process.env.APP_SHOW_DEMO_DATA === 'true';

/** Demo accounts (and the login page's demo hint): development, or an explicit staging. */
export const allowsDemoAccounts = () =>
  (process.env.NODE_ENV !== 'production' && process.env.APP_SHOW_DEMO_DATA !== 'false') ||
  isStaging();
