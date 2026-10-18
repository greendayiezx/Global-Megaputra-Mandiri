# 07 — Daftar Item Pending

Status per **11 Oktober 2026**. Dokumen ini diperbarui setiap ada item yang selesai atau
bertambah. Centang `[x]` berarti selesai.

Legenda prioritas: **P1** = menghalangi peluncuran · **P2** = penting · **P3** = penyempurnaan.

---

## A. Butuh tindakan dari Anda (konfigurasi, aset, keputusan)

| #   | Item                                        | Yang dibutuhkan                                                                                                                                                                                                                                   | Prioritas |
| --- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| A1  | **Aktifkan Login dengan Google**            | Buat OAuth Client (Web application) di Google Cloud Console, daftarkan redirect URI `http://localhost:3000/api/auth/google/callback` (dan domain produksi), lalu isi `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` di `.env`. Kodenya sudah siap. | P2        |
| A2  | **Data provider asli**                      | Daftar provider yang sudah bermitra: nama, badan usaha, dokumen legal (NIB, akta, NPWP), area layanan, logo/foto. Saat ini hanya 2 provider **demo**.                                                                                             | P1        |
| A3  | **Data paket asli**                         | Paket tiap provider: kecepatan, harga bulanan, biaya instalasi/aktivasi, kontrak, FUP, SLA, pajak termasuk/tidak. Saat ini 6 paket **demo**.                                                                                                      | P1        |
| A4  | **Data area layanan (coverage) asli**       | Polygon/radius/wilayah administratif tiap provider. Saat ini area demo di Jakarta–Depok–Bogor.                                                                                                                                                    | P1        |
| A5  | **Logo & foto provider**                    | Logo resmi tiap provider (dengan izin pemakaian merek). Dropdown & kartu provider sekarang memakai foto ilustrasi teknologi.                                                                                                                      | P2        |
| A6  | **Data badan hukum GMM** (D15)              | Nama PT, alamat, NPWP, kontak DPO, untuk halaman Syarat Layanan, Kebijakan Privasi, dan Kebijakan Refund (masih bertanda "dalam tinjauan hukum").                                                                                                 | P1        |
| A7  | **Keputusan bisnis D1–D15**                 | Lihat bagian D di bawah. Beberapa memblokir pemesanan & pembayaran.                                                                                                                                                                               | P1        |
| A8  | **Promo asli**                              | Data promo (provider, periode, syarat). Halaman Promo & filter "Sedang promo" masih kosong karena belum ada data.                                                                                                                                 | P3        |
| A9  | **Foto ilustrasi milik sendiri** (opsional) | Saat ini banyak memakai foto stok Unsplash (kartu kebutuhan, langkah mitra, provider). Bisa diganti foto GMM sendiri.                                                                                                                             | P3        |
| A10 | **Banner portal per provider**              | Gambar banner sudah dipakai (`public/images/SuperAdmin/` & `public/images/Provider/`). Catatan: banner provider berlogo Biznet tampil untuk **semua** provider; sebaiknya ganti gambar umum atau banner per-provider.                             | P3        |
| A11 | **Video hero** (opsional)                   | Video pendek (10–20 detik, tanpa suara, < 5 MB, mp4) disimpan di `public/videos/hero.mp4` — otomatis tampil di hero beranda. Foto tetap jadi cadangan.                                                                                            | P3        |

## B. Fitur website yang belum dibangun

| #   | Item                                    | Keterangan                                                                                              | Prioritas |
| --- | --------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------- |
| B1  | **Lupa password / reset password**      | Butuh halaman reset + pengiriman email (butuh layanan email, mis. SMTP).                                | P1        |
| B2  | **Login dengan nomor telepon**          | Server saat ini hanya menerima email. Butuh keputusan: telepon + password, atau OTP SMS (biaya SMS).    | P3        |
| B3  | **Daftar dengan Google** di form daftar | Tombol baru ada di halaman Masuk (login Google otomatis membuat akun baru).                             | P3        |
| B4  | **Verifikasi email**                    | Akun daftar manual belum diverifikasi lewat email (akun Google sudah otomatis terverifikasi).           | P2        |
| B5  | **Bahasa Inggris**                      | Menu bahasa menampilkan "English — Segera hadir".                                                       | P3        |
| B6  | **Unggah dokumen mitra**                | Pendaftaran `/mitra/daftar` sudah jalan; unggah dokumen legal menyusul (butuh penyimpanan file privat). | P1        |
| B7  | **Pemesanan online**                    | Tombol pesan di detail paket masih "Pemesanan online segera dibuka" (lihat STEP 5).                     | P1        |
| B8  | **Ulasan & rating**                     | Filter Rating & urutan "Rating Terbaik" nonaktif sampai ada ulasan terverifikasi (Fase 2).              | P2        |
| B9  | **Teknologi 4G/5G**                     | Belum ada di pilihan teknologi; ditambahkan bila ada paket 4G/5G.                                       | P3        |
| B10 | **Blog / CMS**                          | Konten blog & FAQ masih statis di kode (Fase 2).                                                        | P3        |
| B11 | **Halaman Kontak**                      | `/contact` dengan formulir (rate-limited) belum dibuat.                                                 | P2        |
| B13 | **Grafik & angka dashboard portal**     | Total pesanan/transaksi/pendapatan dan grafiknya tampil "—" sampai STEP 5–6.                            | P1        |
| B14 | **Notifikasi portal**                   | Lonceng notifikasi masih kosong (Fase 2).                                                               | P2        |

