# Laporan Tahap 11 — Chat Privat Realtime

## Ringkasan

Penyewa yang sudah masuk dapat memulai percakapan privat dari halaman detail jasa aktif. Owner jasa dapat membalas melalui inbox `/chat`. Isi pesan tersimpan di PostgreSQL dan perubahan baru diberitahukan realtime melalui SSE; isi pesan hanya diambil dari endpoint yang memeriksa sesi dan keanggotaan percakapan.

## Selesai

- [x] Menambahkan tabel `conversations` dan `chat_messages`, indeks peserta/waktu, serta batas satu percakapan per penyewa dan jasa.
- [x] Menambahkan API untuk memulai atau membuka kembali percakapan, memuat inbox, melihat metadata/riwayat, mengirim pesan, dan menerima notifikasi SSE.
- [x] Memeriksa sesi aktif dan hak peserta di setiap endpoint. Peserta di luar percakapan menerima 404; origin SSE dibatasi ke frontend yang dikonfigurasi.
- [x] Membatasi pesan teks hingga 4.000 karakter; pesan disimpan sebelum notifikasi realtime dikirim.
- [x] Notifikasi SSE hanya membawa sinyal `new_message`, bukan isi pesan. Klien mengambil ulang pesan melalui API yang terotorisasi.
- [x] Membuat halaman inbox `/chat`, halaman percakapan responsif, status koneksi, formulir kirim pesan, dan tautan memulai chat pada detail jasa.
- [x] Menambahkan migrasi `0006_tearful_hellion.sql`, mengaktifkan CORS dengan kredensial untuk frontend yang dikonfigurasi, serta memperbarui README.

## Belum dikerjakan

- [ ] Integrasi pub/sub bersama untuk beberapa instance backend. Notifikasi saat ini memakai memori proses, sehingga produksi multi-instance memerlukan broker.
- [ ] Pesanan/transaksi sebagai prasyarat menghubungi owner; tahap ini mengizinkan penyewa menghubungi jasa aktif.
- [ ] Status baca/terkirim, pencarian dan paginasi riwayat yang dapat diakses melalui UI, lampiran, serta notifikasi push.
- [ ] Pemblokiran/pelaporan pengguna, moderasi, rate limiting, kebijakan retensi/penghapusan pesan, dan perlindungan spam sebelum penggunaan produksi.

## Validasi

- `bun run db:generate` dan `bun run db:migrate` — berhasil; migrasi chat diterapkan.
- `bun run check` — berhasil; Svelte menunjukkan 0 error dan 0 warning, TypeScript backend lolos.
- `bun run test` — 28 test backend lulus, 0 gagal.
- Integrasi PostgreSQL — memverifikasi percakapan yang sama dikembalikan saat dibuka berulang, peserta lain tidak dapat membaca pesan, owner menerima sinyal realtime SSE dan dapat mengambil pesan, serta origin tak terdaftar ditolak.
- Smoke test browser — akun mendaftar, memulai chat dari detail jasa, status SSE menjadi “Terhubung”, dan pesan tampil setelah dikirim.
- `bun run build` — build produksi frontend dan backend berhasil.
- Data pengujian dibersihkan. Kondisi akhir database: 2 user demo, 6 jasa, 3 ulasan demo, 0 balasan uji, 0 percakapan, 0 pesan, dan 0 sesi aktif uji.

## Cara mencoba

1. Pastikan migrasi telah diterapkan dan jalankan frontend serta backend sesuai README.
2. Masuk dengan akun penyewa, buka jasa aktif, lalu pilih **Chat dengan penyedia**.
3. Untuk membalas, masuk dengan akun owner jasa terkait dan buka **Pesan dan percakapan** melalui halaman akun.
4. Pesan teks disimpan di database; klien peserta lain menerima notifikasi realtime dan memuat pesan dari endpoint privat.

## Tahap berikutnya yang disarankan

Tambahkan alur pemesanan agar ulasan dan percakapan dapat dikaitkan dengan transaksi, kemudian lengkapi kebijakan retensi, pelaporan, rate limiting, dan pub/sub bersama sebelum menyiapkan deployment multi-instance/produksi.
