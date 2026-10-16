import type { Metadata } from 'next';
import { Forbidden, PageTitle } from '@/components/dashboard/dashboard-shell';
import { ProviderStatusBadge } from '@/components/dashboard/status-badges';
import { ProfileForm } from '@/components/provider/profile-form';
import { ResubmitButton } from '@/components/provider/resubmit-button';
import { Alert } from '@/components/ui/primitives';
import { requirePermission } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';
import { getReadyDb } from '@/modules/auth/application/bootstrap';
import { can } from '@/modules/auth/domain/rbac';
import { PROFILE_FIELD_LABEL } from '@/modules/providers/application/provider-review';
import { getOwnProvider } from '@/modules/providers/application/provider-self-service';

export const metadata: Metadata = { title: 'Profil Provider', robots: { index: false } };

const STATUS_COPY = {
  PENDING: 'Lengkapi profil di bawah. Tim GMM akan meninjau setelah data lengkap.',
  UNDER_REVIEW: 'Tim GMM sedang meninjau data Anda.',
  VERIFIED: 'Provider Anda terverifikasi dan tampil di marketplace.',
  REJECTED: 'Pengajuan ditolak. Perbaiki data sesuai catatan, lalu ajukan ulang.',
  SUSPENDED: 'Provider ditangguhkan dan tidak tampil di marketplace. Hubungi tim GMM.',
} as const;

export default async function ProviderProfilePage() {
  const { forbidden, session } = await requirePermission(
    'dashboard.provider',
    '/provider-dashboard/profile',
  );
  if (forbidden || !session.actor.providerId) return <Forbidden />;
  const data = await getOwnProvider(await getReadyDb(), session.actor);
  if (!data) return <Forbidden />;
  const { provider: p, readiness, lastDecision, lockedFields, canResubmit } = data;
  const canEdit = can(session.actor, 'provider.update', { providerId: p.id });

  return (
    <>
      <PageTitle
        title="Profil perusahaan"
        description="Data usaha untuk verifikasi GMM dan informasi yang tampil di halaman provider Anda."
      />
      <Alert
        tone={
          p.verificationStatus === 'VERIFIED'
            ? 'success'
            : p.verificationStatus === 'REJECTED' || p.verificationStatus === 'SUSPENDED'
              ? 'danger'
              : 'info'
        }
        title={<ProviderStatusBadge status={p.verificationStatus} />}
        className="mb-5"
      >
        <p>{STATUS_COPY[p.verificationStatus]}</p>
        {p.verifiedAt && p.verificationStatus === 'VERIFIED' && (
          <p className="mt-1">Terverifikasi sejak {formatDate(p.verifiedAt)}.</p>
        )}
        {lastDecision?.reason && p.verificationStatus !== 'VERIFIED' && (
          <p className="mt-2">
            <span className="font-semibold">Catatan GMM:</span> {lastDecision.reason}
          </p>
        )}
        {!readiness.ready && p.verificationStatus !== 'VERIFIED' && (
          <p className="mt-2">
            Belum diisi:{' '}
            {readiness.missingProfileFields.map((f) => PROFILE_FIELD_LABEL[f]).join(', ')}.
          </p>
        )}
        {canResubmit && canEdit && <ResubmitButton />}
      </Alert>

      {canEdit ? (
        <ProfileForm
          locked={lockedFields}
          values={{
            displayName: p.displayName,
            legalName: p.legalName,
            nib: p.nib ?? '',
            address: p.address ?? '',
            picName: p.picName ?? '',
            picPhone: p.picPhone ?? '',
            picEmail: p.picEmail ?? '',
            description: p.description,
            website: p.website ?? '',
            supportPhone: p.supportPhone ?? '',
            supportEmail: p.supportEmail ?? '',
            supportHours: p.supportHours,
            slaSummary: p.slaSummary ?? '',
            installationInfo: p.installationInfo,
            technologies: p.technologies,
            serviceAreaNames: p.serviceAreaNames.join('\n'),
          }}
        />
      ) : (
        <Alert tone="info">
          Peran Anda hanya dapat melihat profil. Hubungi pemilik akun provider.
        </Alert>
      )}
    </>
  );
}
