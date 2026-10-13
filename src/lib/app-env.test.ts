import { afterEach, describe, expect, it, vi } from 'vitest';
import { allowsDemoAccounts, isStaging } from './app-env';

describe('demo accounts gate', () => {
  afterEach(() => vi.unstubAllEnvs());

  const env = (vars: Record<string, string | undefined>) => {
    for (const [k, v] of Object.entries(vars)) vi.stubEnv(k, v);
  };

  it('allows them in development unless demo data is switched off', () => {
    env({ NODE_ENV: 'development', APP_ENV: undefined, APP_SHOW_DEMO_DATA: undefined });
    expect(allowsDemoAccounts()).toBe(true);
    env({ APP_SHOW_DEMO_DATA: 'false' });
    expect(allowsDemoAccounts()).toBe(false);
  });

  it('refuses them in production', () => {
    env({ NODE_ENV: 'production', APP_ENV: undefined, APP_SHOW_DEMO_DATA: 'true' });
    expect(allowsDemoAccounts()).toBe(false);
  });

  it('needs both staging flags in a production build', () => {
    env({ NODE_ENV: 'production', APP_ENV: 'staging', APP_SHOW_DEMO_DATA: undefined });
    expect(isStaging()).toBe(false);
    expect(allowsDemoAccounts()).toBe(false);
    env({ APP_SHOW_DEMO_DATA: 'true' });
    expect(isStaging()).toBe(true);
    expect(allowsDemoAccounts()).toBe(true);
  });
});
