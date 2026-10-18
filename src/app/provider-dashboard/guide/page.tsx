import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  Clock,
  CreditCard,
  MapPinned,
  Package,
  Radio,
  SearchCheck,
  ShoppingCart,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Forbidden, PageTitle } from '@/components/dashboard/dashboard-shell';
import { ProviderStatusBadge } from '@/components/dashboard/status-badges';
import { Panel } from '@/components/portal/widgets';
import { Alert, Badge } from '@/components/ui/primitives';
import { requirePermission } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { getReadyDb } from '@/modules/auth/application/bootstrap';
import { countActiveZones } from '@/modules/coverage/application/zone-self-service';
import { getProviderRecord, listPackagesForProvider } from '@/modules/packages/application/catalog';

export const metadata: Metadata = { title: 'Panduan Provider', robots: { index: false } };

/** done = selesai · todo = perlu tindakan Anda · waiting = menunggu GMM · soon = modul belum aktif */
type StepState = 'done' | 'todo' | 'waiting' | 'soon';

interface Step {
  icon: LucideIcon;
  title: string;
  state: StepState;
  detail: React.ReactNode;
  action?: { href: string; label: string };
}

const STATE_BADGE: Record<
  StepState,
  { label: string; tone: 'success' | 'warning' | 'primary' | 'neutral' }
> = {
  done: { label: 'Selesai', tone: 'success' },
  todo: { label: 'Perlu tindakan', tone: 'warning' },
  waiting: { label: 'Menunggu GMM', tone: 'primary' },
  soon: { label: 'Segera aktif', tone: 'neutral' },
};

/** How an order moves once ordering is live (docs/03-business-rules.md §2). */
const ORDER_FLOW: { icon: LucideIcon; title: string; body: string; you?: boolean }[] = [
  {
    icon: SearchCheck,
    title: 'Pelanggan cek coverage',
    body: 'Pelanggan memasukkan alamat dan melihat paket yang tersedia di lokasinya.',
  },
  {
    icon: ShoppingCart,
    title: 'Pelanggan memesan paket',
    body: 'Pelanggan memilih paket Anda dan mengisi data pemasangan.',
  },
  {
    icon: ClipboardCheck,
    title: 'Anda konfirmasi pesanan',
    body: 'Cek kelayakan pemasangan, lalu konfirmasi atau tolak dengan alasan. Pelanggan belum membayar di tahap ini.',
    you: true,
  },
  {
    icon: CreditCard,
    title: 'Pelanggan membayar',
    body: 'Pembayaran diproses sistem GMM. Status lunas hanya ditetapkan oleh sistem.',
  },
  {
    icon: Wrench,
    title: 'Jadwal & pemasangan',
    body: 'Teknisi Anda menjadwalkan, memasang, dan menjalani quality check.',
    you: true,
  },
  {
    icon: Radio,
    title: 'Layanan aktif',
    body: 'Setelah QC lolos, layanan pelanggan aktif.',
  },
];

const RULES = [
  'Paket hanya tampil di marketplace bila provider sudah terverifikasi dan paket disetujui tim GMM.',
  'Harga wajib lengkap: biaya bulanan, instalasi, aktivasi, pajak, dan biaya lain ditampilkan terpisah.',
  'Perubahan harga tidak memengaruhi pesanan yang sudah dibuat.',
  'Pesanan yang ditolak wajib disertai alasan agar pelanggan mendapat kejelasan.',
];

