import { Building2, Gamepad2, GraduationCap, House, type LucideIcon } from 'lucide-react';

const unsplash = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=640&h=400&q=70`;

export interface Need {
  key: string;
  icon: LucideIcon;
  title: string;
  body: string;
  /** Package filter behind this need; also used to compute its real starting price. */
  minDownload?: number;
  minUpload?: number;
  href: string;
  /** Illustrative stock photo (Unsplash), not a real customer. */
  image: string;
  imageAlt: string;
}

/** "Cari internet sesuai kebutuhan" shortcuts, shared by the homepage and the Paket menu. */
export const NEEDS: readonly Need[] = [
  {
    key: 'rumah',
    icon: House,
    title: 'Untuk Rumah',
    body: 'Streaming, belajar, dan banyak perangkat.',
    minDownload: 30,
    href: '/packages?minDownload=30',
    image: unsplash('photo-1609220136736-443140cffec6'),
    imageAlt: 'Ilustrasi: ayah bersama dua anaknya di depan rumah',
  },
  {
    key: 'bisnis',
    icon: Building2,
    title: 'Untuk Bisnis',
    body: 'Unggah stabil untuk kasir, CCTV, dan rapat.',
    minUpload: 50,
    href: '/packages?minUpload=50',
    image: unsplash('photo-1556761175-b413da4baf72'),
    imageAlt: 'Ilustrasi: tim bekerja bersama di kantor',
  },
  {
    key: 'sekolah',
    icon: GraduationCap,
    title: 'Untuk Sekolah',
    body: 'Kelas daring dan lab komputer.',
    minDownload: 50,
    href: '/packages?minDownload=50',
    image: unsplash('photo-1588196749597-9ff075ee6b5b'),
    imageAlt: 'Ilustrasi: kelas daring di layar laptop',
  },
  {
    key: 'gaming',
    icon: Gamepad2,
    title: 'Untuk Gaming',
    body: 'Kecepatan tinggi untuk unduh dan main daring.',
    minDownload: 100,
    href: '/packages?minDownload=100',
    image: unsplash('photo-1542751371-adc38448a05e'),
    imageAlt: 'Ilustrasi: pemain game di depan komputer',
  },
];
