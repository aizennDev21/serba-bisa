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

## Ulasan dan balasan

Pada detail jasa aktif, akun penyewa yang masuk dapat memberi satu rating dan komentar untuk setiap jasa setelah pesanan jasa terkait berstatus selesai. Owner jasa dapat mengirim satu balasan pada setiap ulasan yang dipublikasikan. Ulasan dan balasan ditampilkan sebagai fitur publik yang terpisah dari percakapan privat.

- `POST /api/reviews/services/:serviceId` — membuat ulasan (rating 1–5, komentar 3–2.000 karakter).
- `POST /api/reviews/:reviewId/reply` — owner jasa membalas ulasan (2–2.000 karakter).
- `GET /api/services/:id` — menyertakan ulasan terbaru beserta balasan owner dan kapabilitas aksi untuk sesi yang sedang masuk.

Backend memeriksa sesi, role, status jasa, pesanan selesai, dan kepemilikan. Owner tidak dapat mengulas jasanya sendiri; indeks unik di database menegakkan satu ulasan per penyewa/jasa dan satu balasan per ulasan. Ulasan belum dapat diedit dan moderasi ulasan belum tersedia.

## Pemesanan jasa

Penyewa dapat mengajukan permintaan dari detail jasa aktif dengan rincian kebutuhan serta jadwal dan lokasi opsional. Owner dapat menerima atau menolak permintaan, lalu menandai pekerjaan yang diterima sebagai selesai. Penyewa dapat membatalkan permintaan yang belum diterima; kedua pihak dapat membatalkan pesanan yang telah diterima dengan alasan. Perubahan status disimpan bersama audit pelaku, waktu, dan alasan. Owner dapat mengatur satu rentang ketersediaan per hari serta pengecualian untuk tanggal tertentu di `/owner/ketersediaan`; pilihan jadwal dan pemeriksaan bentrok menggunakan zona waktu WIB serta slot satu jam mulai pada pergantian jam.

- `POST /api/bookings` — membuat permintaan untuk jasa aktif; harga dan nama jasa disimpan sebagai snapshot.
- `GET /api/bookings` — menampilkan maksimal 100 pesanan milik penyewa atau owner yang sedang masuk.
- `GET /api/bookings/availability?serviceId=:id&date=YYYY-MM-DD` — menampilkan slot satu jam yang tersedia pada tanggal WIB tersebut, setelah mengecualikan waktu lampau dan jadwal yang sudah diterima.
- `PATCH /api/bookings/:bookingId/status` — mengubah status sesuai role, kepemilikan, dan transisi yang diizinkan.
- `/pesanan` — dashboard untuk melihat dan mengelola permintaan pesanan.
- `/owner/ketersediaan` — pengaturan jadwal mingguan dan pengecualian tanggal owner.
- `GET /api/owner/availability/exceptions` — daftar pengecualian mendatang milik owner.
- `PUT /api/owner/availability/exceptions` — membuat atau mengganti pengecualian tanggal; tanggal dibatasi hingga 365 hari ke depan.
- `DELETE /api/owner/availability/exceptions/:date` — menghapus pengecualian dan kembali ke jadwal mingguan jika tidak bertentangan dengan pesanan accepted.

Pada detail jasa, penyewa dapat memilih tanggal untuk melihat slot yang masih tersedia. Pengecualian tanggal owner dapat menutup satu hari atau mengganti rentang mingguan pada tanggal itu; perubahan yang bertentangan dengan pesanan accepted ditolak. Pengecualian dapat dibuat untuk hari ini hingga 365 hari ke depan. Owner hanya dapat menerima satu pesanan terjadwal per slot waktu, termasuk lintas jasa; indeks unik database juga melindungi dari permintaan accept serentak. Perubahan ketersediaan yang akan bertentangan dengan pesanan accepted masa depan ditolak. Permintaan tanpa waktu tetap didukung dan tidak menahan slot. Daftar slot bersifat informatif; server memvalidasi kembali saat pesanan dibuat dan diterima.

Alur ini tidak memproses pembayaran atau menetapkan tagihan. Harga snapshot adalah informasi dari listing; pembayaran online, refund, komisi, dan penyelesaian sengketa belum tersedia. Chat tetap terpisah dan tidak membutuhkan pesanan.

## Notifikasi pesanan

Penerima memperoleh notifikasi saat ada permintaan pesanan baru atau status pesanan berubah. Notifikasi disimpan sehingga tetap tersedia setelah pengguna offline, sementara SSE memberi sinyal realtime saat halaman `/notifikasi` terbuka.

