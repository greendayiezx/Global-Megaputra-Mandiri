import {
  Building2,
  CircleHelp,
  FileText,
  Handshake,
  Newspaper,
  ShieldCheck,
  TicketPercent,
  type LucideIcon,
} from 'lucide-react';
import { TECHNOLOGIES, TECHNOLOGY_LABEL } from '@/modules/packages/application/catalog-repository';
import { SPEED_RANGES } from '@/modules/packages/domain/filters';

/** Header navigation — plain data, importable from both server and client components. */

export type NavMenu = 'packages' | 'providers' | 'more';

export interface NavItem {
  href: string;
  label: string;
  /** Opens a dropdown instead of navigating directly (href stays the fallback/landing page). */
  menu?: NavMenu;
  /** Extra path prefixes that mark this item active. */
  match?: readonly string[];
}

export const MAIN_NAV: readonly NavItem[] = [
  { href: '/', label: 'Beranda' },
  { href: '/packages', label: 'Paket', menu: 'packages', match: ['/compare'] },
  { href: '/provider', label: 'Provider', menu: 'providers' },
  { href: '/coverage', label: 'Cek Coverage' },
  { href: '/how-it-works', label: 'Cara Kerja' },
  {
    href: '/about',
    label: 'Lainnya',
    menu: 'more',
    match: ['/blog', '/faq', '/terms', '/privacy', '/mitra', '/promo'],
  },
];

export interface MoreLink {
  href: string;
  label: string;
  body: string;
  icon: LucideIcon;
}

/** "Lainnya" menu, grouped. Icons only (no photos). */
export const MORE_GROUPS: readonly { title: string; links: readonly MoreLink[] }[] = [
  {
    title: 'Perusahaan',
    links: [
      {
        href: '/about',
        label: 'Tentang Kami',
        body: 'Siapa GMM dan cara kami bekerja',
        icon: Building2,
      },
      { href: '/blog', label: 'Blog', body: 'Tips memilih internet', icon: Newspaper },
      {
        href: '/mitra',
        label: 'Jadi Mitra',
        body: 'Daftarkan perusahaan provider Anda',
        icon: Handshake,
      },
    ],
  },
  {
    title: 'Bantuan',
    links: [
      {
        href: '/faq',
        label: 'Pertanyaan Umum',
        body: 'Jawaban sebelum Anda memesan',
        icon: CircleHelp,
      },
      {
        href: '/promo',
        label: 'Promo',
        body: 'Penawaran aktif dari provider',
        icon: TicketPercent,
      },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/terms', label: 'Syarat Layanan', body: 'Ketentuan penggunaan GMM', icon: FileText },
      {
        href: '/privacy',
        label: 'Kebijakan Privasi',
        body: 'Cara kami menjaga data Anda',
        icon: ShieldCheck,
      },
    ],
  },
];

export const MORE_LINKS = MORE_GROUPS.flatMap((g) => g.links);

export const SPEED_LINKS = SPEED_RANGES.map((r) => ({
  href: `/packages?speed=${r.key}`,
  label: `${r.min}–${r.max} Mbps`,
}));

export const TECHNOLOGY_LINKS = TECHNOLOGIES.map((t) => ({
  href: `/packages?technology=${t}`,
  label: TECHNOLOGY_LABEL[t],
}));

export const PROVIDER_TECH_LINKS = TECHNOLOGIES.map((t) => ({
  href: `/provider?technology=${t}`,
  label: TECHNOLOGY_LABEL[t],
}));

const unsplash = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=640&h=400&q=70`;

/**
 * Generic illustration per access technology for provider cards, used until providers
 * upload their own imagery. Never a provider's brand or logo.
 */
export const TECHNOLOGY_ILLUSTRATION: Record<(typeof TECHNOLOGIES)[number], string> = {
  FIBER: unsplash('photo-1520869562399-e772f042f422'),
  FIXED_WIRELESS: unsplash('photo-1516044734145-07ca8eef8731'),
  CABLE: unsplash('photo-1544197150-b99a580bb7a8'),
  SATELLITE: unsplash('photo-1451187580459-43490279c0fa'),
};
