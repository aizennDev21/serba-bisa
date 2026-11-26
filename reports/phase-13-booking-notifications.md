# Laporan Tahap 13 — Notifikasi Pesanan Realtime

## Ringkasan

Owner menerima notifikasi ketika ada permintaan pesanan baru, dan penyewa menerima notifikasi saat status pesanan berubah. Notifikasi tersimpan di PostgreSQL dan disampaikan realtime melalui SSE; daftar server tetap menjadi sumber kebenaran saat penerima kembali online.

## Selesai

- [x] Menambahkan tabel `notifications` dengan penerima, pesanan, tipe, judul, isi, waktu dibuat, dan waktu dibaca.
- [x] Membuat notifikasi dalam transaksi yang sama dengan permintaan atau perubahan status, sehingga keduanya tidak tersimpan secara terpisah.
- [x] Menambahkan API untuk mengambil hingga 100 notifikasi terbaru, menghitung jumlah belum dibaca, menandai satu notifikasi dibaca, dan menandai semua dibaca.
- [x] Membatasi daftar dan perubahan notifikasi hanya untuk penerima yang terautentikasi.
- [x] Menambahkan SSE untuk sinyal notifikasi realtime; event tidak menjadi sumber data utama dan daftar tetap dapat dimuat ulang dari database.
- [x] Membuat halaman `/notifikasi` dengan status realtime, daftar notifikasi, status baca, dan aksi tandai dibaca.
- [x] Menambahkan tautan ke notifikasi dari halaman akun dan pesanan.
- [x] Memperbarui PRD/README dan membuat migrasi `0008_good_dark_beast.sql`.

## Belum dikerjakan

- [ ] Kalender ketersediaan dan pencegahan benturan jadwal.
- [ ] Email/push, preferensi kanal, dan aturan retensi notifikasi.
- [ ] Broker/pub-sub bersama untuk SSE lintas beberapa instance backend; koneksi realtime saat ini memakai memori proses.
- [ ] Notifikasi untuk chat, ulasan, dan kegiatan moderasi; tahap ini hanya mencakup alur pesanan.

## Validasi

- `bun run db:generate` — berhasil; migrasi notifikasi dibuat.
- `bun run db:migrate` — berhasil; migrasi diterapkan pada PostgreSQL lokal.
- `bun run check` — berhasil; Svelte 0 error/0 warning dan TypeScript backend lolos.
- `bun run --filter @serba-bisa/backend test` — 33 test lulus, 0 gagal.
- `bun run build` — build produksi frontend dan backend berhasil.
- Integrasi PostgreSQL/API — berhasil memverifikasi notifikasi permintaan dan perubahan status tersimpan dan terkirim melalui SSE, status baca berubah, serta pengguna di luar penerima tidak dapat melihat atau menandainya.
- Data integrasi sementara dibersihkan; tidak ada akun fixture yang tertinggal.
- Smoke test akses tanpa login mengarahkan halaman notifikasi ke autentikasi.

## Cara mencoba

1. Pastikan migrasi telah diterapkan dan jalankan frontend/backend sesuai README.
2. Masuk sebagai owner dan buka `/notifikasi`.
3. Dari akun penyewa lain, ajukan pesanan jasa owner tersebut.
4. Halaman notifikasi owner memperbarui daftar saat event realtime diterima; notifikasi tetap tersedia setelah halaman dimuat ulang.
5. Ubah status pesanan sebagai salah satu pihak dan periksa notifikasi pada akun pihak lainnya.

## Tahap berikutnya yang disarankan

Tambahkan kalender ketersediaan owner serta validasi benturan jadwal pada server. Sebelum menambah pembayaran, putuskan kebijakan pembatalan, refund, komisi, sengketa, dan tanggung jawab platform.
