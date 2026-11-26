# Laporan Tahap 07 — Pengelolaan Jasa Penyedia

## Ringkasan

Penyedia yang sudah login kini dapat mengelola listing melalui halaman `/owner/jasa`. Listing baru dibuat sebagai draft; owner dapat memperbarui detail, mengubah status publikasi, dan mengarsipkan listing. Backend memeriksa sesi, kapabilitas `provider`, dan kepemilikan jasa untuk setiap operasi.

## Selesai

- [x] Menambahkan API owner `GET/POST /api/owner/services`, `PATCH /api/owner/services/:id`, dan `DELETE /api/owner/services/:id`.
- [x] Mengharuskan sesi aktif dan role `provider`; akun tanpa sesi menerima 401 dan akun tanpa role yang sesuai menerima 403.
- [x] Membatasi daftar dan perubahan jasa dengan `owner_id` dari sesi terverifikasi; ID jasa milik akun lain tidak dapat dibaca/diubah lewat endpoint owner.
- [x] Menambahkan validasi nama, deskripsi, kategori, harga integer nonnegatif, satuan harga, lokasi teks, dan status.
- [x] Membuat listing baru dengan status `draft`, tanpa koordinat atau media dari input publik.
- [x] Menambahkan perubahan detail/status dan pengarsipan soft-delete agar relasi ulasan tetap dipertahankan.
- [x] Mencegah owner mengaktifkan kembali listing yang ditangguhkan; hanya admin/sistem yang dapat memulihkan status tersebut.
- [x] Membuat dashboard responsif `/owner/jasa` untuk membuat draft, melihat listing sendiri, mengedit, mempublikasikan, menandai tidak tersedia, dan mengarsipkan jasa.
- [x] Menautkan dashboard dari halaman akun dan memperbarui README.
- [x] Menjaga katalog publik tetap menampilkan jasa aktif saja.

## Belum dikerjakan

- [ ] Verifikasi identitas/kelayakan owner dan moderasi listing sebelum publikasi.
- [ ] UI/API admin untuk meninjau, menangguhkan, dan memulihkan listing.
- [ ] Upload gambar/media, koordinat lokasi, peta, dan pencarian geospasial.
- [ ] Pengelolaan variasi harga, jadwal, ketersediaan kalender, dan transaksi/pemesanan.
- [ ] Rate limiting, audit trail perubahan listing, serta pemberitahuan kepada owner/pelanggan.
- [ ] Perlindungan produksi untuk akun dan moderasi, termasuk verifikasi email, reset kata sandi, dan proses admin yang diaudit.

## Validasi

- `bun run check` — berhasil; Svelte 0 error/0 warning dan TypeScript backend lolos.
- `bun run test` — 12 test API lulus.
- `bun run build` — frontend dan backend berhasil dibangun.
- Integrasi terhadap PostgreSQL — berhasil menguji tanpa sesi (401), pembuatan draft, daftar milik owner, update menjadi aktif, visibilitas katalog, penolakan update lintas owner (404), pengarsipan dan hilangnya listing dari katalog.
- Integrasi tambahan — owner tidak dapat mengaktifkan ulang listing berstatus `suspended` (403).
- Smoke test browser — membuat akun sementara, membuka dashboard, membuat draft, mempublikasikan, mengarsipkan, dan keluar berhasil.
- Akses `/owner/jasa` tanpa sesi diarahkan ke `/akun`.
- Akun dan listing sementara dari pengujian telah dibersihkan; database kembali berisi data demo yang ada (2 user, 6 listing, 3 ulasan).

## Cara mencoba

1. Pastikan database, migrasi terbaru, backend, dan frontend aktif.
2. Daftar atau login di `http://localhost:5173/akun`.
3. Klik **Kelola jasa saya**, atau buka `http://localhost:5173/owner/jasa`.
4. Buat draft, lalu gunakan **Edit detail** untuk mengaktifkan listing agar terlihat di katalog.

## Tahap berikutnya yang disarankan

1. Buat dashboard dan alur moderasi admin untuk review listing sebelum/selama publikasi.
2. Tambahkan pembuatan komentar/ulasan dan balasan dengan otorisasi per akun.
3. Setelah kebijakan privasi dan percakapan disepakati, implementasikan chat privat realtime.
