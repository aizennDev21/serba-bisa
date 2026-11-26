# Laporan Tahap 15 — Pemilih Slot Booking Tersedia

## Ringkasan

Halaman detail jasa kini menyediakan pemilihan tanggal dan menampilkan slot satu jam yang tersedia pada tanggal tersebut. Daftar slot berasal dari pemeriksaan backend atas jadwal owner dan booking yang sudah diterima. Validasi ketersediaan tetap dilakukan kembali saat booking dibuat; tidak ada perubahan skema database pada tahap ini.

## Keputusan implementasi

- Slot tetap berdurasi satu jam dan menggunakan zona waktu WIB (`Asia/Jakarta`), konsisten dengan tahap 14.
- Pemilih tanggal menggunakan parameter URL `tanggal`; jika tidak diberikan, halaman memakai tanggal WIB hari ini.
- Booking tanpa waktu terjadwal tetap didukung.
- Ketersediaan tidak dijadikan jaminan booking: backend memeriksa ulang slot saat permintaan dibuat.

## Selesai

- [x] Menambahkan endpoint publik `GET /api/bookings/availability?serviceId=:id&date=YYYY-MM-DD` untuk mengambil slot yang tersedia.
- [x] Memeriksa jasa aktif, tanggal kalender WIB yang valid, jadwal owner, waktu yang sudah lewat, dan booking berstatus accepted.
- [x] Memuat slot berdasarkan tanggal yang dipilih pada halaman detail jasa.
- [x] Menambahkan kontrol tanggal dan daftar pilihan slot yang tersedia pada formulir booking.
- [x] Mempertahankan booking tanpa jadwal.
- [x] Menambah test validasi endpoint dan kondisi database tidak tersedia.
- [x] Memperbarui README dan PRD untuk mendokumentasikan fitur serta validasi server.
- [x] Tidak memerlukan migrasi database baru.

## Belum dikerjakan

- [ ] Interaksi pemilih slot melalui browser untuk pengguna yang sudah masuk belum diverifikasi pada smoke test tahap ini.
- [ ] Slot dengan durasi berbeda, beberapa rentang ketersediaan dalam sehari, tanggal libur khusus, dan zona waktu selain WIB.
- [ ] Pemesanan dan pembayaran online.

## Validasi

- `bun run check` — berhasil; Svelte 0 error/0 warning dan pemeriksaan TypeScript backend berhasil.
- `bun run --filter @serba-bisa/backend test` — 37 test lulus, 0 gagal.
- `bun run build` — build produksi frontend dan backend berhasil.
- Integrasi PostgreSQL/API — berhasil memastikan slot accepted tidak muncul, slot kosong muncul, dan tanggal tidak valid ditolak dengan HTTP 422. Fixture integrasi dibersihkan.
- Smoke test browser — halaman detail jasa berhasil dirender dengan query tanggal yang dipilih. Sesi browser yang tersedia adalah tamu, sehingga interaksi formulir booking yang memerlukan autentikasi tidak diuji.

## Cara mencoba

1. Jalankan backend dan frontend sesuai petunjuk di README.
2. Buka detail jasa yang memiliki jadwal ketersediaan.
3. Masuk sebagai penyewa, pilih tanggal pada pemilih tanggal, kemudian pilih salah satu slot tersedia.
4. Kirim permintaan booking. Backend akan memvalidasi ulang bahwa slot masih tersedia.

## Tahap berikutnya yang disarankan

Tambahkan pengecualian jadwal berdasarkan tanggal (misalnya libur atau perubahan jam khusus), serta evaluasi durasi booking yang dapat dikonfigurasi per jasa sebelum memperluas mekanisme pemesanan.
