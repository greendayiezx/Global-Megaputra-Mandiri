import {
  Building2,
  ChartColumn,
  ClipboardList,
  LayoutDashboard,
  MapPinned,
  Package,
  Settings,
  UsersRound,
  Wrench,
  Target,
} from 'lucide-react';
import { DashboardShell, Forbidden } from '@/components/dashboard/dashboard-shell';
import { requirePermission } from '@/lib/auth/session';
import { getProviderRecord } from '@/modules/packages/application/catalog';

export const dynamic = 'force-dynamic';

const NAV = [
  { href: '/provider-dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/provider-dashboard/profile', label: 'Profil', icon: Building2 },
  { href: '/provider-dashboard/packages', label: 'Paket', icon: Package },
  { href: '/provider-dashboard/coverage', label: 'Coverage', icon: MapPinned },
  { href: '/provider-dashboard/orders', label: 'Pesanan', icon: ClipboardList },
  { href: '/provider-dashboard/installations', label: 'Instalasi', icon: Wrench },
  { href: '/provider-dashboard/customers', label: 'Pelanggan', icon: UsersRound },
  { href: '/provider-dashboard/leads', label: 'Leads', icon: Target },
  { href: '/provider-dashboard/analytics', label: 'Analitik', icon: ChartColumn },
  { href: '/provider-dashboard/settings', label: 'Pengaturan', icon: Settings },
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
    <DashboardShell area="Portal Provider" subtitle={provider?.displayName} nav={NAV}>
      {children}
    </DashboardShell>
  );
}
