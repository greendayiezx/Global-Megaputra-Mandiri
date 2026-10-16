# 10 — Staging di Vercel + Neon

Staging = salinan website GMM di internet dengan **data demo**, untuk investor, mitra, dan uji
coba dari HP sungguhan. Kode sudah siap; langkah di bawah dikerjakan sekali di dashboard (±30
menit). Kunci rahasia (password database, secret) **diisi sendiri di dashboard**, jangan dikirim
lewat chat atau di-commit ke git.

## Gambaran

| Bagian   | Layanan                     | Catatan                                                      |
| -------- | --------------------------- | ------------------------------------------------------------ |
| Website  | Vercel (region Singapura)   | Deploy otomatis setiap ada push ke branch staging            |
| Database | Neon PostgreSQL (Singapura) | Migrasi tabel otomatis saat build (`npm run vercel-build`)   |
| Data     | Demo                        | Provider/paket demo + 3 akun demo, kata sandi `GmmDemo#2026` |
| Akses    | Link + kata sandi opsional  | `STAGING_BASIC_AUTH`; tidak diindeks Google (`noindex`)      |

## 1. Buat database di Neon

1. Buka [neon.tech](https://neon.tech), masuk dengan akun GitHub.
2. **Create project** → nama `gmm-staging`, PostgreSQL 16, region **Asia Pacific (Singapore)**.
3. Di **Connection details**, salin dua connection string:
   - **Pooled** (host mengandung `-pooler`) → untuk `DATABASE_URL`
   - **Direct** (tanpa `-pooler`) → untuk `DATABASE_URL_UNPOOLED`

   Klik **Connect**, salin dengan **Copy snippet** (toggle **Connection pooling** ON lalu OFF).
   Parameter `channel_binding=require` di ujung alamat boleh dibiarkan; kode GMM membuangnya
   otomatis karena driver postgres-js tidak mendukungnya.

## 2. Buat project di Vercel

1. Buka [vercel.com](https://vercel.com), masuk dengan akun GitHub.
2. **Add New → Project** → pilih repository `Global-Megaputra-Mandiri` → **Import**.
3. Framework terdeteksi otomatis (Next.js). Build Command dibiarkan default: Vercel memakai
   skrip `vercel-build` (migrasi database lalu build).
4. Sebelum klik Deploy, buka **Environment Variables** dan isi tabel di langkah 3.
5. Setelah project dibuat: **Settings → Environments → Production → Branch Tracking** = `staging`,
   lalu **Save** (lihat "Alur perubahan" di bawah).
   Deploy pertama dari `main` boleh dilewati/gagal; push berikutnya ke branch itu membangun staging.
6. Integrasi opsional (Redis, dll.) dilewati.

## 3. Environment variables (Vercel → Settings → Environment Variables)

| Nama                                        | Nilai                                              | Wajib      |
| ------------------------------------------- | -------------------------------------------------- | ---------- |
| `APP_ENV`                                   | `staging`                                          | Ya         |
| `APP_SHOW_DEMO_DATA`                        | `true`                                             | Ya         |
| `DB_DRIVER`                                 | `postgres`                                         | Ya         |
| `DATABASE_URL`                              | connection string **Pooled** dari Neon             | Ya         |
| `DATABASE_URL_UNPOOLED`                     | connection string **Direct** dari Neon             | Ya         |
| `DATABASE_POOL_MAX`                         | `3`                                                | Ya         |
| `RATE_LIMIT_SECRET`                         | string acak ≥ 32 karakter (cara membuat di bawah)  | Ya         |
| `TRUST_PROXY`                               | `true`                                             | Ya         |
| `APP_URL`                                   | `https://<nama-project>.vercel.app`                | Ya         |
| `APP_ALLOWED_ORIGINS`                       | `<nama-project>.vercel.app`                        | Ya         |
| `STAGING_BASIC_AUTH`                        | `<nama>:<kata-sandi>` atau sandi saja (nama bebas) | Disarankan |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | kosongkan (tombol Google nonaktif)                 | Tidak      |

Membuat `RATE_LIMIT_SECRET` (jalankan di terminal VS Code, salin hasilnya):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`APP_ENV=staging` **dan** `APP_SHOW_DEMO_DATA=true` harus diisi keduanya: hanya dengan kombinasi
ini akun demo dibuat. Di production (tanpa keduanya) akun demo selalu ditolak.

## 4. Deploy dan cek

Klik **Deploy** (atau **Redeploy** setelah mengisi variabel). Setelah selesai, buka link
`https://<nama-project>.vercel.app` lalu cek:

- [ ] Browser meminta nama dan kata sandi (bila `STAGING_BASIC_AUTH` diisi)
- [ ] Beranda tampil lengkap dengan foto dan slide berganti
- [ ] Cek Coverage → lokasi contoh Kebayoran Baru → 2 provider tersedia
- [ ] Daftar Paket menampilkan 6 paket
- [ ] Masuk dengan `admin@demo.gmm.invalid` / `GmmDemo#2026` → Portal Admin
- [ ] Masuk dengan `provider@demo.gmm.invalid` → Portal Provider

## Alur perubahan: local dulu, baru staging

| Branch                       | Untuk                                    | Tampil di                                        |
| ---------------------------- | ---------------------------------------- | ------------------------------------------------ |
| `claude/gifted-knuth-s18uyp` | Pekerjaan harian (semua push ke sini)    | Laptop (Sync + `npm run dev`) dan link preview   |
| `staging`                    | Versi yang sudah disetujui untuk dilihat | `https://gmm-staging.vercel.app` (link investor) |

1. Perubahan di-push ke `claude/gifted-knuth-s18uyp`.
2. Di VS Code klik **Sync**, jalankan `npm install` bila ada paket baru, lalu `npm run dev` dan cek
   di `http://localhost:3000` (database lokal PGlite, aman untuk coba-coba). Vercel juga membuat link
   preview untuk tiap push (tab **Deployments**), berguna untuk cek dari HP.
3. Bila sudah sesuai: minta "naikkan ke staging". Branch `staging` disamakan dengan pekerjaan yang
   disetujui, lalu Vercel membangun ulang `gmm-staging.vercel.app`; migrasi database ikut berjalan.

Production Branch di Vercel (**Settings → Environments → Production → Branch Tracking**) = `staging`.
Link investor hanya berubah lewat langkah 3, jadi tidak ada perubahan setengah jadi saat demo.

## Yang perlu diingat

- Staging hanya untuk **data demo**. Jangan memasukkan data pelanggan atau dokumen asli.
- Kata sandi akun demo tertulis di halaman Masuk staging: siapa pun yang membuka link bisa masuk
  sebagai admin demo. Karena itu `STAGING_BASIC_AUTH` disarankan, dan link hanya dibagikan ke orang
  yang dituju.
- Foto di `public/images` tetap bisa dibuka tanpa kata sandi (dibutuhkan pengoptimal gambar);
  isinya hanya foto pemasaran.
- Batas percobaan login tersimpan di memori tiap server Vercel (belum Redis), cukup untuk staging.
- Menghapus staging: Vercel → project → Settings → Delete Project; Neon → project → Delete.

## Ringkasan perubahan kode untuk staging

- `src/lib/app-env.ts`: penanda staging (dua syarat) untuk akun demo dan petunjuk login.
- `src/db/client.ts`: koneksi pooler Neon tanpa prepared statement, ukuran pool dari env.
- `src/db/scripts/migrate.ts`: migrasi lewat koneksi direct; skrip `vercel-build`.
- `src/proxy.ts`: gerbang kata sandi opsional (`STAGING_BASIC_AUTH`).
- `next.config.ts`: header `X-Robots-Tag: noindex` di staging.
- `vercel.json`: region server Singapura.
