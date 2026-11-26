# Laporan Tahap 10 — Ulasan dan Balasan

## Ringkasan

Halaman detail jasa kini mendukung rating dan komentar pelanggan, serta balasan publik yang dikirim owner jasa. Ulasan/balasan adalah fitur terpisah dari chat privat; seluruh izin penting divalidasi kembali oleh backend.

## Selesai

- [x] Menambahkan endpoint `POST /api/reviews/services/:serviceId` untuk ulasan rating 1–5 dan komentar 3–2.000 karakter.
- [x] Menambahkan endpoint `POST /api/reviews/:reviewId/reply` untuk balasan owner sepanjang 2–2.000 karakter.
- [x] Membatasi pembuatan ulasan kepada akun penyewa aktif pada jasa aktif; owner tidak dapat mengulas jasanya sendiri.
- [x] Membatasi balasan hanya kepada owner aktif dari jasa terkait dan ulasan yang dipublikasikan.
- [x] Menegakkan satu ulasan per akun/jasa dan satu balasan per ulasan dengan unique index PostgreSQL.
- [x] Menampilkan ulasan dan balasan terbaru pada halaman detail jasa, dengan formulir yang muncul sesuai sesi dan kewenangan akun.
- [x] Memperbarui katalog detail agar rating/count tetap mengikuti ulasan yang dipublikasikan dan menampilkan balasan tanpa menggandakan perhitungan rating.
- [x] Menerapkan migrasi Drizzle `0005_sloppy_magneto.sql` dan mendokumentasikan endpoint serta batas fitur di README.

## Belum dikerjakan

- [ ] Verifikasi bahwa pengulas benar-benar memiliki pesanan/transaksi selesai. Untuk tahap ini, akun penyewa yang masuk dapat memberi satu ulasan pada jasa aktif; hubungan transaksi belum tersedia.
- [ ] Edit/hapus ulasan atau balasan, moderasi admin, pelaporan konten, dan kebijakan banding.
- [ ] Notifikasi saat ada ulasan atau balasan baru, serta paginasi ulasan di halaman detail.
- [ ] Chat privat realtime, yang tetap menjadi fitur tersendiri dan belum termasuk tahap ini.

## Validasi

- `bun run db:generate` — menghasilkan migrasi review replies dan indeks unik.
- `bun run db:migrate` — berhasil diterapkan; pemeriksaan ulang menunjukkan tidak ada migrasi tertunda.
- `bun run check` — berhasil; Svelte menunjukkan 0 error dan 0 warning, TypeScript backend lolos.
- `bun run test` — 24 test lulus, 0 gagal.
- Integrasi PostgreSQL — memverifikasi kemampuan pengulas yang sah, pengulas tidak dapat mengulas jasa sendiri, ulasan duplikat ditolak, provider lain tidak dapat membalas, owner dapat membalas, balasan kedua ditolak, balasan tampil di detail publik, dan pengiriman tanpa sesi ditolak.
- Smoke test browser — pengguna mendaftar, memberi rating/ulasan, melihat rating agregat diperbarui, lalu owner mengirim balasan yang tampil pada ulasan terkait.
- `bun run build` — build produksi frontend dan backend berhasil.
- Data pengujian dibersihkan dan kepemilikan jasa demo dipulihkan. Verifikasi akhir: 2 user, 6 jasa, 3 ulasan demo, 0 balasan uji, dan 0 sesi aktif uji.

## Cara mencoba

1. Pastikan migrasi telah diterapkan dan jalankan frontend serta backend sesuai README.
2. Buka detail jasa yang berstatus aktif.
3. Masuk dengan akun penyewa untuk memberikan rating dan komentar. Satu akun hanya dapat mengulas jasa yang sama sekali.
4. Masuk dengan akun owner jasa untuk membalas ulasan yang dipublikasikan.

## Tahap berikutnya yang disarankan

Sebelum membuka ulasan lebih luas, tambahkan keterkaitan ulasan dengan pesanan selesai dan alur moderasi/pelaporan. Setelah kebijakan akses percakapan dan privasi ditentukan, lanjutkan ke chat privat realtime sebagai fitur yang berbeda dari kolom ulasan.
