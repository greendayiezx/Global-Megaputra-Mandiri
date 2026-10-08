import { TicketPercent } from 'lucide-react';
import type { Metadata } from 'next';
import { ContentPage } from '@/components/layout/content-page';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/primitives';

export const metadata: Metadata = {
  title: 'Promo Internet',
  description: 'Promo aktif dari provider internet di GMM.',
};

export default function PromoPage() {
  return (
    <ContentPage
      crumb="Promo"
      title="Promo"
      description="Penawaran resmi dari provider, lengkap dengan masa berlaku dan syaratnya."
    >
      <EmptyState
        icon={TicketPercent}
        title="Belum ada promo aktif"
        description="Promo hanya kami tampilkan bila provider benar-benar menjalankannya — tanpa hitung mundur atau kuota palsu."
        action={
          <ButtonLink href="/packages" variant="secondary">
            Lihat semua paket
          </ButtonLink>
        }
      />
    </ContentPage>
  );
}
