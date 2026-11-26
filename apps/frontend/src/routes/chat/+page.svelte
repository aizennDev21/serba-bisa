<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Pesan | Serba Bisa</title>
</svelte:head>

<main class="chat-page">
	<header class="chat-header">
		<a href="/" class="chat-brand">s. serba<span>bisa</span>.</a>
		<nav><a href="/jasa">Jelajahi jasa</a><a href="/akun">Akun</a></nav>
	</header>
	<section class="chat-content">
		<div class="chat-page-heading">
			<p>Komunikasi privat</p>
			<h1>Pesan</h1>
			<span>Percakapan hanya dapat dilihat oleh penyewa dan owner jasa terkait.</span>
		</div>
		{#if data.apiError}
			<p class="chat-alert" role="alert">{data.apiError}</p>
		{:else if data.conversations.length}
			<div class="chat-list">
				{#each data.conversations as conversation}
					<a class="chat-list-card" href={`/chat/${conversation.id}`}>
						<span class="chat-avatar">{conversation.otherUserName.slice(0, 1).toUpperCase()}</span>
						<span class="chat-list-main">
							<strong>{conversation.otherUserName}</strong>
							<small>{conversation.serviceTitle}</small>
							<span>{conversation.lastMessage}</span>
						</span>
						<time>{new Date(conversation.updatedAt).toLocaleDateString('id-ID')}</time>
					</a>
				{/each}
			</div>
		{:else}
			<div class="chat-empty">
				<span>✉</span>
				<h2>Belum ada percakapan</h2>
				<p>Buka jasa yang kamu minati dan pilih “Chat dengan penyedia” untuk memulai.</p>
				<a href="/jasa">Jelajahi jasa</a>
			</div>
		{/if}
	</section>
</main>

<style>
	.chat-page{min-height:100vh;background:#f6f9fe;color:#152b49}.chat-header{height:70px;padding:0 max(20px,calc((100% - 1000px)/2));display:flex;align-items:center;justify-content:space-between;background:#fff;border-bottom:1px solid #e8edf4}.chat-brand{font:700 19px Poppins,sans-serif;color:#2874d8}.chat-brand span{color:#152b49}.chat-header nav{display:flex;gap:20px;font-size:12px;font-weight:700;color:#526984}.chat-content{width:min(760px,calc(100% - 32px));margin:38px auto}.chat-page-heading p{margin:0 0 7px;color:#2874d8;font-size:10px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase}.chat-page-heading h1{margin:0;font:700 32px Poppins,sans-serif}.chat-page-heading>span{display:block;margin-top:7px;color:#78889b;font-size:12px}.chat-list{display:grid;gap:10px;margin-top:24px}.chat-list-card{display:flex;align-items:center;gap:13px;padding:16px;border:1px solid #e3eaf3;border-radius:14px;background:#fff}.chat-avatar{display:grid;width:42px;height:42px;flex:0 0 auto;place-items:center;border-radius:50%;background:#eaf3ff;color:#2874d8;font-weight:800}.chat-list-main{display:grid;gap:4px;flex:1;min-width:0}.chat-list-main strong{font:600 13px Poppins,sans-serif}.chat-list-main small,.chat-list-card time{color:#8a98a9;font-size:10px}.chat-list-main>span{overflow:hidden;color:#627891;font-size:11px;text-overflow:ellipsis;white-space:nowrap}.chat-empty{padding:42px 20px;margin-top:24px;border:1px dashed #dbe5f1;border-radius:16px;background:#fff;text-align:center}.chat-empty>span{font-size:28px;color:#82a8d7}.chat-empty h2{margin:8px 0 5px;font:600 16px Poppins,sans-serif}.chat-empty p{max-width:380px;margin:0 auto 15px;color:#8797a9;font-size:12px;line-height:1.6}.chat-empty a{color:#2874d8;font-size:12px;font-weight:800}.chat-alert{padding:14px;border:1px solid #f1caca;border-radius:12px;background:#fff6f6;color:#9e3939;font-size:12px}
</style>
