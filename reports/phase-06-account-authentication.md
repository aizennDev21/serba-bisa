# Laporan Tahap 06 — Akun dan Autentikasi

## Ringkasan

Fondasi akun sudah tersedia melalui halaman `/akun` dan API Elysia untuk registrasi, login, membaca sesi, serta logout. Kredensial disimpan terpisah dari profil pengguna, kata sandi di-hash dengan Argon2id, dan sesi memakai token acak yang hanya disimpan sebagai hash di PostgreSQL.

Keputusan role mengikuti rekomendasi PRD: akun publik dapat sekaligus menyewa dan menawarkan jasa. Registrasi publik tidak menerima role admin atau super admin.

## Selesai

- [x] Menambahkan tabel `user_credentials` dan `auth_sessions` serta migrasi Drizzle `0002_married_tiger_shark.sql`.
- [x] Menambahkan validasi registrasi: email, nama tampilan, dan kata sandi 12–128 karakter.
- [x] Menormalisasi email menjadi huruf kecil sebelum menyimpan atau mencari akun.
- [x] Meng-hash kata sandi menggunakan Argon2id melalui `Bun.password`; kata sandi mentah tidak disimpan.
- [x] Menambahkan registrasi dan login dengan respons generik untuk kredensial salah serta konflik akun tanpa membocorkan detail akun.
- [x] Mengeluarkan cookie sesi `HttpOnly`, `SameSite=Lax`, berlaku 14 hari, serta `Secure` ketika backend berjalan dengan `NODE_ENV=production`.
- [x] Menyimpan hash token sesi di database dan memvalidasi status akun serta tanggal kedaluwarsa pada endpoint profil sesi.
- [x] Menambahkan logout yang mencabut sesi server dan menghapus cookie.
- [x] Membuat halaman responsif `/akun` untuk registrasi, login, tampilan profil/role, dan logout.
- [x] Mengarahkan CTA Masuk/Daftar dan tautan kontak katalog ke halaman akun.
- [x] Memperbarui README dan menerapkan migrasi pada PostgreSQL lokal.

## Belum dikerjakan

- [ ] Verifikasi email, pemulihan/reset kata sandi, dan perubahan kata sandi.
- [ ] Rate limiting, pembatasan percobaan login, deteksi penyalahgunaan, serta pembersihan berkala sesi kedaluwarsa.
- [ ] MFA, audit log perubahan role, dan alur tepercaya untuk mengangkat admin/super admin.
- [ ] Middleware/policy otorisasi per aksi untuk CRUD jasa, ulasan, moderasi, dan chat; fitur-fitur tersebut belum dibangun.
- [ ] Kebijakan CSRF dan deployment produksi yang mencakup domain cookie, proxy/TLS, secret management, observabilitas, dan pengujian keamanan.

> **Catatan kesiapan:** autentikasi ini untuk fondasi development/MVP dan belum siap dipakai sebagai sistem akun produksi sebelum kontrol keamanan yang belum dikerjakan ditambahkan.

## Validasi

- `bun run db:migrate` — berhasil menerapkan tabel kredensial dan sesi.
- `bun run check` — frontend 0 error/0 warning dan backend TypeScript lolos.
- `bun run test` — 9 test API lulus.
- `bun run build` — frontend dan backend berhasil dibangun.
- Integrasi terhadap PostgreSQL lokal — berhasil menguji registrasi, normalisasi email, role `seeker` + `provider`, lookup sesi, penolakan email duplikat (409), login, logout, dan penolakan sesi yang telah dicabut.
- Smoke test browser `/akun` — registrasi menampilkan profil/role, dan logout kembali ke formulir autentikasi.
- Akun sementara yang dipakai untuk smoke test browser telah dihapus setelah pengujian.

## Langkah mencoba secara lokal

Pastikan PostgreSQL aktif dan migrasi terbaru telah diterapkan:

```sh
bun run db:up
bun run db:migrate
bun run dev:backend
bun run dev:frontend
```

Buka `http://localhost:5173/akun`, lalu daftar dengan email unik dan kata sandi minimal 12 karakter. Akun baru memperoleh kapabilitas penyewa serta penyedia jasa; ini belum membuat listing atau mengaktifkan chat.

## Tahap berikutnya yang disarankan

1. Membuat CRUD listing owner dengan pemeriksaan sesi, kepemilikan, dan validasi server.
2. Menambahkan proses pengajuan/verifikasi owner serta moderasi listing.
3. Setelah otorisasi percakapan disiapkan, membangun chat privat real-time.
4. Menambahkan rate limiting dan siklus pemulihan akun sebelum mengaktifkan akun di lingkungan publik.
