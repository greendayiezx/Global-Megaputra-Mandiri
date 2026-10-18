import {
  Building2,
  ClipboardList,
  CreditCard,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  Package,
  ScrollText,
  Settings,
  UsersRound,
  Wrench,
} from 'lucide-react';
import { Suspense, ViewTransition } from 'react';
import { Forbidden } from '@/components/dashboard/dashboard-shell';
import { PortalShell } from '@/components/portal/portal-shell';
import { PortalSkeleton } from '@/components/portal/portal-skeleton';
import { requirePermission } from '@/lib/auth/session';
import { ROLES } from '@/modules/auth/domain/rbac';

export const dynamic = 'force-dynamic';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/providers', label: 'Kelola Provider', icon: Building2 },
  { href: '/admin/packages', label: 'Kelola Paket', icon: Package },
  { href: '/admin/requests', label: 'Permintaan', icon: Inbox },
  { href: '/admin/users', label: 'Kelola Pengguna', icon: UsersRound },
  { href: '/admin/orders', label: 'Pesanan', icon: ClipboardList },
  { href: '/admin/payments', label: 'Transaksi', icon: CreditCard },
  { href: '/admin/installations', label: 'Instalasi', icon: Wrench },
  { href: '/admin/tickets', label: 'Bantuan & Tiket', icon: LifeBuoy },
  { href: '/admin/audit-logs', label: 'Audit Log', icon: ScrollText },
  { href: '/admin/settings', label: 'Setting Sistem', icon: Settings },
];

/**
 * The shell (sidebar, top bar) renders at once with a skeleton while the session is checked,
 * so entering the portal from the public site never shows a frozen page. The ViewTransition
 * fades the portal in and out when crossing between the public site and the portal.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={{ 'portal-enter': 'portal-in', default: 'none' }}
      exit={{ 'portal-exit': 'portal-out', default: 'none' }}
      default="none"
    >
      <Suspense
        fallback={
          <PortalShell area="Portal Admin" nav={NAV}>
            <PortalSkeleton label="Memuat portal admin" />
          </PortalShell>
        }
      >
        <AdminShell>{children}</AdminShell>
      </Suspense>
    </ViewTransition>
  );
}

async function AdminShell({ children }: { children: React.ReactNode }) {
  const { forbidden, session } = await requirePermission('dashboard.platform', '/admin');
  if (forbidden) return <Forbidden />;
  const role = session.actor.roles.map((r) => ROLES[r]?.name ?? r).join(', ');
  return (
    <PortalShell area="Portal Admin" user={{ name: session.user.fullName, role }} nav={NAV}>
      {children}
    </PortalShell>
  );
}
