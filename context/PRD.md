# Product Requirements Document (PRD)

## Serba Bisa — Platform Pencarian dan Pemesanan Jasa

| Informasi | Detail |
|---|---|
| Nama produk | Serba Bisa |
| Jenis produk | Marketplace jasa berbasis web |
| Platform | Website responsif, mobile-first |
| Status dokumen | Draft kebutuhan produk |
| Bahasa produk awal | Bahasa Indonesia |
| Target pengguna awal | Masyarakat Indonesia yang mencari atau menawarkan jasa |

> **Catatan jumlah role:** Permintaan menyebut “4 role”, tetapi merinci lima jenis pengguna. PRD ini menggunakan kelima role yang dirinci: tamu, penyewa jasa, owner/penyedia jasa, admin, dan super admin.

## 1. Ringkasan Produk

Serba Bisa adalah platform untuk menemukan, menawarkan, dan membicarakan kebutuhan jasa secara online. Pengunjung dapat menjelajahi daftar jasa dan melihat informasi publik termasuk ulasan dan rating. Setelah memiliki akun, penyewa jasa dapat berkomunikasi langsung dengan owner melalui chat privat realtime. Fitur chat merupakan kanal terpisah dari komentar dan balasan pada ulasan.

Platform menyediakan pencarian jasa dengan informasi harga, status ketersediaan, deskripsi detail, dan lokasi pada peta. Owner mengelola profil dan listing jasanya. Admin memoderasi konten dan mengelola pengguna selain super admin, sementara super admin memiliki kendali tertinggi atas seluruh pengguna, termasuk admin.

### 1.1 Visi

Menjadi tempat yang sederhana, tepercaya, dan cepat untuk menemukan atau menawarkan berbagai jasa, dengan komunikasi yang jelas antara calon pelanggan dan penyedia jasa.

### 1.2 Masalah yang ingin diselesaikan

- Calon pelanggan kesulitan menemukan penyedia jasa yang relevan, mengetahui harga dan lokasi, serta menilai reputasinya.
- Penyedia jasa membutuhkan cara mudah untuk menampilkan layanan dan menerima pertanyaan calon pelanggan.
- Komunikasi, ulasan publik, dan moderasi perlu dipisahkan agar pengalaman pengguna tertata dan aman.

### 1.3 Sasaran produk

- Memudahkan pengunjung menemukan jasa yang relevan dan memahami detailnya sebelum menghubungi owner.
- Memungkinkan penyewa jasa dan owner bertukar pesan secara privat dengan cepat di dalam website.
- Menampilkan reputasi jasa melalui rating dan komentar yang dapat ditanggapi.
- Memberikan alat pengelolaan listing, pengguna, dan moderasi yang sesuai dengan tingkat akses setiap role.
- Menyediakan pengalaman mobile-first yang ringan dan responsif.

### 1.4 Bukan sasaran MVP

- Menjamin kualitas, legalitas, atau keberhasilan setiap jasa yang ditawarkan.
- Menyediakan escrow, pembayaran online, pencairan dana, atau sistem komisi sebelum kebijakan bisnis ditetapkan.
- Menyediakan aplikasi native iOS/Android.
- Menggunakan komponen React di dalam aplikasi Svelte.

## 2. Pengguna dan Role

### 2.1 Tamu

Pengguna yang belum masuk atau belum membuat akun.

- Dapat melihat landing page, listing jasa yang dipublikasikan, detail jasa, lokasi, rating, dan komentar.
- Dapat mencari dan menyaring jasa.
- Tidak dapat membuat listing, mengirim chat, menulis ulasan, atau membalas komentar.
- Dapat diarahkan untuk mendaftar atau masuk saat mencoba fitur yang membutuhkan akun.

### 2.2 Penyewa jasa

Pengguna terdaftar yang mencari jasa.

- Dapat mengelola profil akun dasar.
- Dapat memulai percakapan privat dengan owner melalui chat realtime.
- Dapat mengirim pesan dan melihat riwayat percakapan yang menjadi hak aksesnya.
- Dapat memberikan rating dan komentar sesuai kebijakan kelayakan ulasan.
- Dapat membalas komentar pada ulasan yang diizinkan.
- Tidak dapat mengubah atau menghapus listing milik owner lain.

### 2.3 Owner / penyedia jasa

Pengguna terdaftar yang menawarkan jasa.

- Dapat membuat dan mengelola profil penyedia dan listing miliknya.
- Dapat menentukan nama jasa, deskripsi, harga, status ketersediaan, kategori, serta informasi lokasi.
- Dapat menerima dan membalas pesan privat dari calon pelanggan melalui chat realtime.
- Dapat menanggapi komentar/ulasan atas jasanya.
- Tidak dapat mengelola akun atau listing milik pengguna lain, kecuali menggunakan fitur pelaporan yang disediakan.

