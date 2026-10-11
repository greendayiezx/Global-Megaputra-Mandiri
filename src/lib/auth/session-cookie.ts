const isProd = process.env.NODE_ENV === 'production';

/** `__Host-` prefix in production: Secure, path=/, no Domain — cannot be set by subdomains. */
export const SESSION_COOKIE = isProd
  ? `__Host-${process.env.SESSION_COOKIE_NAME ?? 'gmm_session'}`
  : (process.env.SESSION_COOKIE_NAME ?? 'gmm_session');
