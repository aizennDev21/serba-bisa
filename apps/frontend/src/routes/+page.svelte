<script lang="ts">
	type Service = {
		title: string;
		category: string;
		location: string;
		price: string;
		priceUnit: string;
		rating: string;
		reviews: number;
		provider: string;
		initials: string;
		theme: string;
		icon: string;
	};

	const categories = ['Semua', 'Rumah tangga', 'Desain', 'Teknologi', 'Kecantikan', 'Pendidikan'];

	const services: Service[] = [
		{
			title: 'Rumah bersih, hati tenang',
			category: 'Rumah tangga',
			location: 'Jakarta Selatan',
			price: 'Rp75.000',
			priceUnit: '/ jam',
			rating: '4.9',
			reviews: 128,
			provider: 'Nadia Putri',
			initials: 'NP',
			theme: 'cleaning',
			icon: '✦'
		},
		{
			title: 'Desain yang bikin beda',
			category: 'Desain',
			location: 'Bandung · Online',
			price: 'Rp250.000',
			priceUnit: '/ proyek',
			rating: '5.0',
			reviews: 86,
			provider: 'Raka Studio',
			initials: 'RS',
			theme: 'design',
			icon: '◒'
		},
		{
			title: 'Laptop kembali ngebut',
			category: 'Teknologi',
			location: 'Surabaya',
			price: 'Rp100.000',
			priceUnit: '/ kunjungan',
			rating: '4.8',
			reviews: 54,
			provider: 'Dimas Pratama',
			initials: 'DP',
			theme: 'tech',
			icon: '⌘'
		},
		{
			title: 'Ruang nyaman, tanaman sehat',
			category: 'Rumah tangga',
			location: 'Yogyakarta',
			price: 'Rp60.000',
			priceUnit: '/ jam',
			rating: '4.9',
			reviews: 42,
			provider: 'Kebun Kecil',
			initials: 'KK',
			theme: 'garden',
			icon: '❋'
		},
		{
			title: 'Belajar bahasa Inggris santai',
			category: 'Pendidikan',
			location: 'Online',
			price: 'Rp90.000',
			priceUnit: '/ sesi',
			rating: '5.0',
			reviews: 67,
			provider: 'Alya Rahman',
			initials: 'AR',
			theme: 'learning',
			icon: 'Aa'
		},
		{
			title: 'Makeup untuk hari spesial',
			category: 'Kecantikan',
			location: 'Jakarta Barat',
			price: 'Rp350.000',
			priceUnit: '/ sesi',
			rating: '4.9',
			reviews: 103,
			provider: 'Mila Beauty',
			initials: 'MB',
			theme: 'beauty',
			icon: '✳'
		}
	];

	let query = $state('');
	let activeCategory = $state('Semua');
	let visibleServices = $derived(
		services.filter((service) => {
			const matchesCategory = activeCategory === 'Semua' || service.category === activeCategory;
			const searchText = `${service.title} ${service.category} ${service.location} ${service.provider}`;
			return matchesCategory && searchText.toLowerCase().includes(query.trim().toLowerCase());
		})
	);

</script>

