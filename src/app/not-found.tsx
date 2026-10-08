import { SearchX } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/primitives';

export default function NotFound() {
  return (
    <div className="container-page py-16">
      <EmptyState
        icon={SearchX}
        title="Halaman tidak ditemukan"
        description="Halaman ini tidak ada, atau provider/paket yang Anda cari sudah tidak tersedia."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <ButtonLink href="/" variant="secondary">
              Beranda
            </ButtonLink>
            <ButtonLink href="/packages">Lihat paket</ButtonLink>
          </div>
        }
      />
    </div>
  );
}
