<script lang="ts">
	import type { PageProps } from './$types';
	import { formatPriceUnit, formatServicePrice } from '../../lib/services';

	let { data, form }: PageProps = $props();
	const statusLabels: Record<string, string> = {
		requested: 'Menunggu respons',
		accepted: 'Diterima',
		declined: 'Ditolak',
		cancelled: 'Dibatalkan',
		completed: 'Selesai'
	};
</script>

<svelte:head>
	<title>Pesanan | Serba Bisa</title>
</svelte:head>

<main class="booking-page">
	<header class="booking-header">
		<a href="/" class="booking-brand">s. serba<span>bisa</span>.</a>
		<nav aria-label="Navigasi"><a href="/jasa">Jelajahi jasa</a><a href="/chat">Pesan</a><a href="/notifikasi">Notifikasi</a><a href="/akun">Akun</a></nav>
	</header>
	<section class="booking-content">
		<div class="booking-heading">
			<p>Permintaan layanan</p>
			<h1>Pesanan saya</h1>
			<span>Atur permintaan jasa dan pantau statusnya. Pembayaran belum tersedia di platform.</span>
		</div>
		{#if form?.error}<p class="booking-alert" role="alert">{form.error}</p>{/if}
		{#if data.apiError}
			<p class="booking-alert" role="alert">{data.apiError}</p>
		{:else if data.bookings.length}
			<div class="booking-list">
				{#each data.bookings as booking}
					<article class="booking-card">
						<div class="booking-card-heading">
							<div><p>{booking.viewerRole === 'seeker' ? 'Penyedia' : 'Pelanggan'}</p><h2>{booking.serviceTitle}</h2><span>{booking.viewerRole === 'seeker' ? booking.ownerName : booking.seekerName}</span></div>
							<span class={`booking-status booking-status-${booking.status}`}>{statusLabels[booking.status]}</span>
						</div>
						<p class="booking-message">{booking.requestMessage}</p>
						{#if booking.statusReason}<p class="booking-reason">Catatan status: {booking.statusReason}</p>{/if}
						<div class="booking-meta">
							<span>{formatServicePrice(booking.price)} {formatPriceUnit(booking.priceUnit)}</span>
							{#if booking.requestedAt}<span>Jadwal: {new Date(booking.requestedAt).toLocaleString('id-ID')}</span>{/if}
							{#if booking.requestedLocation}<span>Lokasi: {booking.requestedLocation}</span>{/if}
						</div>
						<div class="booking-actions">
							{#if booking.viewerRole === 'provider' && booking.status === 'requested'}
								<form method="POST" action="?/transition"><input type="hidden" name="bookingId" value={booking.id} /><input type="hidden" name="status" value="accepted" /><button type="submit">Terima pesanan</button></form>
								<form method="POST" action="?/transition"><input type="hidden" name="bookingId" value={booking.id} /><input type="hidden" name="status" value="declined" /><label for={`decline-${booking.id}`}>Alasan penolakan</label><input id={`decline-${booking.id}`} name="reason" minlength="8" maxlength="500" required placeholder="Jelaskan alasan, minimal 8 karakter" /><button class="booking-secondary" type="submit">Tolak</button></form>
							{:else if booking.status === 'accepted'}
								{#if booking.viewerRole === 'provider'}
									<form method="POST" action="?/transition"><input type="hidden" name="bookingId" value={booking.id} /><input type="hidden" name="status" value="completed" /><button type="submit">Tandai selesai</button></form>
								{/if}
								<form method="POST" action="?/transition"><input type="hidden" name="bookingId" value={booking.id} /><input type="hidden" name="status" value="cancelled" /><label for={`cancel-${booking.id}`}>Alasan pembatalan</label><input id={`cancel-${booking.id}`} name="reason" minlength="8" maxlength="500" required placeholder="Jelaskan alasan, minimal 8 karakter" /><button class="booking-secondary" type="submit">Batalkan</button></form>
							{:else if booking.viewerRole === 'seeker' && booking.status === 'requested'}
								<form method="POST" action="?/transition"><input type="hidden" name="bookingId" value={booking.id} /><input type="hidden" name="status" value="cancelled" /><label for={`cancel-${booking.id}`}>Alasan pembatalan</label><input id={`cancel-${booking.id}`} name="reason" minlength="8" maxlength="500" required placeholder="Jelaskan alasan, minimal 8 karakter" /><button class="booking-secondary" type="submit">Batalkan permintaan</button></form>
							{/if}
						</div>
						<small class="booking-date">Diajukan {new Date(booking.createdAt).toLocaleString('id-ID')}</small>
					</article>
				{/each}
			</div>
		{:else}
			<div class="booking-empty"><h2>Belum ada pesanan</h2><p>Ajukan permintaan dari halaman detail jasa untuk memulai.</p><a href="/jasa">Jelajahi jasa</a></div>
		{/if}
	</section>
</main>

<style>
	.booking-page{min-height:100vh;background:#f6f9fe;color:#152b49}.booking-header{height:70px;padding:0 max(20px,calc((100% - 1000px)/2));display:flex;align-items:center;justify-content:space-between;background:#fff;border-bottom:1px solid #e8edf4}.booking-brand{font:700 19px Poppins,sans-serif;color:#2874d8}.booking-brand span{color:#152b49}.booking-header nav{display:flex;gap:20px;font-size:12px;font-weight:700;color:#526984}.booking-content{width:min(760px,calc(100% - 32px));margin:38px auto}.booking-heading>p{margin:0 0 7px;color:#2874d8;font-size:10px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase}.booking-heading h1{margin:0;font:700 32px Poppins,sans-serif}.booking-heading>span{display:block;margin-top:7px;color:#78889b;font-size:12px}.booking-list{display:grid;gap:14px;margin-top:24px}.booking-card{padding:18px;border:1px solid #e3eaf3;border-radius:14px;background:#fff}.booking-card-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.booking-card-heading p{margin:0;color:#8291a3;font-size:10px}.booking-card-heading h2{margin:4px 0;font:600 16px Poppins,sans-serif}.booking-card-heading div>span,.booking-meta,.booking-date{color:#78889b;font-size:11px}.booking-status{padding:6px 9px;border-radius:30px;background:#eef3f8;color:#50657d;font-size:10px;font-weight:700;white-space:nowrap}.booking-status-requested{background:#fff5df;color:#9a6a13}.booking-status-accepted{background:#e8f3ff;color:#2874d8}.booking-status-completed{background:#e8f7ed;color:#27844a}.booking-status-declined,.booking-status-cancelled{background:#fff0f0;color:#a94c4c}.booking-message{padding:12px;margin:14px 0;border-radius:9px;background:#f7f9fc;color:#526984;font-size:12px;line-height:1.6}.booking-reason{padding:10px;margin:0 0 10px;border-left:3px solid #d7e5f7;background:#f8fbff;color:#526984;font-size:11px;line-height:1.5}.booking-meta{display:grid;gap:5px}.booking-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:14px}.booking-actions form{display:flex;align-items:end;flex-wrap:wrap;gap:7px}.booking-actions label{width:100%;color:#526984;font-size:10px}.booking-actions input{min-width:min(270px,65vw);padding:9px;border:1px solid #dfe7f0;border-radius:8px;font:inherit;font-size:11px}.booking-actions button,.booking-empty a{padding:9px 12px;border:0;border-radius:8px;background:#2874d8;color:#fff;font-size:11px;font-weight:700;cursor:pointer}.booking-actions .booking-secondary{background:#fff;color:#8f4b4b;border:1px solid #f0d8d8}.booking-date{display:block;margin-top:14px}.booking-alert{padding:13px;border:1px solid #f1caca;border-radius:12px;background:#fff6f6;color:#9e3939;font-size:12px}.booking-empty{padding:42px 20px;margin-top:24px;border:1px dashed #dbe5f1;border-radius:16px;background:#fff;text-align:center}.booking-empty h2{margin:0 0 5px;font:600 16px Poppins,sans-serif}.booking-empty p{margin:0 auto 15px;color:#8797a9;font-size:12px}
</style>
