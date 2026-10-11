import {
  Building2,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  Package,
  ScrollText,
  Settings,
  UsersRound,
  Wrench,
} from 'lucide-react';
import { Forbidden } from '@/components/dashboard/dashboard-shell';
import { PortalShell } from '@/components/portal/portal-shell';
import { requirePermission } from '@/lib/auth/session';
import { ROLES } from '@/modules/auth/domain/rbac';

export const dynamic = 'force-dynamic';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/providers', label: 'Kelola Provider', icon: Building2 },
  { href: '/admin/packages', label: 'Kelola Paket', icon: Package },
  { href: '/admin/users', label: 'Kelola Pengguna', icon: UsersRound },
  { href: '/admin/orders', label: 'Pesanan', icon: ClipboardList },
  { href: '/admin/payments', label: 'Transaksi', icon: CreditCard },
  { href: '/admin/installations', label: 'Instalasi', icon: Wrench },
  { href: '/admin/tickets', label: 'Bantuan & Tiket', icon: LifeBuoy },
  { href: '/admin/audit-logs', label: 'Audit Log', icon: ScrollText },
  { href: '/admin/settings', label: 'Setting Sistem', icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { forbidden, session } = await requirePermission('dashboard.platform', '/admin');
  if (forbidden) return <Forbidden />;
  const role = session.actor.roles.map((r) => ROLES[r]?.name ?? r).join(', ');
  return (
    <PortalShell area="Portal Admin" user={{ name: session.user.fullName, role }} nav={NAV}>
      {children}
    </PortalShell>
  );
}