- `GET /api/notifications` — membaca maksimal 100 notifikasi milik pengguna dan jumlah yang belum dibaca.
- `POST /api/notifications/:notificationId/read` — menandai notifikasi milik pengguna sebagai dibaca.
- `POST /api/notifications/read-all` — menandai seluruh notifikasi milik pengguna sebagai dibaca.
- `GET /api/notifications/events` — stream SSE terautentikasi, dibatasi ke origin frontend yang dikonfigurasi.
- `/notifikasi` — menampilkan notifikasi terbaru dan memperbarui daftar saat event realtime diterima.

SSE memakai memori proses dan hanya dipakai untuk memberi sinyal; database tetap sumber kebenaran. Untuk menjalankan beberapa backend, diperlukan broker/pub-sub bersama. Email/push, preferensi notifikasi, dan kebijakan retensi belum tersedia.

## Chat privat

Penyewa yang sudah masuk dapat memulai satu percakapan privat per jasa aktif dari halaman detail jasa. Owner dapat membuka inbox `/chat` untuk melihat percakapan dan membalas. Pesan teks disimpan di PostgreSQL; pesan baru dikirim melalui endpoint HTTP terautentikasi dan notifikasi realtime dikirim melalui Server-Sent Events (SSE). Konten pesan hanya diambil ulang melalui endpoint yang memeriksa peserta percakapan.

- `POST /api/chat/services/:serviceId/conversations` — memulai atau membuka kembali percakapan penyewa dengan owner jasa.
- `GET /api/chat` — inbox pengguna yang sedang masuk.
- `GET /api/chat/:conversationId` dan `GET /api/chat/:conversationId/messages` — detail dan 50 pesan terbaru, hanya untuk peserta.
- `POST /api/chat/:conversationId/messages` — mengirim pesan teks (maksimal 4.000 karakter).
- `GET /api/chat/:conversationId/events` — stream SSE untuk notifikasi `new_message`, hanya bagi peserta dan origin frontend yang dikonfigurasi.

Percakapan hanya antara penyewa dan owner yang terikat dengan jasa; data ulasan tidak pernah dipakai sebagai pesan. Notifikasi SSE hanya mengirim sinyal tanpa isi pesan sehingga klien mengambil isi melalui API yang memeriksa sesi dan akses peserta. Broker/pub/sub eksternal untuk menjalankan beberapa backend, status baca, lampiran, blokir/laporan pengguna, retensi/penghapusan pesan, dan rate limiting belum tersedia. Untuk produksi multi-instance, tambahkan pub/sub bersama serta kebijakan retensi dan mitigasi spam.

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

## Moderasi admin

Admin dan super admin dapat meninjau draft, menyetujui publikasi, menangguhkan listing, atau memulihkan listing dari `/admin/jasa`. Endpoint `/api/admin/services` memverifikasi role dari sesi di server. Alasan wajib dicatat bersama identitas moderator, status lama/baru, dan waktu dalam `moderation_audit_logs`.

Role admin tidak dapat didaftarkan dari UI publik. Untuk setup lokal, buat akun melalui `/akun`, lalu berikan role melalui koneksi PostgreSQL tepercaya, dengan mengganti email pada query berikut:

```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM users WHERE lower(email) = lower('admin-lokal@example.test')
ON CONFLICT DO NOTHING;
```

Jalankan hanya dari database development yang dapat dipercaya; jangan menyebarkan kredensial database. Pada produksi, pemberian role harus melalui proses operasional yang diaudit.

## Manajemen pengguna admin

Admin dan super admin dapat mencari akun, menonaktifkan, atau memulihkan akun dari `/admin/users`. Penonaktifan mencabut semua sesi aktif. Admin hanya melihat dan mengelola pengguna biasa; akun super admin tidak disertakan dalam daftar admin dan perubahan langsung terhadapnya ditolak server. Super admin dapat mengelola semua akun dan memberikan/mencabut role `admin`, namun role `super_admin` tidak dapat diubah dari dashboard.

Setiap tindakan memerlukan alasan 8–500 karakter dan dicatat di `user_admin_audit_logs`. Riwayat ditampilkan pada halaman untuk super admin. Sebagai bootstrap development awal, role super admin juga hanya boleh diberikan melalui koneksi PostgreSQL lokal yang dipercaya:

```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'super_admin' FROM users WHERE lower(email) = lower('super-lokal@example.test')
ON CONFLICT DO NOTHING;
```

Jangan gunakan query bootstrap ini di produksi tanpa proses change-control, autentikasi ulang, dan audit operasional yang disetujui.

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