> Akun owner juga dapat menggunakan fungsi sebagai penyewa jasa. Model akun satu role aktif atau multi-role perlu ditentukan sebelum implementasi; rekomendasi MVP adalah satu akun dapat mengaktifkan kapabilitas penyewa dan owner secara bersamaan, dengan izin yang diperiksa per aksi.

### 2.4 Admin

Petugas operasional dan moderasi.

- Dapat melihat dan mengelola akun pengguna biasa (penyewa dan owner) sesuai kewenangan yang diberikan.
- Dapat meninjau listing, ulasan, komentar, dan laporan pengguna serta mengambil tindakan moderasi.
- Dapat menonaktifkan atau memulihkan akun pengguna biasa dengan alasan yang tercatat.
- **Tidak dapat melihat, mengubah, menonaktifkan, menghapus, atau mengambil alih akun super admin.**
- Tidak memperoleh akses ke isi chat privat secara default. Akses khusus untuk investigasi hanya boleh ada jika disetujui kebijakan privasi, memiliki alasan, dibatasi, dan tercatat dalam audit log.

### 2.5 Super admin

Role dengan kewenangan tertinggi untuk mengelola operasional platform.

- Dapat mengelola seluruh akun, termasuk admin dan super admin lain, sesuai kontrol keamanan tambahan.
- Dapat menetapkan atau mencabut role admin.
- Dapat mengatur konfigurasi platform dan kebijakan moderasi.
- Dapat melihat audit log dan melakukan tindakan administratif yang tidak tersedia bagi admin.
- Tindakan sensitif, terutama perubahan role super admin, harus memerlukan autentikasi ulang dan dicatat dalam audit log.

## 3. Ruang Lingkup dan Prioritas

### 3.1 MVP — wajib

1. Landing page dan katalog/list jasa publik.
2. Detail jasa berisi deskripsi, harga, status, lokasi/peta, profil owner, serta rating dan ulasan.
3. Registrasi, login, dan pengelolaan profil dasar untuk pengguna terdaftar.
4. Owner dapat membuat, mengubah, menerbitkan, menonaktifkan, dan menghapus listing miliknya.
5. Penyewa jasa dan owner dapat berkomunikasi melalui chat privat realtime yang terpisah dari ulasan.
6. Rating, komentar, balasan komentar, dan moderasi konten.
7. Dashboard admin untuk pengelolaan pengguna selain super admin serta moderasi.
8. Dashboard super admin untuk pengelolaan seluruh pengguna dan role.
9. Pencarian, filter dasar, dan informasi lokasi yang ditampilkan pada peta.
10. Tampilan responsif mobile-first, aksesibilitas dasar, dan optimasi performa.

### 3.2 Rekomendasi setelah MVP

Prioritas berikut adalah rekomendasi untuk validasi dan pengembangan bertahap, bukan komitmen scope MVP.

- **P0 setelah MVP:** pelaporan pengguna/listing/ulasan, verifikasi nomor telepon atau email, notifikasi pesan baru, status pesan terkirim/dibaca, dan dashboard metrik dasar.
- **P1:** notifikasi email/push, favorit, berbagi listing, serta foto/portofolio jasa.
- **P2:** pembayaran online, kebijakan pembatalan/refund, komisi platform, invoice, paket promosi, kupon, dan program loyalitas.
- **P3:** aplikasi PWA yang lebih lengkap, rekomendasi personal, dukungan multi-bahasa, verifikasi penyedia, dan sistem sengketa.

Fondasi booking pada tahap implementasi ini hanya mencatat permintaan dan status pekerjaan. Pembayaran, refund, komisi, penanganan sengketa, dan kewajiban kepatuhan transaksi tetap memerlukan keputusan produk tersendiri.

## 4. Alur Pengguna Utama

### 4.1 Menemukan jasa sebagai tamu

1. Tamu membuka landing page dan melihat jasa pilihan serta ringkasan rating publik.
2. Tamu melakukan pencarian atau memilih kategori/filter.
3. Tamu membuka detail listing dan memeriksa harga, status, deskripsi, lokasi, profil owner, rating, serta komentar.
4. Untuk menghubungi owner atau menggunakan fitur akun, tamu diminta masuk atau mendaftar.

### 4.2 Menghubungi owner

1. Penyewa jasa yang masuk membuka detail listing.
2. Penyewa memilih **Chat owner**.
3. Sistem membuat atau membuka percakapan privat yang terkait dengan listing dan kedua pengguna.
4. Kedua pihak mengirim dan menerima pesan tanpa memuat ulang halaman selama koneksi realtime tersedia.
5. Jika koneksi realtime terputus, antarmuka menunjukkan status koneksi dan mencoba menyambung kembali; riwayat pesan tetap dimuat dari server.

