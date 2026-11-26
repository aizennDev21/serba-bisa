# Laporan Tahap 03 — Model Data dan API Katalog Jasa

## Ringkasan

Backend sekarang memiliki schema PostgreSQL untuk listing jasa dan ulasan serta endpoint baca publik untuk katalog, kategori, dan detail. Tahap ini menyiapkan sumber data produk dan kontrak awal API sebelum halaman katalog frontend dihubungkan.

## Selesai

- [x] Menambahkan schema Drizzle `services` dengan owner, nama, deskripsi, kategori, harga/satuan, status, lokasi teks, dan koordinat opsional.
- [x] Menambahkan batasan database untuk harga non-negatif, pasangan koordinat, rentang latitude/longitude, dan rating 1–5.
- [x] Menambahkan schema `reviews` untuk rating dan komentar publik dengan status moderasi.
- [x] Menghasilkan migrasi PostgreSQL `0001_chunky_risque.sql`.
- [x] Menambahkan `GET /api/services` dengan pencarian teks, kategori, lokasi teks, pagination, rating agregat, dan jumlah ulasan publik.
- [x] Menambahkan `GET /api/services/categories` yang hanya memuat kategori dengan listing aktif dan owner aktif.
- [x] Menambahkan `GET /api/services/:id` dengan detail jasa dan maksimal 20 ulasan terbaru yang dipublikasikan.
- [x] Memastikan listing hanya tampil jika status listing aktif, akun owner aktif, dan owner memiliki role provider; listing nonaktif/tersembunyi tidak bocor melalui detail publik.
- [x] Validasi query pagination, panjang filter, dan format UUID dilakukan oleh Elysia; limit maksimal 50.
- [x] Tanpa `DATABASE_URL`, endpoint katalog mengembalikan 503 eksplisit tanpa data fallback palsu; health endpoint tetap berjalan.
- [x] Menambahkan dokumentasi endpoint pada README dan laporan tahap ini.

## Belum dikerjakan

- [ ] Mengatur kredensial PostgreSQL aplikasi, menerapkan migrasi, serta membuat data seed. PostgreSQL host merespons, tetapi akses role lokal yang tersedia tidak dikonfigurasi untuk aplikasi; migrasi belum dijalankan pada database.
- [ ] Menghubungkan frontend katalog/landing page ke endpoint API dan mengganti data statis setelah API tersedia.
- [ ] Membuat halaman detail jasa di frontend dengan navigasi nyata dari kartu listing.
- [ ] Membuat endpoint owner untuk CRUD listing beserta autentikasi dan otorisasi kepemilikan.
- [ ] Membuat API tulis ulasan/balasan, kelayakan pemberi ulasan, dan pelaporan moderasi.
- [ ] Menentukan kebijakan publik lokasi yang tepat; koordinat tidak disertakan dalam respons publik tahap ini.
- [ ] Menguji query katalog terhadap PostgreSQL hidup serta mengukur performa query di dataset representatif.

## Batasan dan keputusan

- Endpoint publik hanya membaca listing berstatus `active` milik pengguna berstatus `active`.
- Rating agregat hanya menghitung ulasan berstatus `published`; ulasan yang disembunyikan/dihapus tidak masuk agregat.
- API menyediakan pencarian lokasi berbasis teks, bukan geospatial search.
- Koordinat dapat disimpan untuk kebutuhan selanjutnya, tetapi tidak dikirim kepada klien publik sebelum kebijakan alamat pribadi disetujui.
- Tidak ada mock fallback pada API; database yang belum dikonfigurasi menghasilkan 503 agar kondisi infrastruktur tidak disamarkan.

## Validasi

- `bun run check` — berhasil untuk Svelte dan TypeScript backend, 0 error dan 0 warning.
- `bun run test` — 5 test API lulus: health tetap aktif tanpa database, ketidaktersediaan data/kategori dinyatakan 503, pagination invalid ditolak, dan ID non-UUID ditolak.
- `bun run db:generate` — berhasil membuat migrasi Drizzle dari schema terbaru menggunakan URL konfigurasi contoh.
- `bun run build` — berhasil membangun frontend dan backend.
- `GET /api/services` diuji tanpa database melalui test aplikasi: menghasilkan HTTP 503 dengan kode error eksplisit, tidak mengembalikan listing palsu.

Migrasi belum dijalankan pada PostgreSQL. Server PostgreSQL lokal merespons, namun role/credential untuk koneksi aplikasi tidak tersedia pada workspace ini.

## Tahap berikutnya yang disarankan

1. Konfigurasikan database PostgreSQL aplikasi dan seed data yang jelas ditandai sebagai data demo.
2. Hubungkan listing landing page dan buat halaman katalog/detail jasa yang membaca API.
3. Implementasikan auth dan CRUD listing owner dengan pemeriksaan role dan kepemilikan.
