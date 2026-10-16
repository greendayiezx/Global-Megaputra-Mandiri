import type { Metadata } from 'next';
import Link from 'next/link';
import { Forbidden, PageTitle } from '@/components/dashboard/dashboard-shell';
import { ZoneForm } from '@/components/provider/zone-form';
import { Alert, Badge, Card } from '@/components/ui/primitives';
import { requirePermission } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';
import { getReadyDb } from '@/modules/auth/application/bootstrap';
import { can } from '@/modules/auth/domain/rbac';
import { toggleZoneAction } from '@/modules/coverage/api/actions';
import { listOwnZones } from '@/modules/coverage/application/zone-self-service';

export const metadata: Metadata = { title: 'Area Layanan', robots: { index: false } };

const RESULT = {
  AVAILABLE: { label: 'Tersedia', tone: 'success' },
  LIMITED: { label: 'Terbatas', tone: 'warning' },
  REQUIRES_SURVEY: { label: 'Perlu survei', tone: 'primary' },
  EXCLUDED: { label: 'Tidak dilayani', tone: 'danger' },
} as const;

const STRATEGY = {
  POLYGON: 'Poligon',
  CUSTOM: 'Poligon',
  RADIUS: 'Radius',
  ADMIN_AREA: 'Wilayah administratif',
  MANUAL_ZONE: 'Kode pos',
} as const;

function describe(geometry: unknown): string {
  const g = geometry as { center?: { lat: number; lng: number }; radiusM?: number };
  if (g.center && g.radiusM) {
    const r =
      g.radiusM >= 1000 ? `${(g.radiusM / 1000).toLocaleString('id-ID')} km` : `${g.radiusM} m`;
    return `${r} dari ${g.center.lat.toFixed(4)}, ${g.center.lng.toFixed(4)}`;
  }
  return 'Dibuat oleh tim GMM';
}

export default async function ProviderCoveragePage() {
  const { forbidden, session } = await requirePermission(
    'dashboard.provider',
    '/provider-dashboard/coverage',
  );
  const providerId = session.actor.providerId;
  if (forbidden || !providerId || !can(session.actor, 'coverage.manage', { providerId })) {
    return <Forbidden />;
  }
  const zones = await listOwnZones(await getReadyDb(), session.actor);

  return (
    <>
      <PageTitle
        title="Area layanan"
        description="Area ini dipakai saat pelanggan mengecek ketersediaan di alamatnya."
      />
      <Alert tone="info" className="mb-5">
        Hasil cek coverage selalu ditampilkan sebagai perkiraan; pemasangan tetap dipastikan teknisi
        Anda. Area &ldquo;Tidak dilayani&rdquo; mengalahkan area lain yang bertumpuk.
      </Alert>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="min-w-0 overflow-x-auto">
          <h2 className="border-line border-b px-5 py-3.5 font-semibold">
            Area terdaftar ({zones.length})
          </h2>
          {zones.length === 0 ? (
            <p className="text-fg-muted px-5 py-4 text-sm">Belum ada area. Tambahkan di samping.</p>
          ) : (
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-fg-muted border-line border-b text-left text-xs">
                <tr>
                  <th scope="col" className="px-5 py-2.5 font-medium">
                    Area
                  </th>
                  <th scope="col" className="px-5 py-2.5 font-medium">
                    Status layanan
                  </th>
                  <th scope="col" className="px-5 py-2.5 font-medium">
                    Diperbarui
                  </th>
                  <th scope="col" className="px-5 py-2.5 font-medium">
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-line divide-y">
                {zones.map((z) => {
                  const g = z.geometry as { center?: { lat: number; lng: number } };
                  return (
                    <tr
                      key={z.id}
                      className={z.status === 'INACTIVE' ? 'text-fg-muted' : undefined}
                    >
                      <td className="px-5 py-3">
                        <p className="font-medium">{z.name}</p>
                        <p className="text-fg-muted text-xs">
                          {STRATEGY[z.strategy]} · {describe(z.geometry)}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={RESULT[z.result].tone}>{RESULT[z.result].label}</Badge>
                        {z.status === 'INACTIVE' && (
                          <span className="ml-2 text-xs">(nonaktif)</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {z.lastVerifiedAt ? formatDate(z.lastVerifiedAt) : '—'}
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        {g.center && z.status === 'ACTIVE' && (
                          <Link
                            href={`/coverage?lat=${g.center.lat}&lng=${g.center.lng}`}
                            className="text-primary mr-4 text-sm hover:underline"
                          >
                            Uji
                          </Link>
                        )}
                        <form action={toggleZoneAction} className="inline">
                          <input type="hidden" name="id" value={z.id} />
                          <input
                            type="hidden"
                            name="status"
                            value={z.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'}
                          />
                          <button type="submit" className="text-primary text-sm hover:underline">
                            {z.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
        <Card className="p-5">
          <h2 className="mb-1 font-semibold">Tambah area (radius)</h2>
          <p className="text-fg-muted mb-4 text-sm">
            Lingkaran dari satu titik tengah. Gambar poligon di peta menyusul.
          </p>
          <ZoneForm />
        </Card>
      </div>
    </>
  );
}