## C. Modul sistem (roadmap STEP)

| STEP / Fase | Modul                                                                                           | Halaman yang masih "Modul ini belum aktif"      |
| ----------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| ~~STEP 3~~  | ✅ Selesai — lihat bagian F. Sisa: unggah dokumen legal (B6), peta poligon, pengaturan (STEP 5) | Admin: Pengaturan                               |
| STEP 5      | Pesanan (checkout, konfirmasi provider)                                                         | Admin & Provider: Pesanan · angka dashboard "—" |
| STEP 6      | Pembayaran (payment gateway)                                                                    | Admin: Pembayaran · Pelanggan: Pembayaran       |
| STEP 7      | Instalasi (jadwal teknisi)                                                                      | Admin & Provider: Instalasi                     |
| STEP 8      | Portal pelanggan                                                                                | Pelanggan: Langganan                            |
| STEP 9      | Pelanggan & pengaturan provider                                                                 | Provider: Pelanggan, Pengaturan                 |
| ~~STEP 11~~ | ✅ Tiket bantuan dasar selesai (lihat bagian G). Sisa: notifikasi email, target SLA (D8)        | —                                               |
| Fase 2      | Ulasan, notifikasi, promo, CMS                                                                  | Pelanggan: Ulasan, Notifikasi                   |
| Fase 3      | Leads, analitik, referral & komisi, tagihan berulang                                            | Provider: Leads, Analitik · Pelanggan: Tagihan  |

## D. Keputusan bisnis yang masih terbuka (`TODO_BUSINESS_DECISION`)

Detail lengkap ada di `docs/00-product-scope-and-assumptions.md` §5.

| ID  | Keputusan                                                     | Dampak bila belum diputuskan                                     |
| --- | ------------------------------------------------------------- | ---------------------------------------------------------------- |
| D1  | Alur uang: GMM menampung dana pelanggan atau provider menagih | Penyelesaian dana ke provider tidak diotomatisasi                |
| D2  | Model pendapatan GMM (komisi, biaya listing, dll.)            | Tidak ada aturan komisi                                          |
| D3  | PPN: tarif & pihak yang memungut                              | Total harga ditampilkan "menunggu konfigurasi"; pesanan diblokir |
| D4  | Bulan pertama ditagih di muka atau tidak                      | Sama seperti D3                                                  |
| D5  | Konfirmasi provider sebelum bayar untuk semua pesanan?        | Default: wajib untuk semua (paling aman bagi pelanggan)          |
| D6  | Kebijakan refund                                              | Refund hanya sebelum aktif                                       |
| D7  | Provider yang wajib KTP/NIK                                   | KTP tidak diminta                                                |
| D8  | Target SLA tiket                                              | Timer tanpa alarm pelanggaran                                    |
| D9  | Masa simpan data (UU PDP)                                     | Pembersihan data otomatis belum berjalan                         |
| D10 | Aturan ulasan & moderasi                                      | Hanya pelanggan aktif, dimoderasi                                |
| D11 | Komisi referral & pajak                                       | Belum dibangun                                                   |
| D12 | Apa yang boleh memengaruhi urutan "Rekomendasi"               | Rumus tetap tanpa penempatan berbayar                            |
| D13 | Kapan data coverage dianggap kedaluwarsa                      | Tidak ada penurunan status otomatis                              |
| D14 | Slot jadwal instalasi                                         | Provider mengusulkan jadwal                                      |
| D15 | Data badan hukum untuk halaman legal                          | Banner "draft — tinjauan hukum"                                  |

## E. Catatan teknis

- **Docker ditunda**: database memakai PGlite (lokal). Untuk produksi perlu PostgreSQL + PostGIS,
  Redis (rate limit bersama), dan S3/MinIO (dokumen).
