import {
  BookOpenCheck,
  Building2,
  ChartColumn,
  ClipboardList,
  LayoutDashboard,
  MapPinned,
  Package,
  Settings,
  Target,
  UsersRound,
  Wrench,
} from 'lucide-react';
import { Forbidden } from '@/components/dashboard/dashboard-shell';
import { PortalShell } from '@/components/portal/portal-shell';
import { requirePermission } from '@/lib/auth/session';
import { getProviderRecord } from '@/modules/packages/application/catalog';

export const dynamic = 'force-dynamic';

const NAV = [
  { href: '/provider-dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/provider-dashboard/packages', label: 'Layanan & Produk', icon: Package },
  { href: '/provider-dashboard/orders', label: 'Pesanan', icon: ClipboardList },
  { href: '/provider-dashboard/installations', label: 'Instalasi', icon: Wrench },
  { href: '/provider-dashboard/customers', label: 'Pelanggan', icon: UsersRound },
  { href: '/provider-dashboard/coverage', label: 'Area Layanan', icon: MapPinned },
  { href: '/provider-dashboard/leads', label: 'Leads', icon: Target },
  { href: '/provider-dashboard/analytics', label: 'Analitik', icon: ChartColumn },
  { href: '/provider-dashboard/profile', label: 'Profil Perusahaan', icon: Building2 },
  { href: '/provider-dashboard/settings', label: 'Pengaturan', icon: Settings },
  { href: '/provider-dashboard/guide', label: 'Panduan Provider', icon: BookOpenCheck },
];

export default async function ProviderDashboardLayout({ children }: { children: React.ReactNode }) {
  const { forbidden, session } = await requirePermission(
    'dashboard.provider',
    '/provider-dashboard',
  );
  if (forbidden) return <Forbidden />;
  const provider = session.actor.providerId
    ? await getProviderRecord(session.actor.providerId)
    : null;
  return (
    <PortalShell
      area="Portal Provider"
      user={{ name: provider?.displayName ?? session.user.fullName, role: 'Provider' }}
      nav={NAV}
    >
      {children}
    </PortalShell>
  );
}
