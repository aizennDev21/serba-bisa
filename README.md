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

Jalankan frontend dan backend pada terminal terpisah:

```sh
bun run dev:frontend
bun run dev:backend
```

Frontend tersedia pada alamat yang dicetak Vite (default `http://localhost:5173`); pemeriksaan backend tersedia di `http://localhost:3001/api/health`.

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
