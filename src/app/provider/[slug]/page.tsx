import { BadgeCheck, MessageSquareText } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PackageCard } from '@/components/marketplace/package-card';
import { ProviderAvatar } from '@/components/marketplace/provider-avatar';
import { ButtonLink } from '@/components/ui/button';
import { Breadcrumb, Card, DemoBadge, EmptyState, RatingSummary } from '@/components/ui/primitives';
import { formatDate } from '@/lib/format';
import { point, qs, type RawSearchParams } from '@/lib/search-params';
import { getPublicProvider } from '@/modules/packages/application/catalog';
import { TECHNOLOGY_LABEL } from '@/modules/packages/application/catalog-repository';
import { showVerifiedBadge } from '@/modules/providers/domain/provider-rules';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getPublicProvider((await params).slug);
  return data
    ? {
        title: `${data.provider.displayName} — Paket & Coverage`,
        description: data.provider.description,
      }
    : { title: 'Provider tidak ditemukan' };
}

export default async function ProviderPage({ params, searchParams }: Props) {
  const data = await getPublicProvider((await params).slug);
  if (!data) notFound();
  const { provider: p, packages } = data;
  const pt = point(await searchParams);
  const locationQuery = pt ? qs({ lat: pt.lat, lng: pt.lng }) : '';

  const info: [string, string][] = [
    ['Nama badan usaha', p.legalName],
    ['Teknologi', p.technologies.map((t) => TECHNOLOGY_LABEL[t]).join(', ')],
    ['Area layanan', p.serviceAreaNames.join(', ')],
    ['Jam dukungan', p.supportHours],
    ['SLA', p.slaSummary ?? 'Tidak dinyatakan provider'],
    ['Kontak', p.supportEmail ?? p.supportPhone ?? 'Melalui GMM'],
  ];

  return (
    <div className="container-page py-6 md:py-8">
      <Breadcrumb
        items={[
          { label: 'Beranda', href: '/' },
          { label: 'Provider', href: '/provider' },
          { label: p.displayName },
        ]}
      />

      <Card className="mt-5 p-5 md:p-6">
        <div className="flex flex-wrap items-start gap-4">
          <ProviderAvatar name={p.displayName} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[26px] font-bold md:text-[30px]">{p.displayName}</h1>
              {p.isDemo && <DemoBadge />}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
              <RatingSummary average={null} count={0} />
              {showVerifiedBadge(p) && p.verifiedAt && (
                <span className="text-primary-hover inline-flex items-center gap-1 text-[13px] font-medium">
                  <BadgeCheck className="size-4" aria-hidden="true" />
                  Verified Provider · {formatDate(p.verifiedAt)}
                </span>
              )}
            </div>
            <p className="text-fg-secondary mt-3 max-w-3xl">{p.description}</p>
          </div>
          <ButtonLink href={`/coverage`} className="w-full sm:w-auto">
            Cek Ketersediaan
          </ButtonLink>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="space-y-8 lg:col-span-8">
          <section aria-labelledby="pkgs">
            <h2 id="pkgs" className="text-xl font-semibold">
              Paket ({packages.length})
            </h2>
            {packages.length === 0 ? (
              <p className="text-fg-muted mt-4 text-sm">Belum ada paket yang dipublikasikan.</p>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {packages.map((v) => (
                  <PackageCard key={v.pkg.id} view={v} query={locationQuery} />
                ))}
              </div>
            )}
          </section>
          <section aria-labelledby="reviews">
            <h2 id="reviews" className="text-xl font-semibold">
              Ulasan
            </h2>
            <EmptyState
              className="mt-4"
              icon={MessageSquareText}
              title="Belum ada ulasan"
              description="Ulasan muncul setelah pelanggan yang terpasang melalui GMM menuliskannya."
            />
          </section>
        </div>
        <aside className="space-y-4 lg:col-span-4">
          <Card>
            <h2 className="border-line border-b px-5 py-3.5 text-base font-semibold">
              Informasi provider
            </h2>
            <dl className="divide-line divide-y">
              {info.map(([k, v]) => (
                <div key={k} className="px-5 py-3 text-sm">
                  <dt className="text-fg-muted text-xs">{k}</dt>
                  <dd className="mt-0.5 font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card className="p-5">
            <h2 className="text-base font-semibold">Pemasangan</h2>
            <p className="text-fg-secondary mt-2 text-sm">{p.installationInfo}</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
