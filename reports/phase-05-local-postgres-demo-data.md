# Laporan Tahap 05 — PostgreSQL Lokal dan Data Demo

## Ringkasan

PostgreSQL lokal kini dapat dijalankan melalui Docker Compose pada port `5433`, dengan volume bernama agar data tetap tersimpan saat container dihentikan. Migrasi Drizzle sudah diterapkan dan katalog dapat diuji dengan enam listing serta tiga ulasan fiktif yang diberi label `DEMO`.

## Selesai

- [x] Menambahkan konfigurasi PostgreSQL 17 Alpine di `docker-compose.yml`, termasuk health check dan volume persisten.
- [x] Menambahkan `.env.example` untuk koneksi database, port lokal, origin frontend, alamat backend, dan pengaman seed.
- [x] Memilih port host `5433` agar tidak berbenturan dengan PostgreSQL lokal pada port `5432`.
- [x] Menambahkan perintah root untuk menjalankan, menghentikan, dan memeriksa database serta menjalankan/generasi migrasi.`
- [x] Memperbaiki skrip workspace agar `.env` root diteruskan ke frontend, backend, Drizzle, dan seed.
- [x] Menambahkan seed demo yang hanya berjalan dengan `SEED_DEMO_DATA=true`, menggunakan data fiktif berlabel demo, dan dapat dijalankan ulang tanpa menambah duplikasi.
- [x] Memperbarui README dengan langkah setup dan catatan agar kredensial contoh hanya dipakai untuk development.
- [x] Menjalankan migrasi pada PostgreSQL lokal dan mengisi 2 user demo, 6 listing aktif, serta 3 ulasan.
- [x] Menguji katalog API dan halaman frontend menggunakan database aktif; listing, rating, harga, lokasi, dan ulasan tampil.

## Belum dikerjakan

- [ ] Autentikasi dan otorisasi pengguna; akun demo bukan akun login.
- [ ] CRUD listing oleh owner dan alur moderasi/admin.
- [ ] Penulisan review dan balasan komentar dari UI/API.
- [ ] Chat privat real-time antara penyewa dan owner.
- [ ] Peta interaktif, koordinat publik, dan pencarian geospasial.
- [ ] Penggantian konten pratinjau di landing page dengan data katalog yang persisten.
- [ ] Penerapan database terkelola, kredensial aman, backup, dan kebijakan akses untuk staging/produksi.

## Validasi

- `bun run db:status` — container database sehat.
- `bun run db:migrate` — berhasil; menjalankan ulang tidak merusak data atau mengulang migrasi.
- `SEED_DEMO_DATA=true bun run db:seed` dua kali — berhasil dan idempotent; jumlah record tetap 2 user, 6 listing, dan 3 ulasan.
- Tanpa `SEED_DEMO_DATA=true`, seed menolak berjalan secara eksplisit.
- `GET /api/health`, daftar jasa, kategori, dan detail jasa — berhasil terhadap database aktif.
- Smoke test browser `/jasa?q=bersih&category=Rumah%20tangga` dan detail listing — data demo tampil, termasuk ulasan dan harga.
- `bun run check` — berhasil; 0 error dan 0 warning.
- `bun run test` — 5 test API lulus.
- `bun run build` — frontend dan backend berhasil dibangun.

## Cara menjalankan

```sh
bun install
cp .env.example .env
bun run db:up
bun run db:migrate
```

Untuk memasukkan data pratinjau secara eksplisit, atur `SEED_DEMO_DATA=true` pada `.env`, lalu jalankan `bun run db:seed`. Kembalikan ke `false` setelah selesai. Kredensial contoh pada `.env.example` hanya untuk development lokal dan tidak boleh digunakan di staging atau produksi.

Jalankan `bun run dev:backend` dan `bun run dev:frontend` pada terminal terpisah. `bun run db:stop` menghentikan container tanpa menghapus volume data.

## Tahap berikutnya yang disarankan

1. Implementasikan registrasi/login dan kontrol akses berbasis role.
2. Sediakan CRUD listing owner dengan validasi dan moderasi.
3. Implementasikan percakapan privat real-time setelah identitas dan otorisasi tersedia.
4. Tambahkan review dan balasan yang terikat pada transaksi/layanan, berikut moderasi.