### 4.3 Membuat dan mengelola jasa

1. Owner melengkapi profil penyedia.
2. Owner membuat listing dengan judul, kategori, deskripsi, harga, status, dan lokasi.
3. Owner menyimpan draft atau menerbitkan listing.
4. Owner dapat memperbarui detail atau mengubah status listing menjadi tidak tersedia.
5. Listing yang ditangguhkan moderator tidak dapat diterbitkan ulang sampai masalah diselesaikan.

### 4.4 Memberi rating, komentar, dan balasan

1. Pengguna yang memenuhi aturan kelayakan membuka bagian ulasan pada listing.
2. Pengguna memberikan rating dan komentar.
3. Owner atau pengguna yang diizinkan membalas komentar melalui thread publik.
4. Sistem menampilkan ulasan dan balasan secara publik, dengan alat pelaporan/moderasi.
5. Ulasan tidak menjadi pesan privat dan tidak otomatis memulai percakapan chat.

### 4.5 Moderasi dan administrasi

1. Admin membuka antrean laporan/konten yang perlu ditinjau.
2. Admin meninjau konteks yang diperlukan dan memilih tindakan yang diizinkan.
3. Sistem mencatat aktor, waktu, objek, alasan, dan hasil tindakan administratif.
4. Jika objeknya akun super admin, admin ditolak oleh pemeriksaan otorisasi server.
5. Super admin dapat mengelola seluruh akun dan role dengan audit trail.

## 5. Kebutuhan Fungsional

### 5.1 Landing page dan katalog

- **FR-01:** Landing page menampilkan identitas Serba Bisa, kolom pencarian/CTA, kategori atau cara menjelajah, serta listing unggulan/rekomendasi.
- **FR-02:** Landing page menampilkan ringkasan rating dan review publik yang representatif. Konten tidak boleh mengesankan bahwa rating adalah jaminan kualitas.
- **FR-03:** Tamu dapat melihat katalog jasa yang berstatus publik/tersedia.
- **FR-04:** Pengguna dapat mencari berdasarkan kata kunci dan memfilter sekurangnya berdasarkan kategori, rentang harga, status ketersediaan, dan lokasi bila datanya tersedia.
- **FR-05:** Daftar hasil mendukung paginasi atau pemuatan bertahap, mempertahankan filter saat membuka detail dan kembali ke daftar.
- **FR-06:** Listing yang dihapus, ditangguhkan, atau belum dipublikasikan tidak tampil sebagai hasil publik.

### 5.2 Detail dan listing jasa

- **FR-07:** Setiap detail listing menampilkan judul, kategori, deskripsi, harga dan satuan harga, status, lokasi, profil owner, rating agregat, jumlah ulasan, dan daftar komentar/ulasan.
- **FR-08:** Format harga harus jelas (misalnya per jam, per kunjungan, mulai dari, atau harga tetap). Nilai harga dan satuannya wajib dikonfirmasi sebelum publikasi.
- **FR-09:** Status listing sekurangnya mencakup draft, aktif/tersedia, tidak tersedia, ditangguhkan, dan diarsipkan.
- **FR-10:** Owner dapat membuat dan mengelola hanya listing yang dimilikinya.
- **FR-11:** Owner dapat menyimpan draft, menerbitkan listing yang memenuhi validasi, mengubah detail, menandai tidak tersedia, dan mengarsipkan listing.
- **FR-12:** Sistem memvalidasi field wajib, panjang teks, format harga, dan data lokasi sebelum listing dipublikasikan.
- **FR-13:** Perubahan status listing ditampilkan konsisten pada katalog, detail, dan dashboard owner.

### 5.3 Akun dan role

- **FR-14:** Pengguna dapat mendaftar, masuk, keluar, dan mengelola informasi profil dasar.
- **FR-15:** Sistem menerapkan role dan izin pada server untuk setiap operasi terlindungi; menyembunyikan tombol di UI saja tidak cukup.
- **FR-16:** Admin dapat mencari dan mengelola akun penyewa/owner yang termasuk dalam kewenangannya.
- **FR-17:** Admin tidak dapat mengakses operasi manajemen terhadap akun super admin. Aturan ini wajib berlaku di backend, bukan hanya antarmuka.
- **FR-18:** Super admin dapat mengelola seluruh pengguna dan menetapkan/mencabut role admin.
- **FR-19:** Tindakan sensitif seperti penonaktifan akun atau perubahan role meminta alasan dan dicatat pada audit log.
- **FR-20:** Pengguna yang dinonaktifkan tidak dapat memulai sesi baru; sesi aktifnya dicabut sesuai kebijakan keamanan.

