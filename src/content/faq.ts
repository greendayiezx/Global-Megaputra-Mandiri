/** Static FAQ until the CMS module (Phase 2) manages it. */
export const FAQ = [
  {
    q: 'Apakah hasil "Tersedia" berarti internet pasti bisa dipasang?',
    a: 'Belum tentu. Hasil cek berasal dari data area layanan yang diberikan provider. Kondisi di lapangan (jarak ke perangkat jaringan, kapasitas, akses gedung) tetap dipastikan provider, kadang lewat survei teknis. Itu sebabnya provider mengonfirmasi pesanan Anda sebelum Anda membayar.',
  },
  {
    q: 'Kapan saya membayar?',
    a: 'Setelah provider mengonfirmasi bahwa lokasi Anda bisa dilayani. Anda tidak diminta membayar untuk pemasangan yang belum dipastikan.',
  },
  {
    q: 'Biaya apa saja yang harus saya bayar?',
    a: 'Semua biaya wajib (bulanan, instalasi, aktivasi, pajak, dan biaya lain bila ada) ditampilkan di halaman paket sebelum Anda memesan. Tidak ada biaya wajib yang baru muncul di langkah terakhir.',
  },
  {
    q: 'Apa arti "Verified Provider"?',
    a: 'Tim GMM telah memeriksa dokumen legal provider. Lencana hanya tampil setelah verifikasi benar-benar selesai, dan provider yang belum terverifikasi tidak tampil di marketplace.',
  },
  {
    q: 'Bagaimana GMM mengurutkan hasil "Rekomendasi"?',
    a: 'Berdasarkan kepastian ketersediaan di lokasi Anda, lalu prioritas daftar yang ditetapkan tim GMM, lalu harga bulanan terendah. Tidak ada skor tersembunyi. Jika suatu saat ada penempatan berbayar, akan diberi label "Sponsor".',
  },
  {
    q: 'Data apa yang GMM minta dari saya?',
    a: 'Hanya yang diperlukan untuk pemasangan: nama, nomor telepon, email, alamat, dan titik lokasi. KTP tidak diminta kecuali provider diwajibkan secara hukum, dan kami akan menjelaskan alasannya.',
  },
] as const;
