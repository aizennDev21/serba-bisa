# Laporan Tahap 12 — Alur Pemesanan Jasa

## Ringkasan

Penyewa dapat mengajukan permintaan pada jasa aktif, owner dapat menerima atau menolak, dan owner dapat menandai pekerjaan yang diterima sebagai selesai. Ulasan kini memerlukan pesanan selesai. Tahap ini tidak memproses pembayaran; chat tetap menjadi fitur terpisah yang dapat dimulai tanpa pesanan.

## Selesai

- [x] Menambahkan tabel `bookings` dengan snapshot nama jasa/harga, rincian permintaan, jadwal/lokasi opsional, status, dan indeks peserta.
- [x] Menambahkan audit perubahan status dengan pelaku, status sebelum/sesudah, waktu, dan alasan.
- [x] Menyediakan API daftar, pembuatan, dan transisi status pesanan dengan autentikasi, validasi role/peserta, serta pemeriksaan transisi di server.
- [x] Menerapkan transisi: permintaan → diterima/ditolak/dibatalkan; pesanan diterima → selesai/dibatalkan. Alasan penolakan dan pembatalan wajib.
- [x] Menambahkan form ajukan pesanan pada detail jasa dan halaman `/pesanan` untuk penyewa maupun owner.
- [x] Membatasi pembuatan ulasan sampai penyewa memiliki pesanan selesai untuk jasa terkait. Endpoint detail jasa juga menyampaikan kapabilitas ulasan yang sesuai.
- [x] Memperbarui PRD dan README mengenai alur, aturan pembatalan, prasyarat ulasan, serta batasan bahwa harga bukan pembayaran.
- [x] Membuat migrasi `0007_bumpy_beyonder.sql`.

## Belum dikerjakan

- [ ] Pembayaran, komisi, invoice, refund, mediasi sengketa, dan kebijakan transaksi formal.
- [ ] Konfirmasi penyelesaian oleh penyewa; pada tahap ini owner menandai pekerjaan sebagai selesai.
- [ ] Kalender ketersediaan dan pencegahan jadwal yang bertabrakan.
- [ ] Notifikasi realtime/email/push untuk pesanan baru atau perubahan status.
- [ ] Filter/paginasi riwayat lanjutan dan dashboard operasional/admin untuk pesanan.
- [ ] Chat tetap tidak terhubung ke ID pesanan dan tidak dibatasi oleh status pesanan.

## Validasi

- `bun run db:generate` — berhasil; migrasi `0007_bumpy_beyonder.sql` dibuat.
- `bun run db:migrate` — berhasil; migrasi diterapkan pada PostgreSQL lokal.
- `bun run check` — berhasil; Svelte 0 error/0 warning dan TypeScript backend lolos.
- `bun run --filter @serba-bisa/backend test` — 31 test lulus, 0 gagal.
- `bun run build` — build produksi frontend dan backend berhasil.
- Integrasi PostgreSQL/API — berhasil menguji pembuatan dan daftar pesanan, penerimaan dan penyelesaian oleh owner, penolakan ulasan sebelum selesai, serta pembuatan ulasan setelah selesai.
- Fixture integrasi dibersihkan; pemeriksaan database menunjukkan tidak ada akun atau jasa sementara yang tersisa.

## Cara mencoba

1. Terapkan migrasi dan jalankan frontend/backend sesuai langkah di README.
2. Masuk sebagai penyewa, buka jasa aktif, isi rincian permintaan, lalu ajukan pesanan.
3. Masuk sebagai owner jasa terkait dan buka **Pesanan saya** dari halaman akun.
4. Terima atau tolak permintaan; untuk pesanan yang diterima, owner dapat menandai pekerjaan selesai atau salah satu pihak dapat membatalkan dengan alasan.
5. Setelah pesanan selesai, penyewa dapat memberikan rating dan ulasan pada detail jasa.

## Tahap berikutnya yang disarankan

Tambahkan notifikasi untuk perubahan status pesanan dan kalender ketersediaan. Sebelum pembayaran online dibuat, tetapkan kebijakan komisi, pembatalan, refund, sengketa, dan tanggung jawab platform.
