import { Bell, House, LifeBuoy, ReceiptText, UserRound, Wallet, Wifi } from 'lucide-react';
import { DashboardShell, Forbidden } from '@/components/dashboard/dashboard-shell';
import { redirect } from 'next/navigation';
import { requirePermission } from '@/lib/auth/session';
import { isPlatformStaff, isProviderMember } from '@/modules/auth/domain/rbac';

export const dynamic = 'force-dynamic';

const NAV = [
  { href: '/dashboard', label: 'Beranda', icon: House },
  { href: '/dashboard/orders', label: 'Pesanan', icon: ReceiptText },
  { href: '/dashboard/subscriptions', label: 'Langganan', icon: Wifi },
  { href: '/dashboard/invoices', label: 'Tagihan', icon: Wallet },
  { href: '/dashboard/support', label: 'Bantuan', icon: LifeBuoy },
  { href: '/dashboard/notifications', label: 'Notifikasi', icon: Bell },
  { href: '/dashboard/profile', label: 'Profil', icon: UserRound },
];

export default async function CustomerDashboardLayout({ children }: { children: React.ReactNode }) {
  const { forbidden, session } = await requirePermission('dashboard.customer', '/dashboard');
  if (forbidden) {
    if (isPlatformStaff(session.actor)) redirect('/admin');
    if (isProviderMember(session.actor)) redirect('/provider-dashboard');
    return <Forbidden />;
  }
  return (
    <DashboardShell area="Akun Saya" subtitle={session.user.fullName} nav={NAV}>
      {children}
    </DashboardShell>
  );
}
