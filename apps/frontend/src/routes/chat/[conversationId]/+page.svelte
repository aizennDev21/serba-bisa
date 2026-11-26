<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let connection = $state('Menghubungkan…');

	$effect(() => {
		if (!data.eventsUrl) return;
		let events: EventSource | undefined;
		let retry: ReturnType<typeof setTimeout>;
		let stopped = false;
		const connect = () => {
			events = new EventSource(data.eventsUrl, { withCredentials: true });
			events.onopen = () => { connection = 'Terhubung'; };
			events.onmessage = (event) => {
				try {
					const payload = JSON.parse(String(event.data)) as { type?: string };
					if (payload.type === 'new_message') void invalidateAll();
				} catch (cause) {
					console.error('Chat menerima notifikasi realtime yang tidak valid.', cause);
				}
			};
			events.onerror = () => {
				connection = 'Menghubungkan kembali…';
				events?.close();
				if (!stopped) retry = setTimeout(connect, 2000);
			};
		};
		connect();
		return () => {
			stopped = true;
			clearTimeout(retry);
			events?.close();
		};
	});
</script>

<svelte:head>
	<title>{data.conversation ? `${data.conversation.otherUserName} | Chat Serba Bisa` : 'Chat | Serba Bisa'}</title>
</svelte:head>

<main class="conversation-page">
	<header class="conversation-header">
		<a href="/chat" aria-label="Kembali ke daftar pesan">←</a>
		<div><strong>{data.conversation?.otherUserName ?? 'Percakapan'}</strong><small>{data.conversation?.serviceTitle ?? 'Chat privat'}</small></div>
		<span class:connected={connection === 'Terhubung'}>{connection}</span>
	</header>
	{#if data.apiError}
		<p class="conversation-error" role="alert">{data.apiError}</p>
	{:else}
		<div class="conversation-context">
			Percakapan privat tentang <a href={`/jasa/${data.conversation?.serviceId}`}>{data.conversation?.serviceTitle}</a>
		</div>
		<section class="conversation-messages" aria-label="Riwayat pesan" aria-live="polite">
			{#if data.messages.length}
				{#each data.messages as message (message.id)}
					<article class="conversation-message" class:mine={message.senderId === data.viewerId}>
						<strong>{message.senderId === data.viewerId ? 'Kamu' : message.senderName}</strong>
						<p>{message.content}</p>
						<time>{new Date(message.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</time>
					</article>
				{/each}
			{:else}
				<p class="conversation-empty">Belum ada pesan. Mulai percakapan dengan sopan dan jangan bagikan informasi sensitif.</p>
			{/if}
		</section>
		<form class="conversation-compose" method="POST" action="?/send">
			{#if form?.error}<p class="conversation-error" role="alert">{form.error}</p>{/if}
			<label class="sr-only" for="chat-message">Tulis pesan</label>
			<textarea id="chat-message" name="content" maxlength="4000" required placeholder="Tulis pesan…" rows="2"></textarea>
			<button type="submit">Kirim</button>
		</form>
	{/if}
</main>

<style>
	.conversation-page{display:flex;min-height:100vh;flex-direction:column;background:#f6f9fe;color:#152b49}.conversation-header{position:sticky;top:0;z-index:1;display:flex;min-height:70px;align-items:center;gap:14px;padding:10px max(16px,calc((100% - 760px)/2));border-bottom:1px solid #e8edf4;background:#fff}.conversation-header>a{color:#2874d8;font-size:23px}.conversation-header>div{display:grid;flex:1;gap:3px}.conversation-header strong{font:600 13px Poppins,sans-serif}.conversation-header small{color:#8392a4;font-size:10px}.conversation-header>span{color:#a8792a;font-size:9px}.conversation-header>span.connected{color:#21834c}.conversation-context{width:min(720px,calc(100% - 28px));padding:10px;margin:12px auto 0;border-radius:9px;background:#eaf3ff;color:#637a94;text-align:center;font-size:10px}.conversation-context a{color:#2874d8;font-weight:700}.conversation-messages{display:flex;width:min(720px,calc(100% - 28px));flex:1;flex-direction:column;gap:12px;margin:16px auto;padding:10px 0 30px}.conversation-message{width:min(78%,520px);padding:11px 13px;border:1px solid #e3eaf3;border-radius:13px 13px 13px 3px;background:#fff;box-shadow:0 6px 18px rgba(30,65,110,.03)}.conversation-message.mine{align-self:flex-end;border-color:#cfe0f6;border-radius:13px 13px 3px 13px;background:#eaf3ff}.conversation-message strong{color:#526984;font-size:9px}.conversation-message p{margin:5px 0;color:#263f5e;font-size:12px;line-height:1.6;overflow-wrap:anywhere;white-space:pre-wrap}.conversation-message time{display:block;color:#8e9bac;text-align:right;font-size:8px}.conversation-empty{margin:auto;color:#8493a5;text-align:center;font-size:12px;line-height:1.7}.conversation-compose{position:sticky;bottom:0;display:grid;grid-template-columns:1fr auto;gap:9px;width:100%;padding:12px max(14px,calc((100% - 760px)/2));border-top:1px solid #e5ecf4;background:#fff}.conversation-compose textarea{min-height:44px;max-height:140px;padding:11px;border:1px solid #dfe7f1;border-radius:10px;resize:vertical;font:400 12px 'DM Sans',sans-serif}.conversation-compose button{align-self:end;min-height:42px;padding:0 17px;border:0;border-radius:9px;background:#2874d8;color:#fff;font-size:11px;font-weight:800}.conversation-error{grid-column:1/-1;margin:0;padding:10px;border-radius:8px;background:#fff1f1;color:#a8463a;font-size:11px}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
</style>
