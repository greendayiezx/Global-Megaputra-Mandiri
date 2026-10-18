import { MapPin, Package } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { RequestForm } from '@/components/requests/request-form';
import { Card } from '@/components/ui/primitives';
import { formatRupiah } from '@/lib/format';
import { getPublicPackage } from '@/modules/packages/application/catalog';

export const metadata: Metadata = {
  title: 'Ajukan Survei atau Pemasangan',
  description:
    'Minta tim GMM mengecek lokasi Anda atau menghubungi Anda untuk pemasangan internet.',
  robots: { index: false },
};

type Props = {
  searchParams: Promise<{
    lat?: string;
    lng?: string;
    package?: string;
    kind?: string;
    address?: string;
  }>;
};

const num = (v: string | undefined) => {
  const n = Number(v);
  return v && Number.isFinite(n) ? n : null;
};

export default async function RequestPage({ searchParams }: Props) {
  const sp = await searchParams;
  const view = sp.package ? await getPublicPackage(sp.package) : null;
  const kind = sp.kind === 'INSTALLATION' && view ? 'INSTALLATION' : 'SURVEY';
  const lat = num(sp.lat);
  const lng = num(sp.lng);

  return (
    <div className="container-page max-w-3xl py-8 md:py-12">
      <h1 className="text-[28px] leading-tight font-bold md:text-[34px]">
        {kind === 'INSTALLATION' ? 'Minta dihubungi untuk pemasangan' : 'Ajukan survei lokasi'}
      </h1>
      <p className="text-fg-secondary mt-2">
        {kind === 'INSTALLATION'
          ? 'Tim GMM menghubungi Anda untuk memastikan lokasi dan menjelaskan langkah pemasangan.'
          : 'Tim GMM mengecek provider yang bisa menjangkau alamat Anda, termasuk menjadwalkan survei bila perlu.'}{' '}
        Anda mendapat kode referensi untuk memantau statusnya.
      </p>

      {(view || lat !== null) && (
        <Card className="mt-6 space-y-2 p-4 text-sm">
          {view && (
            <p className="flex items-center gap-2">
              <Package className="text-primary size-4 shrink-0" aria-hidden="true" />
              <span>
                <span className="font-semibold">{view.pkg.name}</span> · {view.provider.displayName}{' '}
                · {formatRupiah(view.pkg.monthlyPrice)}/bulan
              </span>
            </p>
          )}
          {lat !== null && lng !== null && (
            <p className="flex items-center gap-2">
              <MapPin className="text-primary size-4 shrink-0" aria-hidden="true" />
              Titik di peta: {lat.toFixed(5)}, {lng.toFixed(5)}
            </p>
          )}
        </Card>
      )}

      <Card className="mt-6 p-5 sm:p-7">
        <RequestForm
          kind={kind}
          lat={lat}
          lng={lng}
          packageSlug={view ? view.pkg.slug : null}
          address={sp.address ?? ''}
        />
      </Card>
      <p className="text-fg-muted mt-4 text-sm">
        Sudah punya kode referensi?{' '}
        <Link href="/permintaan/cek" className="text-primary font-medium">
          Cek status permintaan
        </Link>
      </p>
    </div>
  );
}
