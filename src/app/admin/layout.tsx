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
import { DashboardShell, Forbidden } from '@/components/dashboard/dashboard-shell';
import { requirePermission } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/providers', label: 'Provider', icon: Building2 },
  { href: '/admin/packages', label: 'Paket', icon: Package },
  { href: '/admin/orders', label: 'Pesanan', icon: ClipboardList },
  { href: '/admin/payments', label: 'Pembayaran', icon: CreditCard },
  { href: '/admin/installations', label: 'Instalasi', icon: Wrench },
  { href: '/admin/tickets', label: 'Tiket', icon: LifeBuoy },
  { href: '/admin/users', label: 'Pengguna & Role', icon: UsersRound },
  { href: '/admin/audit-logs', label: 'Audit Log', icon: ScrollText },
  { href: '/admin/settings', label: 'Pengaturan', icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { forbidden, session } = await requirePermission('dashboard.platform', '/admin');
  if (forbidden) return <Forbidden />;
  return (
    <DashboardShell area="Portal Admin GMM" subtitle={session.user.fullName} nav={NAV}>
      {children}
    </DashboardShell>
  );
}