### 5.4 Chat realtime

- **FR-21:** Pengguna terdaftar dapat memulai chat privat dengan owner dari detail jasa.
- **FR-22:** Percakapan memiliki peserta dan konteks listing yang jelas; hanya peserta atau pihak yang berizin dapat mengaksesnya.
- **FR-23:** Pesan baru diterima secara realtime ketika koneksi aktif, tanpa perlu refresh halaman.
- **FR-24:** Riwayat percakapan tersimpan dan dapat dimuat kembali setelah pengguna membuka sesi baru.
- **FR-25:** UI menunjukkan pengiriman pesan, pesan gagal, status koneksi, dan mekanisme mencoba kembali tanpa menggandakan pesan.
- **FR-26:** Akses WebSocket divalidasi dengan identitas dan izin pengguna; klien tidak dapat bergabung ke room percakapan hanya dengan menebak ID.
- **FR-27:** Chat merupakan fitur privat terpisah dari komentar publik. Pesan chat tidak muncul pada halaman listing atau rating.
- **FR-28:** MVP mendukung pesan teks. Lampiran gambar/file dapat ditambahkan kemudian setelah batas tipe, ukuran, pemindaian, penyimpanan, dan retensi ditentukan.
- **FR-29:** Admin tidak dapat membaca isi percakapan sebagai fungsi operasional normal. Kebutuhan akses investigasi memerlukan kebijakan produk/privasi tersendiri, pembatasan, dan audit.

### 5.5 Rating, komentar, dan balasan

- **FR-30:** Pengguna yang masuk dan memenuhi aturan kelayakan dapat memberi rating numerik dan komentar pada jasa.
- **FR-31:** Rentang rating ditampilkan konsisten; rekomendasi MVP adalah 1–5 bintang.
- **FR-32:** Agregat rating dan jumlah ulasan diperbarui ketika ulasan dibuat, diubah, dihapus, atau dimoderasi.
- **FR-33:** Pengguna yang berizin dapat membalas komentar sebagai thread yang terlihat publik.
- **FR-34:** Balasan komentar bukan chat; tidak memiliki ekspektasi privasi atau realtime yang sama dengan pesan langsung.
- **FR-35:** Pengguna dapat melaporkan ulasan/balasan yang dianggap melanggar aturan. Pengguna tidak dapat mengubah ulasan milik orang lain.
- **FR-36:** Ulasan hanya dapat dibuat oleh penyewa setelah pesanan untuk jasa terkait berstatus selesai; satu ulasan tetap berlaku per penyewa/jasa.

### 5.6 Lokasi dan peta

- **FR-37:** Owner dapat mengatur lokasi jasa melalui alamat dan/atau koordinat.
- **FR-38:** Detail jasa menampilkan lokasi pada peta serta ringkasan alamat yang tersedia.
- **FR-39:** Hasil pencarian dapat difilter berdasarkan lokasi setelah pengguna memberikan lokasi atau memilih area secara eksplisit.
- **FR-40:** Sistem tidak meminta akses lokasi perangkat tanpa tindakan dan izin pengguna.
- **FR-41:** Kebijakan privasi dapat menyamarkan alamat rinci owner bila jasa diberikan di rumah/pribadi; kebutuhan bisnis harus menentukan presisi lokasi yang publik.
- **FR-42:** Penyedia peta/geocoding dipilih sebelum implementasi; integrasi harus mempertimbangkan biaya, batas pemakaian, ketersediaan, dan privasi.

### 5.7 Admin, super admin, dan moderasi

- **FR-43:** Admin memiliki dashboard untuk daftar pengguna non-super-admin, listing, ulasan/komentar, dan laporan.
- **FR-44:** Admin dapat menangguhkan konten atau akun sesuai izin yang ditetapkan, dengan alasan dan catatan tindakan.
- **FR-45:** Super admin memiliki dashboard terpisah atau kemampuan yang ditingkatkan untuk mengelola seluruh akun termasuk admin.
- **FR-46:** Perubahan role, status akun, dan keputusan moderasi dicatat dengan pelaku, waktu, objek, alasan, dan perubahan.
- **FR-47:** Operasi admin penting harus memiliki konfirmasi sebelum tindakan yang sulit dibatalkan.
- **FR-48:** Semua operasi administratif memeriksa role dan kepemilikan pada server serta menolak akses yang tidak sah.

### 5.8 Pemesanan jasa