export default async function ProviderGuidePage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { forbidden, session } = await requirePermission(
    'dashboard.provider',
    '/provider-dashboard/guide',
  );
  if (forbidden || !session.actor.providerId) return <Forbidden />;
  const [p, packages, zoneCount] = await Promise.all([
    getProviderRecord(session.actor.providerId),
    listPackagesForProvider(session.actor.providerId),
    getReadyDb().then((db) => countActiveZones(db, session.actor.providerId!)),
  ]);
  if (!p) return <Forbidden />;

  const profileFields: [string, boolean][] = [
    ['Nama badan usaha', Boolean(p.legalName.trim())],
    ['Deskripsi perusahaan', Boolean(p.description.trim())],
    ['Teknologi layanan', p.technologies.length > 0],
    ['Area layanan', p.serviceAreaNames.length > 0],
    ['Jam dukungan', Boolean(p.supportHours.trim())],
    ['Kontak dukungan', Boolean(p.supportPhone || p.supportEmail)],
    ['Info pemasangan', Boolean(p.installationInfo.trim())],
  ];
  const missing = profileFields.filter(([, ok]) => !ok).map(([label]) => label);
  const published = packages.filter((x) => x.status === 'PUBLISHED').length;
  const inReview = packages.filter((x) => x.status === 'PENDING_REVIEW').length;

  const verification: Pick<Step, 'state' | 'detail'> = (() => {
    switch (p.verificationStatus) {
      case 'VERIFIED':
        return {
          state: 'done',
          detail: `Terverifikasi${p.verifiedAt ? ` sejak ${formatDate(p.verifiedAt)}` : ''}. Paket Anda boleh tampil di marketplace.`,
        };
      case 'UNDER_REVIEW':
        return {
          state: 'waiting',
          detail: 'Dokumen Anda sedang direview tim GMM. Kami akan mengabari hasilnya.',
        };
      case 'PENDING':
        return {
          state: 'todo',
          detail:
            'Siapkan dokumen legal (NIB, akta pendirian, NPWP). Unggah dokumen mandiri akan tersedia di menu Pengaturan (STEP 9).',
        };
      default:
        return {
          state: 'todo',
          detail: 'Status verifikasi Anda perlu ditindaklanjuti. Silakan hubungi tim GMM.',
        };
    }
  })();

  const steps: Step[] = [
    {
      icon: Building2,
      title: 'Lengkapi profil perusahaan',
      state: missing.length === 0 ? 'done' : 'todo',
      detail:
        missing.length === 0
          ? `Semua ${profileFields.length} data profil sudah terisi.`
          : `${profileFields.length - missing.length} dari ${profileFields.length} data terisi. Belum ada: ${missing.join(', ')}.`,
      action: { href: '/provider-dashboard/profile', label: 'Lihat profil' },
    },
    {
      icon: BadgeCheck,
      title: 'Verifikasi oleh GMM',
      ...verification,
    },
    {
      icon: Package,
      title: 'Publikasikan paket internet',
      state: published > 0 ? 'done' : inReview > 0 ? 'waiting' : 'todo',
      detail:
        packages.length === 0
          ? 'Belum ada paket. Klik Tambah paket, isi semua biaya, lalu ajukan ke GMM.'
          : `${published} dari ${packages.length} paket dipublikasikan${inReview ? `, ${inReview} menunggu review GMM` : ''}.`,
      action: { href: '/provider-dashboard/packages', label: 'Kelola paket' },
    },
    {
      icon: MapPinned,
      title: 'Atur area layanan (coverage)',
      state: zoneCount > 0 ? 'done' : 'todo',
      detail:
        zoneCount > 0
          ? `${zoneCount} area aktif dipakai saat pelanggan mengecek alamatnya.`
          : 'Tambahkan area (titik tengah + radius) agar pelanggan di lokasi tersebut menemukan paket Anda.',
      action: { href: '/provider-dashboard/coverage', label: 'Buka Area Layanan' },
    },
    {
      icon: ClipboardCheck,
      title: 'Terima & konfirmasi pesanan',
      state: 'soon',
      detail: 'Pesanan pelanggan masuk ke menu Pesanan untuk Anda konfirmasi. Aktif di STEP 5.',
      action: { href: '/provider-dashboard/orders', label: 'Buka Pesanan' },
    },
  ];

  const active = steps.filter((s) => s.state !== 'soon');
  const doneCount = active.filter((s) => s.state === 'done').length;
  const pct = Math.round((doneCount / active.length) * 100);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Panduan Provider"
        description="Langkah agar paket Anda tampil di GMM dan siap menerima pelanggan."
      />
      {(await searchParams).welcome === '1' && (
        <Alert tone="success" title="Pendaftaran berhasil" className="mb-6">
          Perusahaan Anda tercatat dengan status &ldquo;Menunggu dokumen&rdquo;. Ikuti langkah di
          bawah; tim GMM akan menghubungi penanggung jawab untuk verifikasi.
        </Alert>
      )}

      {/* Progress summary */}
      <section className="border-line bg-surface shadow-card rounded-xl border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-fg-muted text-sm">Progres persiapan</p>
            <p className="mt-1 text-lg font-semibold">
              {doneCount} dari {active.length} langkah selesai
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-fg-muted">Status verifikasi:</span>
            <ProviderStatusBadge status={p.verificationStatus} />
          </div>
        </div>
        <div
          className="bg-subtle mt-4 h-2.5 overflow-hidden rounded-full"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label="Progres persiapan provider"
        >
          <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-fg-muted mt-2 text-xs">
          Dihitung dari langkah yang sudah aktif. Langkah bertanda &ldquo;Segera aktif&rdquo;
          menyusul sesuai tahap pengembangan.
        </p>
      </section>

      {/* Checklist */}
      <Panel title="Checklist langkah awal">
        <ol className="space-y-3">
          {steps.map((s, i) => {
            const badge = STATE_BADGE[s.state];
            const StateIcon =
              s.state === 'done' ? CheckCircle2 : s.state === 'waiting' ? Clock : CircleDashed;
            return (
              <li
                key={s.title}
                className={cn(
                  'flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center',
                  s.state === 'done'
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : s.state === 'todo'
                      ? 'border-amber-200 bg-amber-50/40'
                      : 'border-line',
                )}
              >
                <span
                  className={cn(
                    'grid size-11 shrink-0 place-items-center rounded-full',
                    s.state === 'done'
                      ? 'bg-emerald-100 text-emerald-600'
                      : s.state === 'soon'
                        ? 'bg-subtle text-fg-muted'
                        : 'bg-primary-soft text-primary',
                  )}
                >
                  <s.icon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-fg-muted text-xs font-semibold">Langkah {i + 1}</span>
                    <Badge tone={badge.tone}>
                      <StateIcon className="size-3.5" aria-hidden="true" /> {badge.label}
                    </Badge>
                  </div>
                  <h3 className="mt-1 text-base font-semibold">{s.title}</h3>
                  <p className="text-fg-muted mt-0.5 text-sm">{s.detail}</p>
                </div>
                {s.action && (
                  <Link
                    href={s.action.href}
                    className="border-line text-fg hover:border-primary/50 hover:text-primary inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border bg-white px-3 py-2 text-sm font-medium transition-colors sm:self-center"
                  >
                    {s.action.label} <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </Panel>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* Order flow */}
        <Panel title="Alur pesanan pelanggan">
          <p className="text-fg-muted -mt-1 mb-4 text-sm">
            Gambaran alur setelah pemesanan online aktif (bertahap mulai STEP 5). Langkah bertanda{' '}
            <span className="text-primary font-medium">Peran Anda</span> dikerjakan oleh tim Anda.
          </p>
          <ol className="relative space-y-5">
            <span
              aria-hidden="true"
              className="bg-line absolute top-2 bottom-2 left-[19px] w-0.5 rounded-full"
            />
            {ORDER_FLOW.map((f, i) => (
              <li key={f.title} className="relative flex gap-4">
                <span
                  className={cn(
                    'relative grid size-10 shrink-0 place-items-center rounded-full border-2',
                    f.you
                      ? 'border-primary bg-primary text-white'
                      : 'border-line bg-surface text-fg-muted',
                  )}
                >
                  <f.icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold">
                      {i + 1}. {f.title}
                    </h3>
                    {f.you && <Badge tone="primary">Peran Anda</Badge>}
                  </div>
                  <p className="text-fg-muted mt-0.5 text-sm">{f.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>

        {/* Rules */}
        <Panel title="Aturan penting di GMM">
          <ul className="space-y-3">
            {RULES.map((r) => (
              <li key={r} className="flex gap-3 text-sm">
                <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
