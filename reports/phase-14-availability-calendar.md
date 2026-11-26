# Laporan Tahap 14 — Kalender Ketersediaan dan Bentrok Jadwal

## Ringkasan

Owner dapat mengatur satu rentang jam ketersediaan mingguan per hari melalui `/owner/ketersediaan`. Penyewa dapat melihat jadwal pada detail jasa dan meminta slot satu jam yang dimulai tepat pada pergantian jam WIB. Backend memvalidasi waktu, mengecek ketersediaan, dan mencegah dua pesanan accepted memakai slot owner yang sama, termasuk lintas listing.

## Keputusan implementasi

Klarifikasi durasi slot tidak tersedia, sehingga tahap ini memakai slot tetap satu jam. Jadwal dan waktu pilihan menggunakan zona waktu WIB (`Asia/Jakarta`); setiap hari mendukung satu rentang ketersediaan, atau ditandai libur.

## Selesai

- [x] Menambahkan tabel `owner_weekly_availability` dengan batasan hari, rentang menit, dan keunikan owner/hari.
- [x] Menambahkan indeks unik parsial database untuk satu booking berstatus accepted per owner dan waktu.
- [x] Menambahkan API owner untuk membaca dan memperbarui tujuh hari jadwal, dengan validasi sesi, role, rentang waktu, dan batasan bentrok dengan pesanan accepted di masa depan.
- [x] Membuat halaman pengaturan jadwal mingguan owner dan tautan dari halaman akun.
- [x] Menampilkan jadwal owner secara publik pada detail jasa.
- [x] Memvalidasi permintaan terjadwal: tanggal harus di masa depan, dimulai pada menit 00 WIB, masuk dalam jadwal, serta belum terisi pesanan accepted.
- [x] Memvalidasi kembali jadwal ketika owner menerima pesanan. Pembaruan jadwal dan perubahan status diserialisasi dengan row lock; indeks database menjadi perlindungan tambahan terhadap bentrok serentak.
- [x] Menolak perubahan jadwal yang menghapus waktu untuk booking accepted yang akan datang.
- [x] Memperbarui PRD dan README mengenai slot satu jam, zona waktu, batasan jadwal mingguan, dan alur tanpa waktu khusus.
- [x] Membuat migrasi `0009_fantastic_the_stranger.sql`.

## Belum dikerjakan

- [ ] Beberapa interval/jam istirahat dalam satu hari, tanggal libur khusus, pengecualian hari besar, dan durasi variabel per jasa.
- [ ] Pemetaan zona waktu lain selain WIB.
- [ ] Tampilan kalender bulanan dan pemilih slot yang hanya menampilkan waktu kosong; formulir saat ini menerima pilihan tanggal/jam lalu menampilkan kesalahan backend jika waktu tidak tersedia.
- [ ] Notifikasi saat jadwal owner berubah dan kalender eksternal.
- [ ] Pembayaran, refund, komisi, dan penyelesaian sengketa.

## Validasi

- `bun run db:generate` — berhasil; migrasi `0009_fantastic_the_stranger.sql` dibuat.
- `bun run db:migrate` — berhasil; migrasi diterapkan pada PostgreSQL lokal.
- `bun run check` — berhasil; Svelte 0 error/0 warning dan TypeScript backend lolos.
- `bun run --filter @serba-bisa/backend test` — 35 test lulus, 0 gagal.
- `bun run build` — build produksi frontend dan backend berhasil.
- Integrasi PostgreSQL/API — berhasil menguji simpan jadwal, jadwal publik, penolakan jam tidak penuh/di luar jadwal, bentrok pesanan lintas jasa, serta penolakan perubahan jadwal yang mengganggu pesanan accepted.
- Uji serentak — dua permintaan penerimaan slot owner/waktu yang sama menghasilkan tepat satu status diterima dan satu konflik.
- Fixture integrasi dibersihkan; tidak ada akun uji sementara yang tertinggal.
- Smoke test browser — halaman detail jasa menampilkan jadwal tujuh hari dalam WIB; akses fitur owner tanpa sesi diarahkan ke autentikasi.

## Cara mencoba

1. Terapkan migrasi dan jalankan frontend/backend sesuai README.
2. Masuk dengan akun penyedia jasa, buka **Atur jadwal ketersediaan** dari `/akun`, lalu aktifkan hari dan pilih rentang jam penuh.
3. Buka detail jasa untuk melihat jadwal publik.
4. Sebagai penyewa, ajukan pesanan tanpa jadwal atau pilih waktu mulai pada menit 00 WIB di dalam jadwal owner.
5. Owner hanya dapat menerima satu pesanan terjadwal untuk slot yang sama; pemesanan bentrok akan ditolak.

## Tahap berikutnya yang disarankan

Tambahkan kalender pemilih slot yang memuat slot satu jam yang masih kosong serta pengecualian tanggal khusus. Pertimbangkan durasi layanan yang dapat diatur per jasa sebelum memperluas mekanisme jadwal.