- **FR-49:** Penyewa yang masuk dapat mengajukan permintaan pada jasa aktif, menyertakan rincian kebutuhan, serta jadwal dan lokasi yang diinginkan secara opsional.
- **FR-50:** Sistem menyimpan snapshot nama jasa dan harga saat permintaan dibuat; nilai tersebut merupakan informasi, bukan pembayaran atau tagihan.
- **FR-51:** Owner dapat menerima atau menolak permintaan. Penolakan dan pembatalan wajib menyertakan alasan.
- **FR-52:** Penyewa dapat membatalkan permintaan yang belum diterima; penyewa maupun owner dapat membatalkan pesanan yang telah diterima.
- **FR-53:** Owner dapat menandai pesanan diterima sebagai selesai. Pesanan yang selesai, ditolak, atau dibatalkan tidak dapat diaktifkan kembali.
- **FR-54:** Penyewa dan owner hanya dapat melihat serta mengubah pesanan yang melibatkan akun mereka; setiap perubahan status dicatat dengan pelaku dan waktu.
- **FR-55:** Chat tetap menjadi fitur privat terpisah dan dapat dimulai tanpa pesanan. Pembayaran online, refund, komisi, dan penyelesaian sengketa tidak termasuk alur ini.

### 5.9 Notifikasi

- **FR-56:** Sistem membuat notifikasi untuk owner ketika penyewa mengajukan pesanan, dan untuk pihak lain ketika status pesanan berubah.
- **FR-57:** Notifikasi disimpan secara persisten, hanya dapat dibaca/ditandai dibaca oleh penerimanya, serta memiliki status baca dan waktu pembuatan.
- **FR-58:** Notifikasi baru disampaikan realtime saat penerima terhubung; setelah reconnect, UI memuat daftar persisten dari server.
- **FR-59:** Pengguna dapat menandai satu notifikasi atau seluruh notifikasi sebagai sudah dibaca.

### 5.10 Ketersediaan dan jadwal pesanan

- **FR-60:** Owner dapat mengatur satu rentang ketersediaan mingguan per hari untuk seluruh jasa miliknya; hari dapat ditandai libur.
- **FR-61:** Jadwal menggunakan zona waktu WIB (Asia/Jakarta) dan slot booking tetap satu jam yang dimulai pada menit 00.
- **FR-62:** Penyewa dapat mengajukan jadwal opsional yang berada di dalam rentang ketersediaan owner; server memvalidasi waktu dan zona jadwal.
- **FR-63:** Owner hanya dapat menerima maksimal satu pesanan terjadwal pada slot yang sama, termasuk pesanan pada listing berbeda; batas ini juga dijaga database untuk menghadapi permintaan bersamaan.
- **FR-64:** Perubahan jadwal mingguan ditolak bila menghapus ketersediaan bagi pesanan masa depan yang sudah diterima.
- **FR-65:** Permintaan tanpa waktu tertentu tetap dapat diajukan dan ditinjau owner tanpa reservasi slot.
- **FR-66:** Sebelum mengajukan jadwal, penyewa dapat memilih tanggal dan melihat slot satu jam yang belum diterima untuk owner; server tetap memvalidasi ulang saat permintaan diajukan.

## 6. Kebutuhan Non-Fungsional

Target berikut adalah sasaran awal yang perlu divalidasi pada lingkungan staging/produksi, bukan klaim performa yang telah diukur.

### 6.1 Performa dan kecepatan

- **NFR-01:** Target Core Web Vitals untuk persentil ke-75 pengguna mobile: LCP ≤ 2,5 detik, INP ≤ 200 ms, CLS ≤ 0,1 pada halaman utama yang dioptimalkan.
- **NFR-02:** Target respons API p95 ≤ 300 ms untuk endpoint baca biasa pada beban awal yang disepakati, tidak termasuk layanan pihak ketiga.
- **NFR-03:** Target penerimaan pesan realtime p95 ≤ 1 detik ketika kedua klien online dan infrastruktur sehat.
- **NFR-04:** Halaman publik harus dapat dirender di server/prerender bila sesuai agar cepat dibuka dan dapat diindeks mesin pencari.
- **NFR-05:** Gunakan paginasi, query terindeks, pemuatan gambar responsif/lazy loading, caching yang aman, dan payload terukur.
- **NFR-06:** Tetapkan profil beban awal (jumlah pengguna bersamaan, throughput pesan, dan ukuran data) sebelum uji beban; jangan mengasumsikan kapasitas tanpa pengujian.

### 6.2 Keamanan dan privasi

