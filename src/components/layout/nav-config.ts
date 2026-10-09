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
  { href: '/provider', label: 'Provider', menu: 'providers', match: ['/mitra'] },
  { href: '/coverage', label: 'Cek Coverage' },
  { href: '/how-it-works', label: 'Cara Kerja' },
  {
    href: '/about',
    label: 'Lainnya',
    menu: 'more',
    match: ['/blog', '/faq', '/terms', '/privacy'],
  },
];

export const MORE_LINKS = [
  { href: '/about', label: 'Tentang Kami', body: 'Siapa GMM dan cara kami bekerja' },
  { href: '/blog', label: 'Blog', body: 'Tips memilih internet' },
  { href: '/faq', label: 'Pertanyaan Umum', body: 'Jawaban sebelum Anda memesan' },
  { href: '/terms', label: 'Syarat Layanan', body: 'Ketentuan penggunaan GMM' },
  { href: '/privacy', label: 'Kebijakan Privasi', body: 'Cara kami menjaga data Anda' },
] as const;

export const SPEED_LINKS = SPEED_RANGES.map((r) => ({
  href: `/packages?speed=${r.key}`,
  label: `${r.min}–${r.max} Mbps`,
}));

export const TECHNOLOGY_LINKS = TECHNOLOGIES.map((t) => ({
  href: `/packages?technology=${t}`,
  label: TECHNOLOGY_LABEL[t],
}));
