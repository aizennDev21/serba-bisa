<script lang="ts">
	import type { PageProps } from './$types';
	import { formatPriceUnit, formatServicePrice } from '../../../lib/services';

	let { data, form }: PageProps = $props();
	const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

	function formatMinute(minute: number): string {
		return minute === 1440 ? '24:00' : `${String(Math.floor(minute / 60)).padStart(2, '0')}:00`;
	}
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
					<section class="detail-section detail-review-section" id="ulasan">
						<div class="detail-review-heading"><div><h2>Ulasan pelanggan</h2><p>Ulasan yang dipublikasikan untuk jasa ini.</p></div><strong>★ {data.service.reviewCount ? data.service.rating.toFixed(1) : '—'}</strong></div>
						{#if data.service.reviews.length}
							<div class="detail-review-list">
								{#each data.service.reviews as review}
									<article class="detail-review">
										<div class="detail-review-avatar">{review.authorName.slice(0, 1).toUpperCase()}</div>
										<div class="detail-review-content">
											<div class="detail-review-meta"><strong>{review.authorName}</strong><span>★ {review.rating}</span></div>
											<p>{review.comment}</p>
											<small>{new Date(review.createdAt).toLocaleDateString('id-ID')}</small>
											{#if review.reply}
												<div class="detail-review-reply">
													<strong>Balasan dari {review.reply.authorName}</strong>
													<p>{review.reply.comment}</p>
													<small>{new Date(review.reply.createdAt).toLocaleDateString('id-ID')}</small>
												</div>
											{:else if data.service.viewer.canReply}
												<form class="detail-review-reply-form" method="POST" action="?/reply">
													<input type="hidden" name="reviewId" value={review.id} />
													<label for={`reply-${review.id}`}>Balas ulasan</label>
													<textarea id={`reply-${review.id}`} name="comment" minlength="2" maxlength="2000" required placeholder="Tulis balasan yang membantu..." aria-describedby={`reply-error-${review.id}`}></textarea>
													{#if form?.replyId === review.id && form.replyError}<p class="detail-review-error" id={`reply-error-${review.id}`} role="alert">{form.replyError}</p>{/if}
													<button type="submit">Kirim balasan</button>
												</form>
											{/if}
										</div>
									</article>
								{/each}
							</div>
						{:else}
							<p class="detail-no-reviews">Belum ada ulasan untuk jasa ini.</p>
						{/if}
						{#if data.service.viewer.canReview}
							<form class="detail-review-form" method="POST" action="?/review">
								<h3>Bagikan pengalamanmu</h3>
								<label for="review-rating">Rating</label>
								<select id="review-rating" name="rating" required>
									<option value="">Pilih rating</option>
									<option value="5">★★★★★ — Sangat puas</option>
									<option value="4">★★★★ — Puas</option>
									<option value="3">★★★ — Cukup</option>
									<option value="2">★★ — Kurang puas</option>
									<option value="1">★ — Tidak puas</option>
								</select>
								<label for="review-comment">Komentar</label>
								<textarea id="review-comment" name="comment" minlength="3" maxlength="2000" required placeholder="Ceritakan pengalamanmu menggunakan jasa ini..."></textarea>
								{#if form?.reviewError}<p class="detail-review-error" role="alert">{form.reviewError}</p>{/if}
								<button type="submit">Kirim ulasan</button>
								<small>Ulasan tersedia setelah pesanan selesai. Satu ulasan dapat diberikan untuk setiap jasa.</small>
							</form>
						{:else if !data.service.viewer.isAuthenticated}
							<p class="detail-review-hint"><a href="/akun">Masuk atau daftar</a> untuk memberikan ulasan dan rating.</p>
						{:else if data.service.viewer.canReply}
							<p class="detail-review-hint">Sebagai penyedia, kamu dapat membalas ulasan pelanggan di atas.</p>
						{:else}
							<p class="detail-review-hint">Ulasan tersedia setelah pesanan selesai dan hanya satu ulasan dapat diberikan untuk setiap jasa.</p>
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
						<div class="detail-availability">
							<strong>Ketersediaan mingguan <small>WIB</small></strong>
							{#each data.service.weeklyAvailability as day (day.dayOfWeek)}
								<div><span>{dayNames[day.dayOfWeek]}</span><span>{day.isAvailable ? `${formatMinute(day.startMinute)}–${formatMinute(day.endMinute)}` : 'Libur'}</span></div>
							{/each}
							<p>Pesanan terjadwal menggunakan slot satu jam.</p>
						</div>
						{#if data.service.viewer.canStartChat}
							<form class="detail-booking-form" method="POST" action="?/booking">
								<h3>Ajukan pesanan</h3>
								<p>Permintaan akan dikirim ke penyedia untuk ditinjau. Pembayaran belum tersedia di platform.</p>
								<label for="booking-message">Ceritakan kebutuhanmu</label>
								<textarea id="booking-message" name="requestMessage" minlength="20" maxlength="2000" required placeholder="Jelaskan pekerjaan dan kebutuhan yang perlu diketahui penyedia..." aria-describedby="booking-message-error"></textarea>
								<label for="booking-time">Jadwal yang diinginkan <span>(opsional, pilih menit 00 WIB)</span></label>
								<input id="booking-time" name="requestedAt" type="datetime-local" step="3600" />
								<label for="booking-location">Lokasi layanan <span>(opsional)</span></label>
								<input id="booking-location" name="requestedLocation" maxlength="200" placeholder={data.service.location} />
								{#if form?.bookingError}<p class="detail-review-error" id="booking-message-error" role="alert">{form.bookingError}</p>{/if}
								<button type="submit">Kirim permintaan pesanan</button>
							</form>
						{/if}
						{#if data.service.viewer.canStartChat}
							<form method="POST" action="?/chat">
								<button class="detail-contact-button" type="submit">Chat dengan penyedia <span>→</span></button>
							</form>
						{:else if !data.service.viewer.isAuthenticated}
							<a class="detail-contact-button" href="/akun">Masuk untuk menghubungi <span>→</span></a>
						{:else if data.service.viewer.canReply}
							<p class="detail-contact-note">Ini adalah jasa yang kamu tawarkan.</p>
						{/if}
						{#if form?.chatError}<p class="detail-review-error" role="alert">{form.chatError}</p>{/if}
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

<style>
	.detail-availability{display:grid;gap:6px;padding:12px;margin:14px 0;border-radius:10px;background:#f7f9fc}.detail-availability>strong{margin-bottom:2px;color:#526984;font-size:10px}.detail-availability>strong small{color:#8797a9;font-weight:500}.detail-availability>div{display:flex;justify-content:space-between;gap:8px;color:#71839a;font-size:9px}.detail-availability>div span:last-child{font-weight:700;color:#405873}.detail-availability>p{margin:4px 0 0;color:#8797a9;font-size:9px}
	.detail-booking-form{display:grid;gap:8px;padding:15px;margin:17px 0;border:1px solid #dce8f7;border-radius:12px;background:#f8fbff}.detail-booking-form h3{margin:0;color:#152b49;font:600 14px Poppins,sans-serif}.detail-booking-form>p{margin:0 0 4px;color:#78889b;font-size:10px;line-height:1.55}.detail-booking-form label{margin-top:4px;color:#526984;font-size:10px;font-weight:700}.detail-booking-form label span{font-weight:400;color:#8797a9}.detail-booking-form input,.detail-booking-form textarea{width:100%;padding:10px;border:1px solid #dfe7f0;border-radius:8px;background:#fff;color:#152b49;font:inherit;font-size:11px}.detail-booking-form textarea{min-height:84px;resize:vertical}.detail-booking-form button{padding:11px;border:0;border-radius:8px;background:#2874d8;color:#fff;font-size:11px;font-weight:700;cursor:pointer}
</style>