- **NFR-07:** Terapkan prinsip least privilege, validasi input di server, pembatasan laju untuk login/chat/ulasan, dan perlindungan terhadap spam.
- **NFR-08:** Gunakan TLS untuk transportasi dan penyimpanan rahasia melalui environment/secret manager, bukan di repository.
- **NFR-09:** Password disimpan menggunakan algoritma hashing adaptif yang sesuai; sesi/token memiliki masa berlaku dan proses pencabutan yang jelas.
- **NFR-10:** Cegah akses horizontal ke percakapan, listing, dan data pengguna dengan pemeriksaan kepemilikan dan otorisasi pada setiap operasi.
- **NFR-11:** Minimalkan data pribadi yang dikumpulkan; sediakan kebijakan retensi dan proses permintaan penghapusan akun/data.
- **NFR-12:** Audit log tidak menyimpan password, token, atau isi chat yang tidak diperlukan.
- **NFR-13:** Terapkan proteksi XSS, CSRF sesuai model autentikasi, SQL injection melalui query parameterized/ORM, dan konfigurasi CORS yang ketat.

### 6.3 Reliabilitas, aksesibilitas, dan kompatibilitas

- **NFR-14:** Target ketersediaan awal 99,5% per bulan setelah operasional produksi siap; definisi pengecualian pemeliharaan harus ditetapkan.
- **NFR-15:** Kegagalan layanan realtime tidak boleh menghilangkan pesan yang sudah tersimpan; UI memberi status koneksi yang dapat dipahami.
- **NFR-16:** Antarmuka mendukung keyboard, fokus terlihat, label form, kontras yang memadai, dan semantik HTML.
- **NFR-17:** UI diuji pada viewport mobile umum, tablet, dan desktop serta browser modern yang disepakati.
- **NFR-18:** Log terstruktur, metrik, pemantauan error, backup, dan prosedur pemulihan disiapkan sebelum peluncuran publik.

## 7. Rancangan Arsitektur dan Teknologi

### 7.1 Prinsip arsitektur

- Pisahkan frontend dan backend sebagai aplikasi dalam satu monorepo.
- Gunakan TypeScript end-to-end dengan kontrak tipe/API bersama bila memungkinkan.
- Utamakan rendering cepat untuk halaman publik dan interaksi ringan untuk halaman aplikasi.
- Simpan pesan dan data utama secara persisten; gunakan kanal realtime untuk menyampaikan event, bukan sebagai satu-satunya sumber data.
- Otorisasi harus ditegakkan di backend dan diuji, bukan hanya melalui kontrol antarmuka.

### 7.2 Stack yang disarankan

| Area | Pilihan |
|---|---|
| Runtime/package manager | Bun |
| Frontend | SvelteKit + TypeScript |
| Backend API | ElysiaJS + TypeScript di Bun |
| ORM | Drizzle ORM |
| Database relasional | PostgreSQL (rekomendasi; perlu persetujuan produk/teknis) |
| Realtime | WebSocket melalui Elysia; Redis Pub/Sub/adapter dapat ditambahkan saat backend berjalan multi-instance |
| Styling | Tailwind CSS |
| Komponen | shadcn-svelte atau komponen Svelte yang mengikuti pola shadcn |
| Motion | Svelte transitions atau library animasi yang kompatibel Svelte |
| Font | Poppins untuk display/body utama, dengan fallback sans-serif sistem |
| Peta | Provider map/geocoding yang dipilih setelah evaluasi biaya dan privasi |
| Monorepo | Bun workspaces; orkestrasi tambahan hanya bila kebutuhan tim membutuhkannya |

**Kompatibilitas UI:** TSX, shadcn/ui React, React Bits, dan Framer Motion adalah pilihan ekosistem React. Karena keputusan produk adalah Svelte + TypeScript, jangan memasang library React tersebut sebagai dependensi runtime frontend. Gunakan shadcn-svelte untuk pola komponen, adaptasi desain dari React Bits sebagai referensi, dan Svelte transitions atau alternatif Svelte untuk animasi. Jika menggunakan library eksternal, verifikasi dukungan Svelte dan ukuran bundle sebelum adopsi.

**Catatan TypeScript:** Svelte memakai file `.svelte` dengan blok `<script lang="ts">`; TSX bukan format komponen normal Svelte. Tipe dan modul `.ts` tetap digunakan untuk logika bersama.

### 7.3 Struktur monorepo yang diusulkan

```text
serba-bisa/
├── apps/
│   ├── frontend/          # SvelteKit, UI, halaman publik dan dashboard
│   └── backend/           # Elysia API, autentikasi, WebSocket, domain
├── packages/
│   ├── shared/            # Tipe, schema validasi, konstanta, kontrak API
│   └── ui/                # Komponen Svelte bersama jika dibutuhkan
├── drizzle/               # Schema/migrasi database (atau dekat backend)
├── bun.lock
└── package.json           # Workspace scripts
```

