# Laporan Tahap 08 — Moderasi Jasa Admin

## Ringkasan

Admin dan super admin kini dapat meninjau listing melalui `/admin/jasa`, menyetujui draft, menangguhkan listing, serta memulihkannya ke status sebelumnya. Setiap keputusan mensyaratkan alasan dan dicatat dalam audit log bersama aktor serta perubahan status. Semua izin diperiksa ulang di backend berdasarkan sesi dan role.

## Selesai

- [x] Menambahkan kolom status sebelum penangguhan untuk menjaga status listing saat dipulihkan.
- [x] Menambahkan tabel `moderation_audit_logs` dan migrasi Drizzle `0003_minor_hedge_knight.sql`.
- [x] Menambahkan API daftar listing moderasi, tindakan moderasi, dan riwayat audit per listing.
- [x] Membatasi endpoint moderasi dan audit hanya untuk `admin`/`super_admin`; role diperiksa dari sesi di server.
- [x] Mendukung tindakan `approve` untuk draft, `suspend` untuk listing non-arsip, dan `restore` untuk listing suspended.
- [x] Mensyaratkan alasan moderasi 8–500 karakter dan mencatat moderator, waktu, alasan, status awal, dan status hasil dalam transaksi.
- [x] Mengembalikan konflik `409` untuk transisi status yang sudah usang/tidak sesuai; listing arsip tidak dapat dimoderasi.
- [x] Mencegah owner memulihkan listing suspended sendiri tetap ditegakkan oleh endpoint pengelolaan owner.
- [x] Membuat dashboard admin responsif, tautan dari halaman akun hanya muncul untuk role admin/super admin, dan memperbarui README.
- [x] Mendokumentasikan prosedur pemberian role lokal melalui koneksi PostgreSQL tepercaya; tidak ada pendaftaran role admin dari UI publik.

## Belum dikerjakan

- [ ] Dashboard admin untuk manajemen user; admin dan super admin belum memiliki alur daftar/ubah status akun.
- [ ] Pengangkatan admin oleh super admin, audit perubahan role, autentikasi ulang, dan pemisahan tugas.
- [ ] Tampilan riwayat audit di dalam dashboard (API audit sudah tersedia, UI audit terperinci belum ditambahkan).
- [ ] Moderasi ulasan/komentar, pelaporan konten, alasan banding, serta notifikasi kepada owner.
- [ ] Antrian review/publikasi wajib sebelum jasa owner dapat aktif; pada tahap ini owner masih dapat mempublikasikan listing sendiri, sementara admin dapat meninjau dan menangguhkan.
- [ ] Rate limiting, retensi audit, monitoring, serta pengujian keamanan/deployment produksi.

## Validasi

- `bun run db:generate` — menghasilkan migrasi audit dan status penangguhan.
- `bun run db:migrate` — berhasil diterapkan pada PostgreSQL lokal.
- `bun run check` — berhasil; Svelte 0 error/0 warning dan TypeScript backend lolos.
- `bun run test` — 15 test API lulus.
- `bun run build` — frontend dan backend berhasil dibangun.
- Integrasi PostgreSQL — provider ditolak (403), admin dapat melihat queue, menyetujui draft, menangguhkan, memulihkan ke status sebelumnya, dan membaca tiga audit record dengan identitas moderator yang benar.
- Smoke test browser — admin dapat membuka dashboard, mempublikasikan draft, menangguhkan, dan memulihkan listing.
- Akun, listing, dan audit record sementara untuk pengujian dibersihkan. Database kembali pada 2 user demo, 6 listing demo, 3 ulasan demo, tanpa akun/listing uji.

## Cara mencoba

1. Pastikan migrasi terbaru telah diterapkan dan server lokal berjalan.
2. Buat akun lokal lewat `/akun`.
3. Berikan role `admin` menggunakan query operasional lokal yang dicantumkan di bagian **Moderasi admin** pada README.
4. Login kembali, lalu buka `/admin/jasa` dari halaman akun.
5. Isi alasan sebelum menyetujui, menangguhkan, atau memulihkan listing.

Jangan memberikan role admin di produksi dengan query manual tanpa change control dan audit operasional.

## Tahap berikutnya yang disarankan

1. Membuat manajemen pengguna dengan aturan admin tidak dapat mengubah super admin dan super admin memiliki cakupan penuh.
2. Menambahkan halaman riwayat audit dan moderasi review/komentar.
3. Menentukan kebijakan verifikasi owner dan publikasi sebelum memperluas adopsi publik.
4. Setelah itu membangun review/balasan, kemudian chat privat realtime dengan kontrol akses percakapan.