- **Rate limit** masih di memori (satu proses).
- **Alamat belum di-geocode**: titik pin di peta yang menentukan coverage.
- **Lingkungan produksi**: `RATE_LIMIT_SECRET`, `APP_URL`, `APP_ALLOWED_ORIGINS` wajib diisi.

### E1. Lingkungan Dev → Staging → Production

Staging dipilih di **Vercel + Neon** (cepat online untuk investor). Kode staging selesai; panduan
pemasangan di [docs/10-staging-vercel.md](10-staging-vercel.md).

| Lingkungan     | Tempat                 | Database                | Data              | Akses                                 |
| -------------- | ---------------------- | ----------------------- | ----------------- | ------------------------------------- |
| **Dev**        | Laptop (`npm run dev`) | PGlite lokal (`.data/`) | Akun & paket demo | Developer                             |
| **Staging**    | Vercel (Singapura)     | Neon PostgreSQL         | Akun & paket demo | Link + kata sandi opsional, `noindex` |
| **Production** | Belum ditentukan       | PostgreSQL + PostGIS    | Data asli         | Publik                                |

- [x] PostgreSQL asli didukung (pooler Neon, migrasi lewat koneksi direct, `vercel-build`).
- [x] Penanda staging: `APP_ENV=staging` **dan** `APP_SHOW_DEMO_DATA=true` (akun demo hanya bila keduanya).
- [x] Gerbang kata sandi `STAGING_BASIC_AUTH`, header `noindex`, region Singapura.
- [x] Neon & Vercel aktif: `https://gmm-staging.vercel.app` (dikunci `STAGING_BASIC_AUTH`).
- [x] Alur local → staging: kerja di `claude/gifted-knuth-s18uyp`, staging hanya dari branch `staging`
      (Production Branch di Vercel) setelah disetujui.
- [ ] Audit log: batasi akses ke peran tertentu, tambah ekspor & masa simpan (D9); nanti salin ke
      penyimpanan terpisah (log drain). Audit log per-akun di Portal Provider (STEP 3/9).
- [ ] Pelacak error (mis. Sentry) sebelum live ke pelanggan.
- [ ] Redis untuk rate limit sebelum production multi-server.
- [ ] Production: pilih hosting (VPS + Docker untuk PostGIS/Redis/MinIO, atau tetap Vercel + layanan terkelola).

---

## F. STEP 3 — Katalog di database (selesai)

- [x] Tabel `providers`, `provider_status_history`, `internet_packages`, `package_price_history`,
      `coverage_zones` (migrasi `0001_catalog`); katalog publik dibaca dari database. Data demo
      hanya diisi otomatis di dev/staging, tidak pernah di production.
- [x] **Admin**: tinjau provider (profil, kelengkapan, riwayat keputusan) → mulai tinjau /
      setujui / tolak / kembalikan / tangguhkan; antrean review paket → terbitkan / kembalikan ke
      draf / tangguhkan / arsipkan. Alasan wajib untuk jalur pengecualian; semua tercatat di audit log.
- [x] **Provider**: ubah profil (nama badan usaha & NIB terkunci setelah diverifikasi), ajukan ulang
      setelah ditolak; buat paket (draf → ajukan), ubah paket (perubahan harga/spesifikasi paket yang
      sedang tampil → turun & review ulang, harga lama tersimpan di riwayat); area layanan radius.
- [ ] Unggah dokumen legal + pemeriksaan dokumen di admin (B6, butuh penyimpanan file privat).
- [ ] Editor peta untuk poligon; pencocokan kode pos / wilayah administratif (butuh geocoding).
- [ ] Audit log per-akun di Portal Provider; undangan staf provider (STEP 9).
- [ ] Pindah geometri ke PostGIS saat jumlah area besar (sekarang JSON, cukup untuk ratusan area).
- Keputusan yang dibutuhkan: lihat [docs/11-konfirmasi-pm.md](11-konfirmasi-pm.md).

## G. Paket saran reviewer (selesai)

- [x] **Pendaftaran mitra** `/mitra/daftar`: akun pemilik + provider "Menunggu dokumen" + masuk antrean
      admin; langsung ke Panduan Provider.
- [x] **Permintaan survei/pemasangan** `/permintaan` (dari hasil coverage & detail paket) dengan
      persetujuan tersimpan (versi `permintaan-v1`), kode `GMM-XXXXXX`, cek status `/permintaan/cek`
      (kode + 4 digit ponsel). Admin: menu **Permintaan**. Data pribadi: masa simpan menunggu D9.