Struktur final dapat disesuaikan dengan kebutuhan deployment, tetapi frontend dan backend harus tetap dapat dijalankan, diuji, serta dibangun secara terpisah.

### 7.4 Batas layanan

- **Frontend:** halaman landing/katalog/detail yang ramah SEO; autentikasi dan dashboard; formulir listing; chat; ulasan; panel admin.
- **Backend:** API, validasi, autentikasi, otorisasi role/kepemilikan, logika domain, penyimpanan pesan, WebSocket, dan integrasi map/notifikasi.
- **Database:** sumber kebenaran untuk pengguna, role, listing, ulasan, percakapan, pesan, moderasi, dan audit.
- **Paket shared:** tipe dan schema input/output yang aman dibagikan tanpa membocorkan implementasi atau rahasia backend.
- **Redis (opsional bertahap):** pub/sub untuk menyebarkan event realtime antar-instance, rate limit/cache terpilih. Jangan menambahkannya sebelum kebutuhan deployment membutuhkannya.

### 7.5 Entitas data inti (konseptual)

- `User`: identitas login, profil, status akun, dan waktu pembuatan/perubahan.
- `UserRole`: role/kapabilitas dengan aturan penetapan yang aman.
- `ProviderProfile`: informasi publik owner.
- `ServiceListing`: owner, judul, kategori, deskripsi, harga, satuan harga, status, koordinat/alamat publik.
- `Review`: penulis, listing, nilai rating, komentar, status moderasi, waktu.
- `ReviewReply`: balasan ke review/komentar, penulis, isi, status moderasi, waktu.
- `Conversation`: konteks listing dan peserta.
- `Message`: percakapan, pengirim, konten teks, waktu, serta status yang diperlukan.
- `ModerationReport`: pelapor, objek laporan, kategori, status penanganan.
- `AuditLog`: aktor, tindakan, objek, alasan, timestamp, dan metadata minimum.

Relasi, batas retensi, penghapusan/anonimisasi, indeks, serta aturan jumlah balasan perlu ditetapkan dalam desain teknis sebelum migrasi produksi.

### 7.6 Kontrak realtime tingkat tinggi

- Klien mengautentikasi koneksi WebSocket dan server memastikan keanggotaan percakapan sebelum subscribe.
- Event minimal: `message.created`, `conversation.updated`, dan `connection.status` (nama final mengikuti konvensi implementasi).
- Server menyimpan pesan dan melakukan deduplikasi/idempotensi sebelum mengirim event ke penerima.
- Riwayat pesan dimuat melalui API berhalaman; WebSocket hanya mengirim perubahan baru.
- Saat koneksi terputus, klien melakukan reconnect dengan backoff dan menyinkronkan pesan yang terlewat melalui API.
- Pengiriman ganda, urutan pesan, unread/read receipt, serta retensi pesan harus ditentukan dan diuji. Read receipt dan indikator mengetik direkomendasikan sebagai fitur lanjutan.

## 8. UX dan Arahan Visual

- Desain mobile-first dengan navigasi sederhana, CTA jelas, dan formulir yang nyaman digunakan dengan keyboard mobile.
- Palet utama biru dan putih dengan warna netral untuk teks/latar; pastikan kontras cukup dan jangan mengandalkan warna saja untuk status.
- Gunakan Poppins untuk karakter visual utama dan fallback sans-serif untuk ketersediaan/performa.
- Landing page terasa modern dan tepercaya: headline manfaat yang jelas, pencarian menonjol, kategori, jasa unggulan, ulasan publik, dan CTA bagi penyewa maupun owner.
- Detail jasa harus menempatkan harga, status, lokasi, rating, dan tombol chat pada area yang mudah ditemukan.
- Chat harus memperlihatkan identitas lawan bicara dan jasa terkait, status koneksi, serta pemisahan visual yang jelas dari ulasan.
- Gunakan animasi secara hemat; hormati `prefers-reduced-motion` dan hindari animasi yang menghambat interaksi.

## 9. Kriteria Penerimaan MVP

