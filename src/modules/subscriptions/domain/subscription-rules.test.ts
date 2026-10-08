import { describe, expect, it } from 'vitest';
import { canActivateSubscription } from './subscription-rules';

describe('canActivateSubscription', () => {
  it('requires QC state, settled payment and passed QC', () => {
    expect(
      canActivateSubscription({
        orderStatus: 'INSTALLATION_QC',
        initialPaymentStatus: 'PAID',
        installationQcPassedAt: new Date(),
      }),
    ).toEqual({ ok: true });

    const r = canActivateSubscription({
      orderStatus: 'INSTALLATION_IN_PROGRESS',
      initialPaymentStatus: 'PENDING',
      installationQcPassedAt: null,
    });
    expect(r).toMatchObject({ ok: false });
    if (!r.ok) expect(r.reasons).toHaveLength(3);
  });
});
