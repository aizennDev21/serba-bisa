<script lang="ts">
	import type { PageProps } from './$types';
	import { formatPriceUnit, formatServicePrice } from '../../lib/services';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Cari jasa | Serba Bisa</title>
	<meta
		name="description"
		content="Jelajahi jasa yang tersedia dan temukan penyedia yang sesuai dengan kebutuhanmu."
	/>
</svelte:head>

<div class="catalog-page">
	<header class="catalog-header">
		<div class="catalog-container catalog-header-inner">
			<a href="/" class="catalog-brand"><span class="catalog-brand-icon">s.</span><span>serba<span>bisa</span><i>.</i></span></a>
			<nav aria-label="Navigasi"><a href="/">Beranda</a><a href="/jasa" aria-current="page">Cari jasa</a></nav>
			<a class="catalog-sign-in" href="/#bergabung">Masuk / Daftar</a>
		</div>
	</header>

	<main class="catalog-container">
		<div class="catalog-breadcrumb"><a href="/">Beranda</a><span>/</span><span>Cari jasa</span></div>
		<section class="catalog-intro">
			<div>
				<p class="catalog-eyebrow">Jelajahi layanan</p>
				<h1>Temukan jasa yang kamu butuhkan.</h1>
				<p class="catalog-subtitle">Cari layanan berdasarkan kebutuhan, kategori, atau area.</p>
			</div>
			<div class="catalog-intro-decoration" aria-hidden="true">✦</div>
		</section>

		<form class="catalog-filter" method="GET" action="/jasa">
			<label class="catalog-search">
				<span class="catalog-sr-only">Kata kunci</span>
				<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" stroke-width="1.8" /><path d="m16 16 4.1 4.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
				<input name="q" value={data.filters.q} placeholder="Contoh: bersih-bersih, desain..." />
			</label>
			<label class="catalog-select-wrap">
				<span class="catalog-sr-only">Kategori jasa</span>
				<select name="category" value={data.filters.category}>
					<option value="">Semua kategori</option>
					{#each data.categories as category}
						<option value={category}>{category}</option>
					{/each}
				</select>
				<span aria-hidden="true">⌄</span>
			</label>
			<label class="catalog-location">
				<span class="catalog-sr-only">Lokasi</span>
				<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 10.2c0 5-7 11-7 11s-7-6-7-11a7 7 0 1 1 14 0Z" stroke="currentColor" stroke-width="1.7" /><circle cx="12" cy="10" r="2.3" stroke="currentColor" stroke-width="1.7" /></svg>
				<input name="location" value={data.filters.location} placeholder="Lokasi" />
			</label>
			<button class="catalog-submit" type="submit">Cari jasa <span>→</span></button>
		</form>

		{#if data.apiError}
			<div class="catalog-alert" role="status">
				<span class="catalog-alert-icon" aria-hidden="true">!</span>
				<div><strong>Katalog belum sepenuhnya tersedia</strong><p>{data.apiError}</p></div>
			</div>
		{/if}

		<div class="catalog-results-heading">
			<div>
				<h2>Jasa tersedia</h2>
				{#if data.pagination}
					<p>{data.pagination.total} layanan ditemukan</p>
				{:else}
					<p>Listing akan tampil setelah katalog terhubung ke database.</p>
				{/if}
			</div>
			<span class="catalog-results-label"><i></i> Listing aktif</span>
		</div>

		{#if data.listings.length > 0}
			<div class="catalog-grid">
				{#each data.listings as service}
					<a class="catalog-service-card" href={`/jasa/${service.id}`}>
						<div class="catalog-service-top">
							<span class="catalog-service-category">{service.category}</span>
							<span class="catalog-available"><i></i> Tersedia</span>
						</div>
						<h3>{service.title}</h3>
						<p class="catalog-service-description">{service.description}</p>
						<div class="catalog-service-location">
							<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 10.2c0 5-7 11-7 11s-7-6-7-11a7 7 0 1 1 14 0Z" stroke="currentColor" stroke-width="1.7" /><circle cx="12" cy="10" r="2.3" stroke="currentColor" stroke-width="1.7" /></svg>
							{service.location}
						</div>
						<div class="catalog-service-divider"></div>
						<div class="catalog-service-owner"><span class="catalog-owner-avatar">{service.ownerName.slice(0, 1).toUpperCase()}</span><span>{service.ownerName}</span></div>
						<div class="catalog-service-bottom">
							<div class="catalog-rating"><span>★</span> {service.reviewCount ? service.rating.toFixed(1) : 'Baru'} <small>{service.reviewCount ? `(${service.reviewCount} ulasan)` : 'Belum ada ulasan'}</small></div>
							<div class="catalog-price"><strong>{formatServicePrice(service.price)}</strong><small>{formatPriceUnit(service.priceUnit)}</small></div>
						</div>
					</a>
				{/each}
			</div>

			{#if data.previousHref || data.nextHref}
				<nav class="catalog-pagination" aria-label="Paginasi katalog">
					{#if data.previousHref}<a href={data.previousHref}>← Sebelumnya</a>{/if}
					<span>Halaman {data.pagination?.page} dari {data.pagination?.totalPages}</span>
					{#if data.nextHref}<a href={data.nextHref}>Selanjutnya →</a>{/if}
				</nav>
			{/if}
		{:else if !data.apiError}
			<div class="catalog-empty">
				<span aria-hidden="true">⌕</span>
				<h2>Belum ada jasa yang cocok</h2>
				<p>Coba kata kunci, kategori, atau lokasi lain.</p>
				<a href="/jasa" class="catalog-reset">Hapus semua filter</a>
			</div>
		{:else}
			<div class="catalog-empty catalog-empty-unavailable">
				<span aria-hidden="true">⌁</span>
				<h2>Jasa belum dapat dimuat</h2>
				<p>Periksa koneksi backend dan database, lalu coba muat ulang halaman.</p>
				<a href="/jasa" class="catalog-reset">Coba lagi</a>
			</div>
		{/if}
	</main>

	<footer class="catalog-footer">
		<div class="catalog-container"><a href="/">serbabisa<span>.</span></a><span>Temukan bantuan, temukan keahlian.</span><a href="/">Kembali ke beranda ↑</a></div>
	</footer>
</div>