1. Tamu dapat membuka landing page dan melihat listing publik beserta rating/komentar tanpa login.
2. Tamu yang mencoba chat atau menulis ulasan diarahkan ke autentikasi dengan konteks listing tetap terjaga.
3. Owner dapat membuat listing dengan deskripsi, harga/satuan, status, dan lokasi; data yang tidak valid tidak dapat dipublikasikan.
4. Listing yang tersedia tampil pada katalog, dan listing nonaktif/ditangguhkan tidak tampil sebagai listing tersedia.
5. Dua pengguna yang berhak dapat bertukar pesan privat realtime; pengguna ketiga tidak dapat membaca atau mengirim pesan pada percakapan tersebut.
6. Riwayat pesan yang telah tersimpan dapat dimuat setelah refresh/reconnect; UI menampilkan kegagalan koneksi/pengiriman secara eksplisit.
7. Pengguna berhak dapat mengirim rating dan komentar; rating agregat serta jumlah ulasan diperbarui dengan benar.
8. Balasan pada komentar ditampilkan sebagai thread publik dan tidak masuk ke inbox chat.
9. Admin dapat mengelola pengguna biasa dan moderasi sesuai izin, tetapi setiap upaya mengelola akun super admin ditolak di backend.
10. Super admin dapat mengelola akun dan role admin; perubahan sensitif menghasilkan audit log.
11. Peta/lokasi ditampilkan tanpa meminta geolokasi perangkat sebelum pengguna memberi izin.
12. Halaman utama diuji di viewport mobile dan desktop, dapat digunakan dengan keyboard, dan metrik performa awal dicatat terhadap target NFR.
13. Pemohon pesanan dan pihak terkait menerima notifikasi persisten saat permintaan/status berubah; akses notifikasi dibatasi pada penerima.
14. Owner dapat mengatur jadwal mingguan; pesanan terjadwal hanya dapat dibuat dan diterima pada waktu tersedia dan slot accepted tidak dapat bentrok.
15. Daftar slot pada jasa tidak menampilkan waktu lampau atau slot yang sudah memiliki pesanan accepted; perubahan serentak tetap diputuskan oleh validasi server/database.

## 10. Metrik Keberhasilan

Metrik berikut perlu memiliki definisi event dan dashboard analitik sebelum dijadikan target bisnis:

- Rasio kunjungan landing page menjadi pencarian atau pembukaan detail jasa.
- Rasio detail jasa menjadi chat pertama.
- Waktu median sampai owner merespons pesan pertama.
- Persentase percakapan dengan setidaknya satu balasan dari owner.
- Jumlah listing aktif dan rasio listing dengan informasi wajib lengkap.
- Rasio listing yang menerima rating/ulasan, beserta distribusi rating.
- Waktu penanganan laporan dan jumlah laporan berulang.
- Core Web Vitals, error rate API, keberhasilan pengiriman pesan, dan reconnect rate.

Jangan menjadikan rating tinggi sebagai satu-satunya indikator kualitas; pantau jumlah ulasan, usia ulasan, dan laporan penyalahgunaan.

## 11. Risiko, Ketergantungan, dan Keputusan Terbuka

| Area | Risiko/keputusan | Tindakan yang disarankan |
|---|---|---|
| Role akun | “4 role” bertentangan dengan lima role yang dirinci | Gunakan lima role pada PRD; konfirmasi apakah owner juga otomatis dapat menyewa jasa |
| Ulasan | Tanpa booking, sulit membuktikan bahwa pemberi ulasan pernah memakai jasa | Tandai ulasan belum terverifikasi atau tambahkan alur booking sebelum label terverifikasi |
| Chat & privasi | Pengguna dapat mengirim spam atau konten berbahaya | Rate limit, blokir/lapor, kebijakan privasi, dan moderasi dengan akses minimum |
| Lokasi | Alamat rinci dapat mengungkap lokasi privat owner | Tetapkan presisi lokasi publik dan izin geolokasi secara eksplisit |
| Library UI | Sejumlah library yang disebut pengguna berorientasi React | Gunakan alternatif kompatibel Svelte; jangan mencampur runtime React tanpa alasan kuat |
| Realtime skala | WebSocket perlu fan-out jika backend multi-instance | Mulai sederhana; tambahkan Redis/pub-sub dan uji beban saat deployment memerlukan |
| Pembayaran | Belum ada aturan transaksi, pembatalan, komisi, atau refund | Jangan masukkan pembayaran ke MVP sebelum kebijakan bisnis ditetapkan |
| Database/deployment | Database, cloud, dan target beban belum dipilih | PostgreSQL adalah rekomendasi awal; validasi kebutuhan operasional dan biaya |
| Moderasi | Batas tindakan admin dan kebijakan penghapusan belum terdefinisi | Buat matriks izin, pedoman konten, dan proses banding sebelum peluncuran |

## 12. Definisi Selesai untuk MVP

MVP dapat dinyatakan siap dirilis setelah seluruh kriteria penerimaan wajib lulus uji, kontrol akses admin/super admin diuji negatif, alur chat dan pemulihan koneksi diverifikasi, migrasi serta backup database tersedia, halaman publik lolos pemeriksaan responsif dan aksesibilitas dasar, dan keputusan terbuka yang memblokir operasional (khususnya privasi lokasi, aturan ulasan, serta kebijakan moderasi) telah disetujui pemilik produk.
