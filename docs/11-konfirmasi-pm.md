# 11 — Daftar Konfirmasi PM

Keputusan yang perlu dijawab PM/pemilik bisnis. Setiap baris sudah punya **perilaku default**
di sistem (aman dan bisa diubah), jadi pengembangan tidak berhenti; jawaban PM mengunci aturannya.
Urutan = prioritas.

## A. Memblokir pemesanan & pembayaran (STEP 5–6) — paling mendesak

| #   | Pertanyaan                                                                        | Default sekarang                                      | Rekomendasi                                                                                          |
| --- | --------------------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| D1  | Alur uang: pelanggan bayar ke GMM lalu diteruskan, atau provider menagih sendiri? | Belum ada pembayaran                                  | Mulai dari **provider menagih sendiri** (GMM sebagai lead/marketplace) — tanpa izin penampungan dana |
| D2  | Model pendapatan GMM: komisi per pelanggan aktif, biaya listing, atau langganan?  | Tidak ada                                             | Komisi per pelanggan yang aktif terpasang (selaras D1)                                               |
| D3  | PPN: harga yang tampil termasuk PPN atau belum; siapa yang memungut?              | Tiap paket menyatakan "termasuk/belum termasuk pajak" | Wajibkan harga tampil **termasuk PPN** agar perbandingan adil                                        |
| D4  | Bulan pertama dibayar di muka?                                                    | Tidak dihitung                                        | Ikuti kebijakan tiap provider, ditampilkan di detail paket                                           |
| D5  | Provider wajib konfirmasi lokasi sebelum pelanggan membayar?                      | Wajib untuk semua pesanan                             | Pertahankan (melindungi pelanggan dari pembayaran di area yang tidak terlayani)                      |

## B. Aturan katalog (STEP 3, sudah berjalan dengan default)

| #   | Pertanyaan                                                                                                                         | Default sekarang                                                                | Dampak bila diubah                                |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------- |
| K1  | Dokumen legal wajib untuk verifikasi provider (NIB, akta, NPWP, izin penyelenggara jasa internet dari Komdigi, rekening, KTP PIC)? | Profil wajib lengkap (nama badan usaha, NIB, alamat, PIC); dokumen dicek manual | Menentukan isi fitur unggah dokumen (B6)          |
| K2  | Siapa yang boleh menyetujui/menolak provider dan menerbitkan paket?                                                                | Super Admin & Admin; Customer Support hanya melihat                             | Pengaturan peran                                  |
| K3  | Paket yang sudah tampil lalu diubah harga/kecepatannya: turun dulu sampai direview, atau tetap tampil versi lama?                  | **Turun** sampai direview GMM (harga lama tersimpan di riwayat)                 | "Tetap tampil versi lama" butuh sistem versi draf |
| K4  | Perubahan area coverage oleh provider: langsung berlaku atau direview admin dulu?                                                  | **Langsung berlaku**, tercatat di audit log                                     | Bila perlu review, tambah antrean coverage        |
| K5  | Nama badan usaha & NIB terkunci setelah provider terverifikasi?                                                                    | Ya, perubahan lewat tim GMM                                                     | —                                                 |
| K6  | Berapa lama harga/area dianggap "perlu dicek ulang" (D13)?                                                                         | Tidak kedaluwarsa otomatis                                                      | Aktifkan penurunan status otomatis                |
| K7  | Urutan "Rekomendasi": boleh ada penempatan berbayar (D12)?                                                                         | Tidak; urutan = kepastian coverage → prioritas admin → harga termurah           | Wajib diberi label "Bersponsor" bila ya           |

## C. Biaya & layanan pihak ketiga

| #   | Pertanyaan                                                               | Pilihan                                                                                                   | Rekomendasi                                                         |
| --- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| L1  | Peta & pencarian alamat (geocoding) untuk poligon dan alamat → koordinat | Google Maps Platform (akurat, berbayar per pemakaian) · OpenStreetMap/Nominatim (gratis, batas pemakaian) | Mulai OpenStreetMap; pindah bila trafik besar                       |
| L2  | Layanan email (lupa password, notifikasi)                                | Resend / Amazon SES / SMTP hosting                                                                        | Resend atau SES (murah, mudah)                                      |
| L3  | Hosting production                                                       | Vercel Pro + Neon (cepat) · VPS + Docker (lebih murah, perlu perawatan)                                   | Vercel Pro + Neon sampai trafik stabil; Hobby tidak untuk komersial |
| L4  | Pelacak error                                                            | Sentry (ada paket gratis)                                                                                 | Sentry sebelum live                                                 |

## D. Legal & merek

| #   | Pertanyaan                                               | Dibutuhkan untuk                                |
| --- | -------------------------------------------------------- | ----------------------------------------------- |
| A6  | Data badan hukum GMM (nama PT, alamat, NPWP, kontak DPO) | Halaman Syarat Layanan & Kebijakan Privasi      |
| A5  | Izin pemakaian logo provider di foto banner dan kartu    | Tampilan beranda; tanpa izin, ganti foto netral |
| D9  | Masa simpan data pribadi (UU PDP)                        | Pembersihan data otomatis, audit log            |
| D6  | Kebijakan refund                                         | STEP 6                                          |

## Cara menjawab

Cukup tulis nomor dan jawabannya, mis. "K3: tetap tampil versi lama", "D1: provider menagih
sendiri". Default yang tidak dijawab tetap berlaku.
