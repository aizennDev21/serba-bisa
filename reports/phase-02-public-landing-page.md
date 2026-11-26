# Laporan Tahap 02 — Landing Page Publik

## Ringkasan

Landing page publik Serba Bisa telah dibuat sebagai tahap pertama UI produk setelah setup monorepo. Fokusnya adalah pengalaman mobile-first untuk tamu: memahami layanan, menelusuri kategori, mencari contoh jasa, serta melihat rating dan ulasan.

## Selesai

- [x] Mengganti halaman scaffold SvelteKit dengan landing page berbahasa Indonesia.
- [x] Menambahkan header responsif dan navigasi mobile.
- [x] Membuat hero, input pencarian, pilihan lokasi tampilan, CTA, ilustrasi peta, dan ringkasan rating.
- [x] Menambahkan kategori jasa dan filter kategori yang bekerja pada data contoh.
- [x] Menambahkan pencarian client-side berdasarkan judul jasa, kategori, lokasi teks, dan nama penyedia.
- [x] Menampilkan kartu contoh jasa dengan harga/satuan, status, lokasi, penyedia, dan rating.
- [x] Menambahkan bagian cara kerja/kepercayaan, contoh ulasan publik, CTA untuk calon penyedia, dan footer.
- [x] Menambahkan metadata halaman, bahasa dokumen Indonesia, font Poppins dan DM Sans, palet biru-putih, serta responsivitas dan dukungan `prefers-reduced-motion`.
- [x] Memastikan status ketersediaan dan rating terlihat pada daftar jasa; konten contoh diberi penanda agar tidak dikira data produksi.

## Belum dikerjakan

- [ ] Menghubungkan pencarian, kategori, lokasi, kartu jasa, dan rating ke API/database.
- [ ] Membuat halaman katalog lengkap, halaman detail jasa, pagination, sorting, dan filter harga/lokasi nyata.
- [ ] Integrasi peta provider dan geocoding; pilihan lokasi pada hero saat ini masih tampilan statis.
- [ ] Autentikasi/registrasi; link masuk dan CTA belum terhubung ke alur akun.
- [ ] Chat realtime; ilustrasi/chat pada hero hanya elemen presentasi.
- [ ] Sistem listing owner, foto/portofolio, rating/komentar aktual, verifikasi penyedia, favorit, dan notifikasi.
- [ ] Mengimplementasikan halaman kebijakan privasi dan ketentuan layanan; tautan footer saat ini hanya placeholder navigasi.
- [ ] Menentukan penggunaan komponen shadcn-svelte; tampilan saat ini menggunakan markup Svelte dan CSS/Tailwind scaffold tanpa library komponen tambahan.
- [ ] Uji aksesibilitas manual/screen reader dan uji performa pada perangkat serta jaringan produksi.

## Data dan batas tahap

Kartu jasa, jumlah kategori, rating, statistik, dan testimoni pada halaman adalah data statis untuk pratinjau desain, bukan data pengguna atau listing nyata. Pencarian/filter hanya mengubah data lokal di browser dan tidak melakukan request ke backend. Tautan menuju detail/login belum mewakili halaman produk yang sudah tersedia.

## Validasi

- `bun run check` — berhasil, 0 error dan 0 warning Svelte.
- `bun run build` — berhasil untuk frontend SvelteKit dan backend Bun.
- Smoke test browser — judul/metadata tampil, pencarian `laptop` menghasilkan satu kartu yang sesuai, kata kunci tanpa hasil menampilkan empty state, dan filter kategori `Desain` hanya menampilkan jasa desain.
- Tampilan mobile — diperiksa pada lebar layout 390 CSS px; lebar dokumen tidak melampaui viewport. Elemen dekoratif dan deretan filter dapat meluas secara visual/scroll tanpa memaksa lebar halaman.

## Tahap berikutnya yang disarankan

1. Implementasikan auth dan API read-only listing dengan validasi dan kontrak tipe frontend/backend.
2. Buat halaman katalog/detail jasa yang mengambil data server-side dan mendukung lokasi/status/harga.
3. Bangun dashboard owner untuk CRUD listing sebelum menambahkan chat dan transaksi.

