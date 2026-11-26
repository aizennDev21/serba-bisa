<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let connection = $state('Menghubungkan…');

	$effect(() => {
		const events = new EventSource(data.eventsUrl, { withCredentials: true });
		events.onopen = () => {
			connection = 'Realtime aktif';
		};
		events.onmessage = (event) => {
			try {
				const payload = JSON.parse(String(event.data)) as { type?: string };
				if (payload.type === 'notification_created') void invalidateAll();
			} catch (cause) {
				console.error('Notifikasi realtime tidak valid.', cause);
			}
		};
		events.onerror = () => {
			connection = 'Menyambungkan kembali…';
		};
		return () => events.close();
	});
</script>

<svelte:head>
	<title>Notifikasi | Serba Bisa</title>
</svelte:head>

<main class="notifications-page">
	<header class="notifications-header">
		<a href="/" class="notifications-brand">s. serba<span>bisa</span>.</a>
		<nav aria-label="Navigasi"><a href="/jasa">Jelajahi jasa</a><a href="/pesanan">Pesanan saya</a><a href="/akun">Akun</a></nav>
	</header>
	<section class="notifications-content">
		<div class="notifications-heading">
			<div><p>Pembaruan akun</p><h1>Notifikasi</h1><span>{data.unreadCount} belum dibaca · {connection}</span></div>
			{#if data.unreadCount}
				<form method="POST" action="?/readAll"><button type="submit">Tandai semua dibaca</button></form>
			{/if}
		</div>
		{#if form?.error}<p class="notifications-alert" role="alert">{form.error}</p>{/if}
		{#if data.apiError}
			<p class="notifications-alert" role="alert">{data.apiError}</p>
		{:else if data.notifications.length}
			<div class="notifications-list">
				{#each data.notifications as notification (notification.id)}
					<article class="notification-card" class:unread={!notification.readAt}>
						<span class="notification-dot" aria-hidden="true"></span>
						<div class="notification-main">
							<strong>{notification.title}</strong>
							<p>{notification.message}</p>
							<time>{new Date(notification.createdAt).toLocaleString('id-ID')}</time>
						</div>
						<form method="POST" action="?/read">
							<input type="hidden" name="notificationId" value={notification.id} />
							<button type="submit">{notification.readAt ? 'Lihat pesanan' : 'Baca & lihat pesanan'}</button>
						</form>
					</article>
				{/each}
			</div>
		{:else}
			<div class="notifications-empty"><span aria-hidden="true">✓</span><h2>Belum ada notifikasi</h2><p>Pembaruan permintaan dan status pesanan akan muncul di sini.</p><a href="/jasa">Jelajahi jasa</a></div>
		{/if}
	</section>
</main>

<style>
	.notifications-page{min-height:100vh;background:#f6f9fe;color:#152b49}.notifications-header{height:70px;padding:0 max(20px,calc((100% - 1000px)/2));display:flex;align-items:center;justify-content:space-between;background:#fff;border-bottom:1px solid #e8edf4}.notifications-brand{font:700 19px Poppins,sans-serif;color:#2874d8}.notifications-brand span{color:#152b49}.notifications-header nav{display:flex;gap:20px;font-size:12px;font-weight:700;color:#526984}.notifications-content{width:min(760px,calc(100% - 32px));margin:38px auto}.notifications-heading{display:flex;align-items:center;justify-content:space-between;gap:12px}.notifications-heading p{margin:0 0 7px;color:#2874d8;font-size:10px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase}.notifications-heading h1{margin:0;font:700 32px Poppins,sans-serif}.notifications-heading span{display:block;margin-top:7px;color:#78889b;font-size:11px}.notifications-heading button,.notification-main+form button,.notifications-empty a{padding:9px 12px;border:0;border-radius:8px;background:#2874d8;color:#fff;font-size:10px;font-weight:700;cursor:pointer}.notifications-list{display:grid;gap:10px;margin-top:24px}.notification-card{display:flex;align-items:flex-start;gap:12px;padding:16px;border:1px solid #e3eaf3;border-radius:13px;background:#fff}.notification-card.unread{border-color:#cfe0f6;background:#fbfdff}.notification-dot{width:9px;height:9px;flex:0 0 auto;margin-top:5px;border-radius:50%;background:transparent}.notification-card.unread .notification-dot{background:#2874d8}.notification-main{flex:1;min-width:0}.notification-main strong{font:600 13px Poppins,sans-serif}.notification-main p{margin:5px 0;color:#586e87;font-size:11px;line-height:1.6}.notification-main time{color:#8a98a9;font-size:9px}.notification-card form{flex:0 0 auto}.notification-card form button{padding:8px 10px;border:1px solid #dfe7f0;border-radius:8px;background:#fff;color:#2874d8;font-size:9px;font-weight:700;cursor:pointer}.notifications-alert{padding:13px;border:1px solid #f1caca;border-radius:12px;background:#fff6f6;color:#9e3939;font-size:12px}.notifications-empty{padding:42px 20px;margin-top:24px;border:1px dashed #dbe5f1;border-radius:16px;background:#fff;text-align:center}.notifications-empty>span{display:grid;width:38px;height:38px;place-items:center;margin:auto;border-radius:50%;background:#e8f7ed;color:#27844a}.notifications-empty h2{margin:12px 0 5px;font:600 16px Poppins,sans-serif}.notifications-empty p{margin:0 auto 15px;color:#8797a9;font-size:12px}
	@media(max-width:520px){.notifications-heading{align-items:flex-start;flex-direction:column}.notification-card{flex-wrap:wrap}.notification-card form{margin-left:21px}}
</style>
