<script lang="ts">
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	function statusLabel(status: string): string {
		return {
			draft: 'Draft',
			active: 'Aktif',
			unavailable: 'Tidak tersedia',
			suspended: 'Ditangguhkan',
			archived: 'Diarsipkan'
		}[status] ?? status;
	}
</script>

<svelte:head>
	<title>Moderasi jasa | Serba Bisa</title>
	<meta name="description" content="Tinjau dan moderasi listing jasa Serba Bisa." />
</svelte:head>

<main class="moderation-page">
	<header class="moderation-header">
		<a class="moderation-brand" href="/"><span>s.</span> serba<span>bisa</span><i>.</i></a>
		<nav aria-label="Navigasi akun"><a href="/jasa">Katalog</a><a href="/akun">Akun</a></nav>
	</header>

	<div class="moderation-content">
		<a class="moderation-back" href="/akun">← Kembali ke akun</a>
		<div class="moderation-heading">
			<div><p>Area administrasi</p><h1>Moderasi jasa</h1><span>Review status listing dan catat alasan setiap keputusan.</span></div>
			<strong>{data.services.length} listing</strong>
		</div>

		{#if data.apiError}
			<div class:moderation-forbidden={data.forbidden} class="moderation-alert" role="status">
				<strong>{data.forbidden ? 'Akses terbatas' : 'Moderasi belum tersedia'}</strong>
				<p>{data.apiError}</p>
				{#if data.forbidden}
					<p>Jika kamu merupakan admin, minta super admin memberikan role admin melalui proses operasional tepercaya.</p>
				{/if}
			</div>
		{/if}
		{#if form?.error}
			<p class="moderation-alert moderation-error" role="alert">{form.error}</p>
		{/if}

		{#if !data.apiError}
			{#if data.services.length === 0}
				<div class="moderation-empty"><span aria-hidden="true">✓</span><h2>Belum ada listing untuk ditinjau</h2><p>Listing aktif, draft, dan ditangguhkan akan muncul di sini.</p></div>
			{:else}
				<div class="moderation-list">
					{#each data.services as service (service.id)}
						<article class="moderation-card">
							<div class="moderation-card-heading">
								<div><span class="moderation-category">{service.category}</span><span class={`moderation-status moderation-status-${service.status}`}>{statusLabel(service.status)}</span></div>
								<h2>{service.title}</h2>
								<p>{service.description}</p>
							</div>
							<div class="moderation-owner"><span class="moderation-avatar">{service.ownerName.slice(0, 1).toUpperCase()}</span><div><strong>{service.ownerName}</strong><span>{service.ownerEmail}</span></div><small>{service.location}</small></div>
							<form class="moderation-form" method="POST" action="?/moderate">
								<input type="hidden" name="id" value={service.id} />
								<label><span>Alasan tindakan <small>(minimal 8 karakter)</small></span><textarea name="reason" minlength="8" maxlength="500" required rows="2" placeholder="Catat alasan keputusan moderasi untuk audit."></textarea></label>
								<div class="moderation-actions">
									{#if service.status === 'draft'}
										<button class="moderation-button moderation-approve" name="action" value="approve" type="submit">Setujui &amp; publikasikan</button>
									{/if}
									{#if service.status !== 'suspended'}
										<button class="moderation-button moderation-suspend" name="action" value="suspend" type="submit">Tangguhkan jasa</button>
									{:else}
										<button class="moderation-button moderation-restore" name="action" value="restore" type="submit">Pulihkan status sebelumnya</button>
									{/if}
									<a href={`/jasa/${service.id}`}>Lihat halaman jasa →</a>
								</div>
							</form>
						</article>
					{/each}
				</div>
			{/if}
		{/if}
		<p class="moderation-note">Setiap tindakan moderasi dicatat bersama moderator, status sebelum/sesudah, waktu, dan alasan. Audit log belum dapat dihapus melalui aplikasi.</p>
	</div>
</main>

<style>
	.moderation-page{min-height:100vh;background:#f6f9fe;color:#152b49}.moderation-header{height:74px;padding:0 max(22px,calc((100% - 1120px)/2));display:flex;align-items:center;justify-content:space-between;background:#fff;border-bottom:1px solid #e8edf4}.moderation-brand{font-family:'Poppins',sans-serif;font-size:19px;font-weight:700;letter-spacing:-.7px}.moderation-brand>span:first-child{display:inline-grid;width:35px;height:35px;margin-right:6px;place-items:center;border-radius:11px;background:#2874d8;color:#fff}.moderation-brand i{font-style:normal;color:#3982e2}.moderation-header nav{display:flex;gap:22px;color:#526984;font-size:13px;font-weight:700}.moderation-content{width:min(980px,calc(100% - 36px));margin:42px auto 70px}.moderation-back{font-size:13px;font-weight:700;color:#53708e}.moderation-heading{display:flex;align-items:flex-end;justify-content:space-between;margin:24px 0 25px}.moderation-heading p{margin:0 0 8px;color:#2874d8;font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase}.moderation-heading h1{margin:0;font:700 clamp(28px,4vw,38px)/1.2 'Poppins',sans-serif;letter-spacing:-1.3px}.moderation-heading span{display:block;margin-top:8px;color:#77869a;font-size:13px}.moderation-heading>strong{padding:9px 13px;border-radius:999px;background:#eaf3ff;color:#2764ad;font-size:12px;white-space:nowrap}.moderation-alert{margin:0 0 18px;padding:15px 17px;border:1px solid #dfe8f4;border-radius:13px;background:#fff;color:#405570;font-size:13px;line-height:1.6}.moderation-alert strong{display:block;margin-bottom:4px;color:#18385e}.moderation-alert p{margin:0}.moderation-alert p+p{margin-top:7px}.moderation-forbidden{border-color:#f1d8ae;background:#fffbf3}.moderation-error{border-color:#f1caca;background:#fff6f6;color:#9e3939}.moderation-empty{padding:48px 20px;text-align:center;border:1px dashed #dbe5f1;border-radius:16px;background:rgba(255,255,255,.7)}.moderation-empty>span{display:grid;width:44px;height:44px;margin:auto;place-items:center;border-radius:50%;background:#e8f7ef;color:#21834c;font-size:20px}.moderation-empty h2{margin:14px 0 5px;font:700 17px 'Poppins',sans-serif}.moderation-empty p,.moderation-note{color:#8794a7;font-size:12px;line-height:1.7}.moderation-empty p{margin:0}.moderation-list{display:grid;gap:14px}.moderation-card{padding:21px;border:1px solid #e4ebf4;border-radius:17px;background:#fff;box-shadow:0 12px 32px rgba(30,65,110,.045)}.moderation-card-heading>div{display:flex;gap:7px}.moderation-category,.moderation-status{padding:5px 8px;border-radius:999px;background:#eff5fc;color:#526d8b;font-size:10px;font-weight:800}.moderation-status-active,.moderation-status-unavailable{background:#e8f7ef;color:#21834c}.moderation-status-suspended{background:#fff0ee;color:#aa4d40}.moderation-card-heading h2{margin:10px 0 5px;font:700 17px 'Poppins',sans-serif}.moderation-card-heading p{margin:0;color:#6d7f95;font-size:13px;line-height:1.6}.moderation-owner{display:flex;align-items:center;gap:10px;margin:17px 0;padding:12px 0;border-top:1px solid #edf1f6;border-bottom:1px solid #edf1f6}.moderation-avatar{display:grid;width:36px;height:36px;flex:0 0 auto;place-items:center;border-radius:50%;background:#eaf3ff;color:#2874d8;font-size:13px;font-weight:800}.moderation-owner>div{display:grid;gap:3px;flex:1;min-width:0}.moderation-owner strong{font-size:12px}.moderation-owner span:not(.moderation-avatar){color:#8290a3;font-size:11px}.moderation-owner small{color:#75869b;font-size:11px}.moderation-form label{display:grid;gap:7px;color:#405570;font-size:12px;font-weight:700}.moderation-form label small{margin-left:4px;color:#8794a7;font-weight:500}.moderation-form textarea{width:100%;padding:10px 12px;border:1px solid #dfe7f1;border-radius:10px;outline:none;color:#152b49;background:#fbfdff;font:400 12px 'DM Sans',sans-serif;line-height:1.5;resize:vertical}.moderation-form textarea:focus{border-color:#6ea2e5;box-shadow:0 0 0 3px rgba(40,116,216,.11)}.moderation-actions{display:flex;align-items:center;flex-wrap:wrap;gap:9px;margin-top:12px}.moderation-button{min-height:38px;padding:0 13px;border:0;border-radius:9px;font:700 11px 'DM Sans',sans-serif;cursor:pointer}.moderation-approve,.moderation-restore{background:#2874d8;color:#fff}.moderation-suspend{background:#fff0ee;color:#a8463a}.moderation-actions a{margin-left:auto;color:#2874d8;font-size:11px;font-weight:800}.moderation-archived-note{color:#8794a7;font-size:12px}.moderation-note{max-width:700px;margin:22px auto 0;text-align:center}@media(max-width:600px){.moderation-content{margin-top:28px}.moderation-heading{align-items:flex-start;gap:12px}.moderation-heading h1{font-size:28px}.moderation-heading>strong{padding:8px 10px;font-size:10px}.moderation-card{padding:16px}.moderation-owner{align-items:flex-start;flex-wrap:wrap}.moderation-owner small{width:100%;margin-left:46px}.moderation-actions{align-items:stretch;flex-direction:column}.moderation-actions a{margin:3px 0}.moderation-button{min-height:42px}}
</style>