<svelte:head>
	<title>Serba Bisa — Cari jasa, beres urusan</title>
	<meta
		name="description"
		content="Temukan jasa tepercaya di sekitarmu. Bandingkan layanan, baca ulasan, dan ngobrol langsung dengan penyedia jasa."
	/>
	<meta name="theme-color" content="#f7faff" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Poppins:wght@400;500;600;700;800&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="site-shell">
	<header class="site-header">
		<div class="container header-inner">
			<a class="brand" href="/" aria-label="Serba Bisa, beranda">
				<span class="brand-mark" aria-hidden="true">
					<svg viewBox="0 0 40 40" fill="none">
						<rect width="40" height="40" rx="13" fill="currentColor" />
						<path
							d="M12 14.5h16M12 20h11M12 25.5h8"
							stroke="white"
							stroke-width="2.8"
							stroke-linecap="round"
						/>
						<circle cx="27" cy="25.5" r="3" fill="#A7D1FF" />
					</svg>
				</span>
				<span>serba<span class="brand-light">bisa</span><i>.</i></span>
			</a>

			<nav class="desktop-nav" aria-label="Navigasi utama">
				<a class="nav-link active" href="/jasa">Cari jasa</a>
				<a class="nav-link" href="#cara-kerja">Cara kerja</a>
				<a class="nav-link" href="#ulasan">Ulasan</a>
			</nav>

			<div class="header-actions">
				<a class="login-link" href="#bergabung">Masuk</a>
				<a class="button button-small button-primary" href="#bergabung">Daftar gratis</a>
			</div>

			<details class="mobile-menu">
				<summary aria-label="Buka menu navigasi">
					<span></span><span></span><span></span>
				</summary>
				<nav aria-label="Navigasi mobile">
					<a href="/jasa">Cari jasa</a>
					<a href="#cara-kerja">Cara kerja</a>
					<a href="#ulasan">Ulasan</a>
					<a href="#bergabung">Masuk / Daftar</a>
				</nav>
			</details>
		</div>
	</header>

	<main>
		<section class="hero">
			<div class="hero-orb hero-orb-one"></div>
			<div class="hero-orb hero-orb-two"></div>
			<div class="container hero-grid">
				<div class="hero-copy">
					<div class="eyebrow"><span class="eyebrow-dot"></span> Semua kebutuhan, satu tempat</div>
					<h1>
						Cari jasa.<br />
						<span>Beres urusan.</span>
					</h1>
					<p class="hero-description">
						Dari urusan rumah sampai ide jadi nyata, temukan orang yang tepat untuk membantu harimu.
					</p>

					<form class="search-card" method="GET" action="/jasa">
						<label class="search-input-wrap">
							<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" stroke-width="1.8" />
								<path d="m16 16 4.1 4.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
							</svg>
							<span class="sr-only">Cari jasa atau kebutuhan</span>
							<input bind:value={query} name="q" placeholder="Lagi butuh bantuan apa?" />
						</label>
						<span class="search-divider"></span>
						<label class="location-input-wrap">
							<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<path
									d="M19 10.2c0 5-7 11-7 11s-7-6-7-11a7 7 0 1 1 14 0Z"
									stroke="currentColor"
									stroke-width="1.7"
								/>
								<circle cx="12" cy="10" r="2.3" stroke="currentColor" stroke-width="1.7" />
							</svg>
							<span>Lokasi</span>
							<span class="location-current"><input name="location" placeholder="Di mana saja" /></span>
						</label>
						<button class="button button-primary search-button" type="submit">
							<span>Cari jasa</span>
							<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
								<path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
						</button>
					</form>

					<div class="popular-searches">
						<span>Sering dicari:</span>
						<button onclick={() => (query = 'bersih')}>Bersih-bersih</button>
						<button onclick={() => (query = 'desain')}>Desain</button>
						<button onclick={() => (query = 'laptop')}>Servis laptop</button>
					</div>

					<div class="hero-proof">
						<div class="proof-avatars" aria-hidden="true">
							<span>NP</span><span>RS</span><span>DP</span><span class="proof-plus">+</span>
						</div>
						<div>
							<div class="proof-stars" aria-label="Rating 4,9 dari 5">★★★★★ <b>4.9/5</b></div>
							<p>Dipercaya banyak orang untuk bantu urusan sehari-hari</p>
						</div>
					</div>
				</div>

				<div class="hero-art" aria-label="Ilustrasi menemukan jasa di sekitar">
					<div class="art-glow"></div>
					<div class="orbit orbit-outer"></div>
					<div class="orbit orbit-inner"></div>
					<div class="map-card">
						<div class="map-label"><span></span> Banyak jasa di sekitarmu</div>
						<div class="map-grid">
							<div class="map-road road-one"></div>
							<div class="map-road road-two"></div>
							<div class="map-road road-three"></div>
							<div class="map-river"></div>
							<div class="map-pin pin-one"><span>✦</span></div>
							<div class="map-pin pin-two"><span>⌘</span></div>
							<div class="map-pin pin-three"><span>◒</span></div>
							<div class="map-you"><span></span></div>
							<div class="map-caption">Kamu di sini</div>
						</div>
					</div>
					<div class="floating-rating">
						<div class="rating-icon">★</div>
						<div><strong>4.9 <span>/ 5.0</span></strong><small>Rating penyedia jasa</small></div>
					</div>
					<div class="floating-chat">
						<div class="chat-avatar">NP</div>
						<div class="chat-copy"><strong>Nadia siap membantu!</strong><small>Biasanya membalas cepat</small></div>
						<span class="online-dot"></span>
					</div>
					<div class="art-sparkle sparkle-one">✳</div>
					<div class="art-sparkle sparkle-two">✦</div>
				</div>
			</div>
			<div class="hero-bottom container">
				<span class="hero-bottom-line"></span>
				<span>Yang kamu butuhkan, dekat dan mudah ditemukan</span>
				<span class="hero-bottom-line"></span>
			</div>
		</section>

		<section class="category-section" aria-labelledby="category-title">
			<div class="container">
				<div class="section-heading category-heading">
					<div>
						<p class="section-kicker">Mulai dari sini</p>
						<h2 id="category-title">Butuh bantuan apa hari ini?</h2>
					</div>
					<a class="text-link" href="/jasa">Lihat semua jasa <span>↗</span></a>
				</div>
				<div class="category-list">
					<a class="category-tile" href="/jasa?category=Rumah%20tangga">
						<span class="category-icon home-icon"><svg viewBox="0 0 24 24" fill="none"><path d="m3.5 10 8.5-7 8.5 7v10.5h-6v-7h-5v7h-6V10Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" /></svg></span>
						<span>Rumah tangga</span><small>86+ jasa</small>
					</a>
					<a class="category-tile" href="/jasa?category=Desain">
						<span class="category-icon design-icon"><svg viewBox="0 0 24 24" fill="none"><path d="M4 4h16v16H4zM8 16l3-4 2 2 3-5 3 7" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" /><circle cx="9" cy="8" r="1.3" fill="currentColor" /></svg></span>
						<span>Desain kreatif</span><small>52+ jasa</small>
					</a>
					<a class="category-tile" href="/jasa?category=Teknologi">
						<span class="category-icon tech-icon"><svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="13" rx="2" stroke="currentColor" stroke-width="1.7" /><path d="M8 21h8m-4-4v4m-5-9 3-3 2 2 3-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" /></svg></span>
						<span>Teknologi</span><small>41+ jasa</small>
					</a>
					<a class="category-tile" href="/jasa?category=Kecantikan">
						<span class="category-icon beauty-icon"><svg viewBox="0 0 24 24" fill="none"><path d="M12 3.5c2.8 3.1 5.8 5.5 5.8 9.5a5.8 5.8 0 1 1-11.6 0c0-4 3-6.4 5.8-9.5Z" stroke="currentColor" stroke-width="1.7" /><path d="M9 14.5c.4 1.3 1.4 2 2.8 2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" /></svg></span>
						<span>Kecantikan</span><small>34+ jasa</small>
					</a>
					<a class="category-tile" href="/jasa?category=Pendidikan">
						<span class="category-icon learn-icon"><svg viewBox="0 0 24 24" fill="none"><path d="m2.8 8.5 9.2-5 9.2 5-9.2 5-9.2-5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" /><path d="M6.5 10.5v5c3.5 2.8 7.5 2.8 11 0v-5m3.7-2v7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" /></svg></span>
						<span>Pendidikan</span><small>28+ jasa</small>
					</a>
					<a class="category-tile" href="/jasa">
						<span class="category-icon more-icon"><svg viewBox="0 0 24 24" fill="none"><circle cx="5" cy="5" r="1.7" stroke="currentColor" stroke-width="1.7" /><circle cx="12" cy="5" r="1.7" stroke="currentColor" stroke-width="1.7" /><circle cx="19" cy="5" r="1.7" stroke="currentColor" stroke-width="1.7" /><circle cx="5" cy="12" r="1.7" stroke="currentColor" stroke-width="1.7" /><circle cx="12" cy="12" r="1.7" stroke="currentColor" stroke-width="1.7" /><circle cx="19" cy="12" r="1.7" stroke="currentColor" stroke-width="1.7" /><circle cx="5" cy="19" r="1.7" stroke="currentColor" stroke-width="1.7" /><circle cx="12" cy="19" r="1.7" stroke="currentColor" stroke-width="1.7" /><circle cx="19" cy="19" r="1.7" stroke="currentColor" stroke-width="1.7" /></svg></span>
						<span>Lainnya</span><small>Jelajahi semua</small>
					</a>
				</div>
			</div>
		</section>

		<section class="services-section" id="jasa" aria-labelledby="services-title">
			<div class="container">
				<div class="section-heading services-heading">
					<div>
						<p class="section-kicker">Pilihan untukmu</p>
						<h2 id="services-title">Jasa yang lagi banyak dicari</h2>
						<p class="section-description">Temukan bantuan tepercaya dari orang-orang hebat di sekitarmu.</p>
					</div>
					<a class="text-link desktop-see-all" href="/jasa">Jelajahi semua <span>↗</span></a>
				</div>
				<div class="filter-row" aria-label="Filter kategori jasa">
					{#each categories as category}
						<button
							class:filter-active={activeCategory === category}
							class="filter-chip"
							onclick={() => (activeCategory = category)}
						>
							{category}
						</button>
					{/each}
				</div>

				<div class="service-grid">
					{#each visibleServices as service}
						<article class="service-card">
							<div class={`service-art ${service.theme}`}>
								<span class="art-top-label"><span></span> Tersedia</span>
								<span class="service-illustration" aria-hidden="true">{service.icon}</span>
								<span class="art-bottom-label">{service.category}</span>
							</div>
							<div class="service-body">
								<div class="service-meta"><span>{service.category}</span><span class="meta-separator">·</span><span>{service.location}</span></div>
								<a href="#bergabung" class="service-title">{service.title}</a>
								<div class="service-provider"><span class={`provider-avatar ${service.theme}`}>{service.initials}</span><span>{service.provider}</span><span class="verified-badge" aria-label="Penyedia terverifikasi">✓</span></div>
								<div class="service-footer">
									<div class="service-rating"><span>★</span> {service.rating} <small>({service.reviews})</small></div>
									<div class="service-price"><strong>{service.price}</strong><span>{service.priceUnit}</span></div>
								</div>
							</div>
						</article>
					{:else}
						<div class="empty-state">
							<span>⌕</span>
							<h3>Belum ada jasa yang cocok</h3>
							<p>Coba kata kunci atau kategori lain, siapa tahu ketemu.</p>
							<button class="button button-outline" onclick={() => { query = ''; activeCategory = 'Semua'; }}>Reset pencarian</button>
						</div>
					{/each}
				</div>

				<div class="center-action" id="semua-jasa">
					<a class="button button-outline" href="/jasa">Lihat semua jasa <span>→</span></a>
					<p>Data di atas adalah contoh tampilan, bukan listing aktif.</p>
				</div>
			</div>
		</section>

		<section class="trust-section" id="cara-kerja" aria-labelledby="trust-title">
			<div class="container trust-grid">
				<div class="trust-copy">
					<p class="section-kicker">Nyaman dari awal</p>
					<h2 id="trust-title">Lebih gampang cari bantuan yang pas.</h2>
					<p class="trust-description">Lihat detail layanan dengan jelas, baca pengalaman orang lain, lalu ngobrol langsung sebelum menentukan pilihan.</p>
					<div class="trust-points">
						<div><span class="check-icon">✓</span><span><strong>Info yang transparan</strong><small>Harga, lokasi, dan detail jasa terlihat di awal.</small></span></div>
						<div><span class="check-icon">✓</span><span><strong>Ulasan dari pengguna</strong><small>Baca rating dan komentar sebelum memilih.</small></span></div>
						<div><span class="check-icon">✓</span><span><strong>Ngobrol langsung</strong><small>Tanyakan kebutuhanmu secara privat ke owner.</small></span></div>
					</div>
					<a class="button button-primary" href="/jasa">Temukan jasamu <span>→</span></a>
				</div>
				<div class="trust-visual">
					<div class="trust-blue-shape"></div>
					<div class="review-card">
						<div class="review-card-top"><span class="review-quote">“</span><span class="review-stars">★★★★★</span></div>
						<p>“Enak banget bisa tanya-tanya dulu. Jasa bersih-bersihnya juga detail dan ramah!”</p>
						<div class="review-author"><span class="review-avatar">SW</span><span><strong>Sarah W.</strong><small>Pengguna Serba Bisa</small></span><span class="review-service">Jasa Rumah</span></div>
					</div>
					<div class="review-card review-card-small">
						<div class="small-avatars"><span>AR</span><span>DM</span><span>+</span></div>
						<strong>4.9/5</strong>
						<small>Rating dari pengguna</small>
					</div>
					<span class="visual-star visual-star-one">✳</span>
					<span class="visual-star visual-star-two">✦</span>
				</div>
			</div>
		</section>

		<section class="review-section" id="ulasan" aria-labelledby="review-title">
			<div class="container">
				<div class="review-heading">
					<div><p class="section-kicker">Cerita mereka</p><h2 id="review-title">Bantuan kecil, hari lebih baik.</h2></div>
					<div class="review-summary"><span>★★★★★</span><strong>4.9 <small>/ 5</small></strong><small>Dari ulasan pengguna</small></div>
				</div>
				<div class="review-grid">
					<article class="quote-card">
						<div class="quote-stars">★★★★★</div>
						<p>“Cari orang buat benerin laptop jadi gampang. Bisa lihat review dan tanya dulu sebelum deal.”</p>
						<div class="quote-author"><span class="quote-avatar avatar-blue">RA</span><span><strong>Rizky A.</strong><small>Bandung</small></span><span class="quote-category">Servis laptop</span></div>
					</article>
					<article class="quote-card">
						<div class="quote-stars">★★★★★</div>
						<p>“Suka karena infonya jelas dan respons owner cepat. Rumah jadi bersih tanpa ribet cari-cari.”</p>
						<div class="quote-author"><span class="quote-avatar avatar-peach">DL</span><span><strong>Dina L.</strong><small>Jakarta</small></span><span class="quote-category">Rumah tangga</span></div>
					</article>
					<article class="quote-card">
						<div class="quote-stars">★★★★★</div>
						<p>“Aku bisa fokus cari layanan desain yang sesuai budget. Proses tanya jawabnya juga nyaman.”</p>
						<div class="quote-author"><span class="quote-avatar avatar-lilac">NF</span><span><strong>Nadia F.</strong><small>Surabaya</small></span><span class="quote-category">Desain</span></div>
					</article>
				</div>
				<p class="demo-note">Contoh ulasan untuk pratinjau desain. Ulasan aktual akan tampil setelah platform memiliki pengguna.</p>
			</div>
		</section>

		<section class="join-section" id="bergabung">
			<div class="container join-card">
				<div class="join-decoration join-decoration-one"></div>
				<div class="join-decoration join-decoration-two"></div>
				<div class="join-content">
					<p class="join-kicker">Punya keahlian? Yuk, mulai.</p>
					<h2>Jadikan keahlianmu<br />lebih berarti.</h2>
					<p>Temukan lebih banyak orang yang membutuhkan jasamu.</p>
					<a class="button button-white" href="mailto:halo@serbabisa.id?subject=Info%20Serba%20Bisa">Aku mau menawarkan jasa <span>→</span></a>
				</div>
				<div class="join-art" aria-hidden="true">
					<div class="join-sun"></div><div class="join-person"><span class="person-head"></span><span class="person-body"></span></div>
					<div class="join-card-float"><span>✦</span><strong>Keahlianmu<br />dibutuhkan!</strong></div>
					<div class="join-sparkle">✳</div>
				</div>
			</div>
		</section>
	</main>

	<footer class="site-footer" id="kebijakan">
		<div class="container footer-main">
			<div class="footer-brand-block">
				<a class="brand footer-brand" href="/" aria-label="Serba Bisa, beranda">
					<span class="brand-mark"><svg viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="13" fill="currentColor" /><path d="M12 14.5h16M12 20h11M12 25.5h8" stroke="white" stroke-width="2.8" stroke-linecap="round" /><circle cx="27" cy="25.5" r="3" fill="#A7D1FF" /></svg></span>
					<span>serba<span class="brand-light">bisa</span><i>.</i></span>
				</a>
				<p>Tempat bertemunya kebutuhan dan keahlian. Biar urusan jadi lebih sederhana.</p>
			</div>
			<div class="footer-column"><strong>Jelajahi</strong><a href="/jasa">Cari jasa</a><a href="#cara-kerja">Cara kerja</a><a href="#ulasan">Cerita pengguna</a></div>
			<div class="footer-column"><strong>Mulai di sini</strong><a href="#bergabung">Daftar sebagai pengguna</a><a href="#bergabung">Tawarkan jasa</a><a href="#bergabung">Masuk akun</a></div>
			<div class="footer-column"><strong>Bantuan</strong><a href="mailto:halo@serbabisa.id">Hubungi kami</a><a href="#kebijakan">Privasi</a><a href="#ketentuan">Ketentuan layanan</a></div>
		</div>
		<div class="container footer-bottom" id="ketentuan"><span>© 2026 Serba Bisa. Dibuat untuk bantu urusanmu.</span><span class="footer-social">Temukan bantuan, temukan keahlian <span>✦</span></span></div>
	</footer>
</div>
