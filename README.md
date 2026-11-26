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

Sesuaikan `DATABASE_URL` pada `.env` dengan database PostgreSQL lokal Anda.
`BACKEND_URL` adalah alamat API Elysia yang dipakai oleh server-side load SvelteKit; untuk lokal default-nya `http://localhost:3001`.

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
