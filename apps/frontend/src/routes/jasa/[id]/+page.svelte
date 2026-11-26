<script lang="ts">
	import type { PageProps } from './$types';
	import { formatPriceUnit, formatServicePrice } from '../../../lib/services';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.service ? `${data.service.title} | Serba Bisa` : 'Detail jasa | Serba Bisa'}</title>
	<meta
		name="description"
		content={data.service?.description ?? 'Informasi layanan jasa di Serba Bisa.'}
	/>
</svelte:head>

<div class="catalog-page">
	<header class="catalog-header">
		<div class="catalog-container catalog-header-inner">
			<a href="/" class="catalog-brand"><span class="catalog-brand-icon">s.</span><span>serba<span>bisa</span><i>.</i></span></a>
			<nav aria-label="Navigasi"><a href="/">Beranda</a><a href="/jasa" aria-current="page">Cari jasa</a></nav>
			<a class="catalog-sign-in" href="/akun">Masuk / Daftar</a>
		</div>
	</header>

	<main class="catalog-container detail-container">
		<div class="catalog-breadcrumb"><a href="/">Beranda</a><span>/</span><a href="/jasa">Cari jasa</a><span>/</span><span>Detail jasa</span></div>
		{#if data.service}
			<a class="detail-back" href="/jasa">← Kembali ke katalog</a>
			<article class="service-detail">
				<div class="detail-main">
					<div class="detail-category-row"><span class="catalog-service-category">{data.service.category}</span><span class="catalog-available"><i></i> Tersedia</span></div>
					<h1>{data.service.title}</h1>
					<div class="detail-summary">
						<span class="catalog-rating"><span>★</span> {data.service.reviewCount ? data.service.rating.toFixed(1) : 'Baru'}</span>
						<span>{data.service.reviewCount} ulasan</span><span>·</span><span>{data.service.location}</span>
					</div>
					<section class="detail-section">
						<h2>Deskripsi jasa</h2>
						<p>{data.service.description}</p>
					</section>
					<section class="detail-section detail-review-section">
						<div class="detail-review-heading"><div><h2>Ulasan pelanggan</h2><p>Ulasan yang dipublikasikan untuk jasa ini.</p></div><strong>★ {data.service.reviewCount ? data.service.rating.toFixed(1) : '—'}</strong></div>
						{#if data.service.reviews.length}
							<div class="detail-review-list">
								{#each data.service.reviews as review}
									<article class="detail-review">
										<div class="detail-review-avatar">{review.authorName.slice(0, 1).toUpperCase()}</div>
										<div><div class="detail-review-meta"><strong>{review.authorName}</strong><span>★ {review.rating}</span></div><p>{review.comment}</p><small>{new Date(review.createdAt).toLocaleDateString('id-ID')}</small></div>
									</article>
								{/each}
							</div>
						{:else}
							<p class="detail-no-reviews">Belum ada ulasan untuk jasa ini.</p>
						{/if}
					</section>
				</div>
				<aside class="detail-sidebar">
					<div class="detail-owner-card">
						<p class="detail-sidebar-label">Penyedia jasa</p>
						<div class="detail-owner"><span>{data.service.ownerName.slice(0, 1).toUpperCase()}</span><strong>{data.service.ownerName}</strong></div>
						<div class="detail-sidebar-divider"></div>
						<p class="detail-sidebar-label">Harga jasa</p>
						<div class="detail-price">{formatServicePrice(data.service.price)}<small>{formatPriceUnit(data.service.priceUnit)}</small></div>
						<p class="detail-price-note">Harga ditampilkan sesuai informasi dari penyedia jasa.</p>
						<a class="detail-contact-button" href="/akun">Masuk untuk menghubungi <span>→</span></a>
						<p class="detail-contact-note">Chat langsung belum tersedia pada tahap ini.</p>
					</div>
					<div class="detail-location-card"><span>⌖</span><div><strong>Lokasi layanan</strong><p>{data.service.location}</p></div></div>
				</aside>
			</article>
		{:else}
			<div class="catalog-alert detail-error" role="status">
				<span class="catalog-alert-icon" aria-hidden="true">!</span>
				<div><strong>Detail jasa belum dapat dimuat</strong><p>{data.apiError}</p><a href="/jasa">Kembali ke katalog</a></div>
			</div>
		{/if}
	</main>

	<footer class="catalog-footer"><div class="catalog-container"><a href="/">serbabisa<span>.</span></a><span>Temukan bantuan, temukan keahlian.</span><a href="/jasa">Kembali ke katalog ↑</a></div></footer>
</div>
