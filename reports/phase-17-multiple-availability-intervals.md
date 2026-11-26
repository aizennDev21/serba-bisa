# Laporan Tahap 17 — Beberapa Rentang Ketersediaan

## Ringkasan

Owner dapat menetapkan beberapa rentang jam yang tidak saling tumpang tindih untuk setiap hari mingguan dan setiap pengecualian tanggal. Katalog detail menampilkan seluruh rentang mingguan, sedangkan pemilih slot, pembuatan booking, dan penerimaan booking menghormati jadwal yang sama.

## Keputusan implementasi

- Slot booking tetap berdurasi satu jam dan menggunakan WIB (`Asia/Jakarta`).
- Kapasitas tetap satu booking accepted per owner pada waktu yang sama lintas jasa, mengikuti batasan database yang sudah ada.
- Rentang yang bertumpang tindih ditolak; rentang yang bersebelahan diperbolehkan.
- Hari tanpa rentang dianggap libur. Pengecualian tanggal berstatus libur menyimpan penanda khusus dan menggantikan jadwal mingguan.
- Maksimal 24 rentang per hari/tanggal, sesuai jumlah maksimum rentang satu jam dalam satu hari.

## Selesai

- [x] Mengubah model jadwal mingguan menjadi beberapa baris rentang per owner dan hari.
- [x] Mengubah pengecualian tanggal agar mendukung beberapa rentang atau status libur.
- [x] Mengubah API baca/simpan jadwal owner dan validasi rentang agar menolak interval tidak valid atau tumpang tindih.
- [x] Menjaga validasi bentrok booking accepted ketika jadwal mingguan atau pengecualian diubah/dihapus.
- [x] Memperbarui endpoint slot publik, pembuatan booking, serta penerimaan booking agar memeriksa semua rentang.
- [x] Memperbarui informasi jadwal mingguan pada detail jasa.
- [x] Membuat kontrol UI tambah/hapus rentang pada jadwal mingguan dan pengecualian tanggal.
- [x] Membuat migrasi `0011_soft_dark_beast.sql`. Migrasi mempertahankan rentang mingguan yang tersedia dan membersihkan baris lama yang hanya menandai hari libur.
- [x] Memperbarui README dan FR-60/FR-67 pada PRD.

## Belum dikerjakan

- [ ] Durasi booking selain satu jam.
- [ ] Pengecualian berulang, beberapa zona waktu, dan sinkronisasi kalender eksternal.
- [ ] Uji interaksi UI owner menggunakan sesi browser terautentikasi; UI lolos pemeriksaan Svelte dan logika API diuji melalui integrasi.

## Validasi

- `bun --env-file=.env run --filter @serba-bisa/backend db:generate` — berhasil menghasilkan migrasi.
- `bun --env-file=.env run --filter @serba-bisa/backend db:migrate` — berhasil menerapkan migrasi ke PostgreSQL lokal.
- `bun run check` — berhasil; Svelte 0 error/0 warning dan TypeScript backend lolos.
- `bun run --filter @serba-bisa/backend test` — 39 test lulus, 0 gagal.
- `bun run build` — build produksi frontend dan backend berhasil.
- Integrasi PostgreSQL/API — berhasil menguji dua rentang mingguan dan tanggal, slot yang dihasilkan, penolakan tumpang tindih, booking pada rentang tersedia, penghilangan slot setelah booking diterima, dan penolakan perubahan jadwal yang berbenturan. Fixture sementara dibersihkan.
- Smoke test browser — halaman detail jasa publik berhasil dirender dan menampilkan jadwal kosong sebagai “Libur”.
- `git diff --check` — berhasil.

## Cara mencoba

1. Terapkan migrasi dan jalankan frontend/backend sesuai README.
2. Masuk sebagai owner lalu buka `/owner/ketersediaan`.
3. Tambahkan rentang jam untuk hari yang tersedia; hapus semua rentang untuk menandai hari libur.
4. Pada bagian pengecualian tanggal, pilih beberapa rentang jam atau pilih status libur.
5. Buka detail jasa untuk melihat jadwal dan gunakan pemilih tanggal untuk memeriksa slot.

## Tahap berikutnya yang disarankan

Tentukan apakah jasa perlu durasi booking yang dapat dikonfigurasi. Jika iya, tetapkan terlebih dahulu aturan kapasitas dan konflik durasi lintas jasa owner, karena slot satu jam saat ini menjadi dasar unik booking di database.
