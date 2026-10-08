import type { Metadata } from 'next';
import { Forbidden, PageTitle } from '@/components/dashboard/dashboard-shell';
import { Badge, Card } from '@/components/ui/primitives';
import { requirePermission } from '@/lib/auth/session';
import { getReadyDb } from '@/modules/auth/application/bootstrap';
import { can } from '@/modules/auth/domain/rbac';
import { listAuditLogs } from '@/modules/users/application/admin-queries';

export const metadata: Metadata = { title: 'Audit Log', robots: { index: false } };

const time = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'medium',
  timeZone: 'Asia/Jakarta',
});

export default async function AuditLogPage() {
  const { forbidden, session } = await requirePermission('dashboard.platform', '/admin/audit-logs');
  if (forbidden || !can(session.actor, 'audit.read')) return <Forbidden />;
  const logs = await listAuditLogs(await getReadyDb(), session.actor);

  return (
    <>
      <PageTitle
        title="Audit Log"
        description="Catatan permanen aksi penting. Tidak dapat diubah atau dihapus dari aplikasi."
      />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-line bg-canvas text-fg-muted border-b text-left text-xs">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Waktu (WIB)
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Aksi
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Pelaku
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Entitas
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Perubahan
              </th>
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="text-fg-muted px-4 py-8 text-center">
                  Belum ada catatan.
                </td>
              </tr>
            )}
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-canvas align-top">
                <td className="text-fg-muted px-4 py-3 whitespace-nowrap tabular-nums">
                  {time.format(l.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    tone={
                      l.action.includes('failed') || l.action.includes('locked')
                        ? 'warning'
                        : 'neutral'
                    }
                  >
                    {l.action}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {l.actorName ?? <span className="text-fg-muted">{l.actorKind}</span>}
                </td>
                <td className="text-fg-secondary px-4 py-3">
                  {l.entity}
                  {l.entityId && (
                    <span className="text-fg-muted block max-w-40 truncate text-xs">
                      {l.entityId}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <code className="text-fg-secondary block max-w-sm text-xs break-all">
                    {l.before ? `sebelum ${JSON.stringify(l.before)} ` : ''}
                    {l.after ? `sesudah ${JSON.stringify(l.after)}` : ''}
                  </code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
