import type { Metadata } from 'next';
import { Forbidden, PageTitle } from '@/components/dashboard/dashboard-shell';
import { Badge, Card } from '@/components/ui/primitives';
import { requirePermission } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';
import { getReadyDb } from '@/modules/auth/application/bootstrap';
import { can } from '@/modules/auth/domain/rbac';
import { listUsersWithRoles } from '@/modules/users/application/admin-queries';

export const metadata: Metadata = { title: 'Pengguna & Role', robots: { index: false } };

export default async function AdminUsersPage() {
  const { forbidden, session } = await requirePermission('dashboard.platform', '/admin/users');
  if (forbidden || !can(session.actor, 'user.manage')) return <Forbidden />;
  const users = await listUsersWithRoles(await getReadyDb(), session.actor);

  return (
    <>
      <PageTitle
        title="Pengguna & Role"
        description="Role menentukan izin yang diperiksa di server untuk setiap aksi. Lihat docs/06-rbac-matrix.md."
      />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-line bg-canvas text-fg-muted border-b text-left text-xs">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Nama
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Email
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Role
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Status
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Login terakhir
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Terdaftar
              </th>
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-canvas">
                <td className="px-4 py-3 font-medium">{u.fullName}</td>
                <td className="text-fg-secondary px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {u.roles.map((r) => (
                      <Badge key={r} tone="outline">
                        {r}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={u.status === 'ACTIVE' ? 'success' : 'danger'}>{u.status}</Badge>
                </td>
                <td className="text-fg-muted px-4 py-3">
                  {u.lastLoginAt ? formatDate(u.lastLoginAt) : '—'}
                </td>
                <td className="text-fg-muted px-4 py-3">{formatDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
