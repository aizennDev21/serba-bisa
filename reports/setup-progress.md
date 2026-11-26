# Laporan Tahap Setup Projek

## Ringkasan

Fondasi awal monorepo Serba Bisa sudah dibuat. Tahap ini hanya menyiapkan struktur aplikasi, konfigurasi dasar, dan pemeriksaan kesehatan backend; fitur marketplace belum diimplementasikan.

## Selesai

- [x] Menyiapkan Bun workspaces pada root untuk aplikasi terpisah di `apps/`.
- [x] Membuat frontend SvelteKit minimal dengan TypeScript, Tailwind CSS, dan adapter Bun.
- [x] Membuat backend Bun + Elysia dengan endpoint `GET /api/health`.
- [x] Menambahkan konfigurasi Drizzle ORM untuk PostgreSQL dan koneksi `postgres`.
- [x] Membuat schema awal `users` dan `user_roles` agar satu akun dapat memiliki lebih dari satu role.
- [x] Memisahkan role kapabilitas `seeker`, `provider`, `admin`, dan `super_admin`; tamu tetap menjadi status pengguna tanpa autentikasi, bukan akun database.
- [x] Menambahkan contoh environment root, `.gitignore`, dan panduan setup lokal di `README.md`.
- [x] Menambahkan skrip root untuk menjalankan, memeriksa, membangun, dan memigrasikan aplikasi.
- [x] Menghasilkan migrasi PostgreSQL awal dari schema Drizzle.

## Belum dikerjakan

- [ ] Autentikasi, pendaftaran, sesi, pemulihan akun, serta alur pemberian role yang aman.
- [ ] UI produk: landing page final, katalog/pencarian, detail jasa, dashboard owner/admin/super admin.
- [ ] CRUD listing jasa, kategori, harga, status, foto, dan integrasi map/geocoding.
- [ ] Chat realtime, penyimpanan percakapan/pesan, reconnect, unread status, dan notifikasi.
- [ ] Rating, komentar, balasan, aturan kelayakan ulasan, pelaporan, dan moderasi.
- [ ] Otorisasi/permission backend untuk tiap role, termasuk pembatasan admin terhadap akun super admin.
- [ ] Audit log operasional, rate limiting, kebijakan privasi/retensi, dan pengujian keamanan.
- [ ] Inisialisasi pustaka komponen shadcn-svelte dan animasi yang kompatibel dengan Svelte.
- [ ] Menjalankan PostgreSQL lokal/produksi dan menerapkan migrasi awal; menambahkan data seed.
- [ ] Automated tests, CI, deployment, observability, backup, dan uji performa.

## Keputusan dan catatan

- Frontend menggunakan Svelte + TypeScript (komponen `.svelte`), bukan TSX. Library khusus React tidak dipasang.
- PostgreSQL dipilih sebagai database awal mengikuti rekomendasi PRD; `DATABASE_URL` diperlukan untuk perintah migrasi.
- Endpoint health hanya memeriksa bahwa proses API aktif, bukan kesiapan koneksi database.
- Schema `user_roles` mendukung pemisahan kapabilitas penyewa/owner dan role administratif. Guest tidak memerlukan record role.

## Validasi

Validasi berhasil: `bun run check`, `bun run build`, `bun run db:generate` (menggunakan URL contoh), dan permintaan `GET /api/health`. PostgreSQL belum dijalankan, sehingga migrasi belum diterapkan ke database.
