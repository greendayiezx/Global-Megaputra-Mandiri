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

## B. Fitur website yang belum dibangun

| #   | Item                                    | Keterangan                                                                                           | Prioritas |
| --- | --------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------- |
| B1  | **Lupa password / reset password**      | Butuh halaman reset + pengiriman email (butuh layanan email, mis. SMTP).                             | P1        |
| B2  | **Login dengan nomor telepon**          | Server saat ini hanya menerima email. Butuh keputusan: telepon + password, atau OTP SMS (biaya SMS). | P3        |
| B3  | **Daftar dengan Google** di form daftar | Tombol baru ada di halaman Masuk (login Google otomatis membuat akun baru).                          | P3        |
| B4  | **Verifikasi email**                    | Akun daftar manual belum diverifikasi lewat email (akun Google sudah otomatis terverifikasi).        | P2        |
| B5  | **Bahasa Inggris**                      | Menu bahasa menampilkan "English — Segera hadir".                                                    | P3        |
| B6  | **Pendaftaran mitra online**            | Formulir daftar provider + unggah dokumen (`/mitra` masih "segera dibuka").                          | P1        |
| B7  | **Pemesanan online**                    | Tombol pesan di detail paket masih "Pemesanan online segera dibuka" (lihat STEP 5).                  | P1        |
| B8  | **Ulasan & rating**                     | Filter Rating & urutan "Rating Terbaik" nonaktif sampai ada ulasan terverifikasi (Fase 2).           | P2        |
| B9  | **Teknologi 4G/5G**                     | Belum ada di pilihan teknologi; ditambahkan bila ada paket 4G/5G.                                    | P3        |
| B10 | **Blog / CMS**                          | Konten blog & FAQ masih statis di kode (Fase 2).                                                     | P3        |
| B11 | **Halaman Kontak**                      | `/contact` dengan formulir (rate-limited) belum dibuat.                                              | P2        |
| B13 | **Grafik & angka dashboard portal**     | Total pesanan/transaksi/pendapatan dan grafiknya tampil "—" sampai STEP 5–6.                         | P1        |
| B14 | **Notifikasi portal**                   | Lonceng notifikasi masih kosong (Fase 2).                                                            | P2        |

## C. Modul sistem (roadmap STEP)

| STEP / Fase | Modul                                                                             | Halaman yang masih "Modul ini belum aktif"                                  |
| ----------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| STEP 3      | Penyimpanan provider, paket & coverage di database; review/persetujuan oleh admin | Provider: Coverage · Admin: Provider (approve), Paket (approve), Pengaturan |
| STEP 5      | Pesanan (checkout, konfirmasi provider)                                           | Admin & Provider: Pesanan · angka dashboard "—"                             |
| STEP 6      | Pembayaran (payment gateway)                                                      | Admin: Pembayaran · Pelanggan: Pembayaran                                   |
| STEP 7      | Instalasi (jadwal teknisi)                                                        | Admin & Provider: Instalasi                                                 |
| STEP 8      | Portal pelanggan                                                                  | Pelanggan: Langganan                                                        |
| STEP 9      | Pelanggan & pengaturan provider                                                   | Provider: Pelanggan, Pengaturan                                             |
| STEP 11     | Bantuan / tiket                                                                   | Admin: Tiket · Pelanggan: Bantuan                                           |
| Fase 2      | Ulasan, notifikasi, promo, CMS                                                    | Pelanggan: Ulasan, Notifikasi                                               |
| Fase 3      | Leads, analitik, referral & komisi, tagihan berulang                              | Provider: Leads, Analitik · Pelanggan: Tagihan                              |

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

### E1. Rencana lingkungan Dev → Staging → Production (ditunda, menunggu keputusan hosting)

| Lingkungan     | Tempat                 | Database                | Data                      | Akses                                 |
| -------------- | ---------------------- | ----------------------- | ------------------------- | ------------------------------------- |
| **Dev**        | Laptop (`npm run dev`) | PGlite lokal (`.data/`) | Akun & paket demo         | Developer                             |
| **Staging**    | Server online          | PostgreSQL terpisah     | Data uji + data pra-rilis | Tim & mitra uji (password, `noindex`) |
| **Production** | Server online publik   | PostgreSQL + PostGIS    | Data asli                 | Publik                                |

- **Alur branch**: branch kerja → `staging` (deploy otomatis ke staging) → `main` (production).
- **Kredensial terpisah per lingkungan**: `APP_URL`, `RATE_LIMIT_SECRET`, `APP_ALLOWED_ORIGINS`,
  Google OAuth (redirect URI staging didaftarkan terpisah), payment gateway mode sandbox di staging.
- **Pekerjaan sebelum staging bisa jalan**:
  - [ ] PostgreSQL asli (PGlite tidak bisa di server; `DATABASE_URL` sudah didukung `src/db/client.ts`).
  - [ ] Penanda `APP_ENV=staging` agar data uji bisa di-seed (bootstrap demo & `db:seed` sengaja
        menolak jalan saat `NODE_ENV=production`).
  - [ ] Redis untuk rate limit (wajib bila multi-instance/serverless; opsional untuk staging 1 server).
  - [ ] `docker-compose` staging (Postgres + PostGIS) dan panduan deploy di `docs/`.
- **Pilihan hosting (belum diputuskan)**:
  - _VPS Indonesia + Docker_ (rekomendasi): paling mirip arsitektur akhir (PostGIS, Redis, MinIO).
  - _Vercel + Postgres terkelola (Neon/Supabase)_: paling cepat online; perlu Redis & storage
    dokumen eksternal lebih awal.

---

## Sudah selesai (sesi ini)

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
