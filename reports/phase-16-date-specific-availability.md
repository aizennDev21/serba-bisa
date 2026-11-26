# Laporan Tahap 16 — Pengecualian Ketersediaan per Tanggal

## Ringkasan

Owner kini dapat menutup tanggal tertentu atau mengganti jam ketersediaan mingguan untuk satu tanggal. Pengecualian berlaku bagi seluruh jasa owner, ditampilkan dalam pengelolaan jadwal, dan dipakai oleh endpoint slot serta validasi booking. Perubahan yang bertentangan dengan booking accepted ditolak.

## Keputusan implementasi

- Pengecualian memakai satu status (tersedia atau libur) dan paling banyak satu rentang jam untuk satu tanggal.
- Jadwal pengecualian menggantikan jadwal mingguan, bukan menambah rentang baru.
- Owner dapat mengatur tanggal hari ini hingga 365 hari ke depan dalam zona waktu WIB.
- Slot tetap berdurasi satu jam. Booking tanpa jadwal tetap didukung.

## Selesai

- [x] Menambahkan tabel `owner_availability_exceptions` dengan keunikan owner/tanggal dan batasan rentang slot satu jam.
- [x] Menambahkan migrasi `0010_majestic_spiral.sql`.
- [x] Menambahkan API owner untuk membaca, membuat/memperbarui, dan menghapus pengecualian tanggal.
- [x] Menambahkan validasi role owner, tanggal kalender WIB, batas 365 hari, waktu, autentikasi, serta pemeriksaan bentrok booking.
- [x] Menolak perubahan atau penghapusan pengecualian yang akan mengganggu booking accepted yang belum berlangsung.
- [x] Memperbarui pencarian slot, pembuatan booking, dan penerimaan booking agar menggunakan pengecualian sebelum jadwal mingguan.
- [x] Memperhitungkan pengecualian saat jadwal mingguan diubah, sehingga jadwal dasar tidak menghalangi booking yang dilindungi pengecualian.
- [x] Menambahkan UI owner untuk mengatur dan menghapus tanggal libur/jam khusus.
- [x] Menunjukkan pada detail jasa apabila jadwal khusus berlaku untuk tanggal terpilih.
- [x] Memperbarui README dan PRD.

## Belum dikerjakan

- [ ] Validasi interaksi formulir owner melalui browser dengan sesi owner; smoke test browser yang tersedia hanya mencakup halaman detail publik.
- [ ] Beberapa interval per tanggal, durasi booking variabel, tanggal pengecualian berulang, dan zona waktu selain WIB.
- [ ] Sinkronisasi kalender eksternal dan notifikasi perubahan jadwal kepada penyewa yang sudah memiliki permintaan.

## Validasi

- `bun --env-file=.env run --filter @serba-bisa/backend db:generate` — berhasil menghasilkan migrasi.
- `bun --env-file=.env run --filter @serba-bisa/backend db:migrate` — berhasil menerapkan migrasi ke PostgreSQL lokal.
- `bun run check` — berhasil; Svelte 0 error/0 warning dan pemeriksaan TypeScript backend berhasil.
- `bun run --filter @serba-bisa/backend test` — 39 test lulus, 0 gagal.
- `bun run build` — build produksi frontend dan backend berhasil.
- Integrasi PostgreSQL/API — berhasil menguji override jam, fallback ke jadwal mingguan, penolakan booking di luar override, booking pada jam override, pengecualian slot setelah booking diterima, penolakan perubahan yang bentrok, dan penghapusan pengecualian. Fixture sementara dibersihkan.
- Smoke test browser — halaman detail jasa publik berhasil dirender untuk tanggal terpilih.
- `git diff --check` — berhasil.

## Cara mencoba

1. Terapkan migrasi dan jalankan frontend/backend sesuai README.
2. Masuk sebagai owner lalu buka `/owner/ketersediaan`.
3. Pada bagian **Pengecualian tanggal**, pilih tanggal, lalu pilih **Libur** atau **Tersedia dengan jam khusus** dan atur rentang jam.
4. Buka detail jasa dan pilih tanggal tersebut. Daftar slot akan mengikuti pengecualian.
5. Hapus pengecualian untuk kembali ke jadwal mingguan. Pengubahan/penghapusan akan ditolak jika bertentangan dengan booking accepted yang belum berlangsung.

## Tahap berikutnya yang disarankan

Pertimbangkan beberapa rentang ketersediaan per hari dan durasi layanan per jasa. Sebelum menambahkannya, tentukan apakah slot berbagi kapasitas antar semua jasa owner atau setiap jasa memiliki kalender terpisah.
