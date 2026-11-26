# Laporan Tahap 04 — Katalog dan Detail Jasa Frontend

## Ringkasan

Frontend kini memiliki halaman katalog `/jasa` dan detail `/jasa/:id` yang membaca API Elysia melalui server-side load SvelteKit. Pencarian dari landing page, kategori, filter katalog, paginasi, dan navigasi ke detail telah disiapkan untuk data aktif dari backend.

## Selesai

- [x] Menambahkan tipe frontend untuk listing, pagination, detail, dan ulasan API.
- [x] Menambahkan konfigurasi server-side `BACKEND_URL` melalui mekanisme environment SvelteKit; default lokal `http://localhost:3001`.
- [x] Membuat halaman katalog publik `/jasa` dengan pencarian kata kunci, kategori, lokasi teks, dan pagination berbasis URL.
- [x] Mengambil listing dan kategori melalui API saat server merender halaman.
- [x] Menampilkan kartu dari data API berisi kategori, judul, deskripsi ringkas, lokasi, penyedia, rating/jumlah ulasan, dan harga/satuan.
- [x] Menambahkan empty state ketika query berhasil tetapi tidak ada hasil.
- [x] Menampilkan status error yang jelas ketika backend/database belum tersedia; tidak mengganti hasil dengan data demo.
- [x] Menjaga query pencarian/filter di URL dan pilihan kategori tetap terpilih meskipun API kategori belum tersedia.
- [x] Membuat detail `/jasa/:id` yang menampilkan deskripsi, harga, lokasi, penyedia, rating, dan ulasan publik melalui API.
- [x] Menangani ID tidak valid/tidak ditemukan sebagai 404 serta gangguan API sebagai pesan yang bisa dipahami pengguna.
- [x] Menghubungkan form pencarian landing, kategori, CTA katalog, dan navigasi footer ke halaman katalog.
- [x] Menambahkan layout responsif dan dokumentasi `BACKEND_URL` di README.

## Belum dikerjakan

- [ ] Mengonfigurasi role/credential database aplikasi, menerapkan migrasi, dan memasukkan data listing demo/produksi. Karena itu katalog saat ini menampilkan pesan unavailable yang eksplisit.
- [ ] Mengganti kartu dan testimoni contoh di landing page menjadi data API nyata; contoh landing tetap ditandai sebagai konten pratinjau.
- [ ] Membuat endpoint/API dan form autentikasi/registrasi; link masuk dan CTA akun belum menjadi alur akun aktif.
- [ ] Mengaktifkan chat privat; tombol pada detail masih menjelaskan bahwa chat membutuhkan akun/fitur lanjutan.
- [ ] Mengimplementasikan CRUD listing owner, tulis ulasan/balasan, dan workflow moderasi.
- [ ] Mengintegrasikan lokasi peta dan pencarian geospasial; filter lokasi saat ini menggunakan teks.
- [ ] Menguji isi listing/detail dan agregasi ulasan dengan PostgreSQL hidup serta dataset yang representatif.

## Validasi

- `bun run check` — berhasil, 0 error dan 0 warning.
- `bun run test` — 5 test API backend lulus.
- `bun run build` — frontend SvelteKit dan backend berhasil dibangun.
- Smoke test browser:
  - Pencarian landing mempertahankan `q=laptop` dan `location=Surabaya` saat menuju `/jasa`.
  - Filter kategori dari landing menuju `/jasa?category=Desain` dan tetap terpilih ketika backend mengembalikan unavailable.
  - Katalog menampilkan pesan database belum dikonfigurasi, tanpa menggunakan data tiruan.
  - Detail UUID valid menampilkan status unavailable yang jelas saat database belum dikonfigurasi.
  - ID bukan UUID menghasilkan halaman 404.

## Batasan operasional

PostgreSQL lokal merespons, tetapi role dan credential yang dapat dipakai aplikasi belum dikonfigurasi. Untuk menampilkan listing nyata, siapkan database, isi `DATABASE_URL`, jalankan `bun run db:migrate`, dan tambahkan akun owner dengan role `provider` beserta listing berstatus `active`. Tidak ada seed data otomatis pada tahap ini.

## Tahap berikutnya yang disarankan

1. Siapkan konfigurasi PostgreSQL dan seed data yang secara eksplisit diberi label demo.
2. Implementasikan auth dan CRUD listing untuk owner beserta otorisasi server.
3. Hubungkan landing ke data katalog dan tambahkan peta setelah kebijakan publik lokasi ditetapkan.

