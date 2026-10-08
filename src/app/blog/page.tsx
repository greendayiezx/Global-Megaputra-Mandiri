import { Newspaper } from 'lucide-react';
import type { Metadata } from 'next';
import { ContentPage } from '@/components/layout/content-page';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/primitives';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Panduan memilih internet rumah dan bisnis dari GMM.',
};

export default function BlogPage() {
  return (
    <ContentPage
      crumb="Blog"
      title="Blog"
      description="Panduan praktis memilih dan merawat koneksi internet."
    >
      <EmptyState
        icon={Newspaper}
        title="Belum ada artikel"
        description="Artikel akan dikelola lewat CMS GMM dan tampil di sini setelah diterbitkan."
        action={
          <ButtonLink href="/faq" variant="secondary">
            Baca FAQ
          </ButtonLink>
        }
      />
    </ContentPage>
  );
}
