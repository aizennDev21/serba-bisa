# Serba Bisa

Monorepo marketplace jasa dengan frontend SvelteKit + TypeScript dan backend Bun + Elysia.

## Prasyarat

- Bun 1.3 atau lebih baru
- PostgreSQL untuk menjalankan migrasi database

## Setup lokal

```sh
bun install
cp .env.example .env
```

`.env.example` menggunakan database development lokal dengan user/password khusus development. Jangan gunakan nilai tersebut di staging/produksi. `BACKEND_URL` adalah alamat API Elysia yang dipakai oleh server-side load SvelteKit; untuk lokal default-nya `http://localhost:3001`.
Skrip root untuk menjalankan frontend/backend, migrasi, dan seed memuat `.env` secara eksplisit; pastikan file tersebut dibuat sebelum menjalankan perintah-perintah itu.

Jalankan database dan terapkan migrasi:

```sh
bun run db:up
bun run db:status
bun run db:migrate
```

Port PostgreSQL lokal default adalah `5433`, agar tidak berbenturan dengan service PostgreSQL lain pada port standar. Konfigurasi dapat diubah lewat `.env`.

Untuk mengisi listing pratinjau secara eksplisit, ubah `SEED_DEMO_DATA=true` pada `.env`, lalu jalankan:

```sh
bun run db:seed
```

Seed berisi akun, listing, dan ulasan fiktif yang diberi label `DEMO`; script tidak berjalan tanpa opt-in tersebut. Setelah seed selesai, kembalikan `SEED_DEMO_DATA=false` jika tidak ingin menjalankan seed lagi.

Jalankan frontend dan backend pada terminal terpisah:

```sh
bun run dev:frontend
bun run dev:backend
```

Frontend tersedia pada alamat yang dicetak Vite (default `http://localhost:5173`); pemeriksaan backend tersedia di `http://localhost:3001/api/health`.

## API katalog jasa

Dengan PostgreSQL sudah disiapkan dan migrasi diterapkan, backend menyediakan endpoint publik:

- `GET /api/services?q=bersih&category=Rumah%20tangga&location=Jakarta&page=1&limit=12`
- `GET /api/services/categories`
- `GET /api/services/:id`

Daftar hanya memuat jasa dengan status `active` dan owner aktif. `limit` maksimum 50; daftar memberikan metadata paginasi, rating agregat, dan jumlah ulasan yang dipublikasikan. Detail mengembalikan maksimal 20 ulasan terbaru yang dipublikasikan. Listing yang tidak tersedia, ditangguhkan, diarsipkan, atau tidak dikenal menghasilkan 404 dari endpoint detail. Koordinat tersimpan di database, tetapi belum dibuka ke API publik sampai kebijakan presisi lokasi diputuskan.

Jika `DATABASE_URL` belum diatur, proses API tetap dapat menjalankan health check, tetapi endpoint katalog mengembalikan HTTP 503 secara eksplisit; API tidak menggunakan fallback data tiruan.

## Akun dan autentikasi

Halaman `/akun` menyediakan formulir pendaftaran, login, dan logout. Endpoint backend:

- `POST /api/auth/register` — membuat akun pengguna dengan kata sandi minimal 12 karakter.
- `POST /api/auth/login` — memverifikasi kredensial dan menerbitkan sesi.
- `GET /api/auth/me` — mengembalikan profil dan role untuk sesi aktif.
- `POST /api/auth/logout` — mencabut sesi aktif.

Kata sandi di-hash memakai Argon2id melalui `Bun.password`; token sesi acak disimpan sebagai hash di database dan dikirim melalui cookie `HttpOnly`, `SameSite=Lax`, dengan masa berlaku 14 hari. Cookie `Secure` aktif saat backend berjalan dengan `NODE_ENV=production`. Pengguna baru memperoleh kapabilitas `seeker` dan `provider`; role `admin`/`super_admin` tidak dapat dipilih melalui registrasi publik.

Fondasi ini belum mencakup verifikasi email, reset kata sandi, pembatasan percobaan login, MFA, audit perubahan role, atau pembersihan berkala sesi kedaluwarsa. Jangan gunakan alur akun untuk produksi sebelum kontrol-kontrol tersebut dan kebijakan operasional ditambahkan.

## Jasa milik penyedia

Setelah login, buka `/owner/jasa` untuk membuat draft, melihat listing milik akun, mengubah detail/status, atau mengarsipkan jasa. Endpoint `/api/owner/services` memerlukan sesi aktif dan kapabilitas `provider`; setiap perubahan dicocokkan dengan `owner_id` akun yang sedang login. Listing baru selalu berstatus `draft`; pemilik dapat mengaktifkannya dari dashboard, sementara status ditangguhkan hanya dapat ditetapkan sistem/admin.

Verifikasi identitas owner, moderasi sebelum publikasi, upload media, dan peta belum tersedia. Dashboard meminta lokasi teks saja dan tidak menerima koordinat dari input publik.

## Pemeriksaan dan build

```sh
bun run check
bun run build
```

## Database

Schema awal dan konfigurasi Drizzle berada di `apps/backend/src/db` dan `apps/backend/drizzle.config.ts`.
`DATABASE_URL` dari `.env` wajib disetel untuk menghasilkan atau menjalankan migrasi:

```sh
bun run db:generate
bun run db:migrate
```

`bun run db:stop` menghentikan container database tanpa menghapus volume. Data development tetap tersimpan pada volume Docker bernama; jangan menghapus volume jika masih dibutuhkan.