- [x] **Pilih wilayah** provinsi → kelurahan (Kepmendagri 2025, `public/data/wilayah`, dibangun ulang
      dengan `node scripts/build-wilayah.mjs <wilayah.sql> <wilayah_level_1_2.sql>` dari
      github.com/cahyadsn/wilayah). Provider bisa mendaftarkan area per kecamatan/kelurahan.
- [x] **Tiket bantuan**: pelanggan `/dashboard/support`, admin **Bantuan & Tiket** (catatan internal,
      status, ambil tiket). Kode `TKT-XXXXXX`.
- [x] **SEO dasar**: `robots.txt` (staging diblokir), `sitemap.xml`, canonical, Open Graph.
- [x] Kategori kebutuhan **Kos** (≥75 Mbps).
- [x] **Perbaikan keamanan**: aksi khusus staf kini mewajibkan izin cakupan `any`
      (`authorizePlatform`), sehingga pelanggan/provider tidak bisa memanggilnya langsung.
- [ ] Notifikasi (email/WhatsApp) saat status permintaan/tiket berubah — butuh layanan email (L2).
- [ ] Provider melihat permintaan yang diteruskan kepadanya (keputusan model bisnis, lihat docs/11).

## Sudah selesai (sesi ini)

- [x] Konsultasi WhatsApp (0853-9707-4845): tombol melayang di halaman publik (pesan berisi halaman
      yang sedang dilihat), bagian "Masih bingung memilih paket?" di beranda, halaman `/konsultasi`
      (form → pesan WhatsApp, tanpa menyimpan data), tombol di hasil cek coverage "belum ada
      provider/perlu survei" dan di detail paket. Foto: `public/images/Konsultasi_GMM.png` (banner
      2880×900) dan opsional `Konsultasi_GMM_Card.png` (beranda, 1600×1200). Nomor tidak ditampilkan.

- [x] Perbaikan error PGlite di Windows
- [x] Logo GMM baru di header, footer
- [x] Header: bar atas, menu di bawah pencarian, mega menu Paket/Provider/Lainnya (klik), animasi ikon
- [x] Banner beranda tanpa logo; bar demo disembunyikan
- [x] Filter paket (slider harga, checkbox) & dropdown premium (filter provider, urutkan)
- [x] Halaman Cara Kerja dengan timeline animasi
- [x] FAQ accordion di beranda
- [x] Tampilan Bandingkan diperbaiki
- [x] Peta coverage tidak menimpa header
- [x] Halaman Jadi Mitra: timeline zig-zag dengan progres scroll
- [x] Sidebar kartu untuk portal Provider & Admin
- [x] Halaman Masuk & Daftar terpisah, "Ingat saya", konfirmasi password, kode Login Google
- [x] Portal kerja Provider & Admin terpisah dari tampilan publik (sidebar, topbar, dashboard baru)
- [x] Banner sambutan portal memakai gambar dari folder `SuperAdmin/` & `Provider/`
- [x] Halaman Panduan Provider di portal (`/provider-dashboard/guide`): checklist dari data asli + alur pesanan
- [x] Loading spinner (tombol proses, peta coverage) & skeleton halaman portal Admin/Provider
- [x] Perpindahan web publik ↔ portal lebih halus: shell portal tampil instan (skeleton), animasi fade (View Transitions), progress bar navigasi, redirect login 307 lewat `proxy.ts`
- [x] Login langsung ke area sesuai peran (tanpa singgah di `/dashboard`)
- [x] Favicon & ikon aplikasi dari logo GMM; tombol banner Super Admin → Kelola Provider
- [x] Favicon tanpa latar (lencana bulat); uji responsif 47 halaman di lebar 320–768px: perbaikan overflow beranda, dashboard pelanggan & admin, Cara Kerja versi vertikal di HP, link Bandingkan di navigasi bawah
- [x] Beranda baru: hero foto layar penuh (zoom pelan), angka GMM dengan hitung naik (data asli), kartu kebutuhan bergambar besar, pita perbandingan parallax, CTA penutup foto penuh, animasi muncul saat scroll (menghormati mode kurangi animasi)
- [x] Hero foto penuh di Tentang Kami, Jadi Mitra & Cek Coverage; bar "cek lokasi" lengket di beranda; marquee nama provider; dukungan video hero (`public/videos/hero.mp4`)
- [x] Header: transparan di atas foto (beranda, Tentang, Mitra, Coverage) lalu putih saat scroll; bar atas dihapus (Promo & Bantuan ada di Lainnya); ID | IDR dan tombol Jadi Mitra pindah ke kanan
- [x] Staging siap dipasang di Vercel + Neon (panduan docs/10), indikator dev Next.js disembunyikan
