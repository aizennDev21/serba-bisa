<script lang="ts">
	import type { PageProps } from './$types';
	import { formatPriceUnit, formatServicePrice } from '../../../lib/services';

	let { data, form }: PageProps = $props();
	const categories = ['Rumah tangga', 'Desain', 'Teknologi', 'Kecantikan', 'Pendidikan', 'Lainnya'];
</script>

<svelte:head>
	<title>Jasa saya | Serba Bisa</title>
	<meta name="description" content="Kelola daftar jasa yang kamu tawarkan di Serba Bisa." />
</svelte:head>

<main class="owner-page">
	<header class="owner-header">
		<a class="owner-brand" href="/"><span>s.</span> serba<span>bisa</span><i>.</i></a>
		<nav aria-label="Navigasi akun"><a href="/jasa">Cari jasa</a><a href="/akun">Akun</a></nav>
	</header>

	<div class="owner-content">
		<a class="owner-back" href="/akun">← Kembali ke akun</a>
		<div class="owner-heading">
			<div>
				<p class="owner-eyebrow">Area penyedia jasa</p>
				<h1>{data.account ? `Jasa ${data.account.displayName}` : 'Kelola jasa kamu'}</h1>
				<p>Buat listing, simpan sebagai draft, atau ubah status publikasinya.</p>
			</div>
			<span class="owner-count">{data.services.length} listing</span>
		</div>

		{#if data.apiError}
			<p class="owner-alert" role="status">{data.apiError}</p>
		{/if}
		{#if form?.error}
			<p class="owner-alert" role="alert">{form.error}</p>
		{/if}

		<section class="owner-panel">
			<div class="owner-panel-heading">
				<div><h2>Buat jasa baru</h2><p>Listing baru dimulai sebagai draft dan tidak langsung tampil di katalog.</p></div>
				<span aria-hidden="true">＋</span>
			</div>
			<form class="owner-form" method="POST" action="?/create">
				<label><span>Nama jasa</span><input name="title" minlength="3" maxlength="120" required placeholder="Contoh: Servis laptop" /></label>
				<label><span>Kategori</span><select name="category" required>
					{#each categories as category}<option value={category}>{category}</option>{/each}
				</select></label>
				<label class="owner-form-wide"><span>Deskripsi <small>Minimal 20 karakter</small></span><textarea name="description" minlength="20" maxlength="5000" required rows="4" placeholder="Jelaskan layanan, cakupan, dan hal yang perlu diketahui pelanggan."></textarea></label>
				<label><span>Harga (rupiah)</span><input type="number" name="price" min="0" max="100000000" step="1" required placeholder="100000" /></label>
				<label><span>Satuan harga</span><select name="priceUnit" required>
					<option value="hour">Per jam</option><option value="visit">Per kunjungan</option><option value="project">Per proyek</option><option value="session">Per sesi</option><option value="fixed">Harga tetap</option>
				</select></label>
				<label class="owner-form-wide"><span>Lokasi layanan</span><input name="location" minlength="2" maxlength="160" required placeholder="Kota, area, atau Online" /></label>
				<div class="owner-form-wide owner-submit-row"><p>Pastikan informasi harga dan layanan jelas untuk calon pelanggan.</p><button class="owner-button" type="submit">Simpan sebagai draft <span aria-hidden="true">→</span></button></div>
			</form>
		</section>

		<section class="owner-list">
			<div class="owner-list-heading"><div><h2>Daftar jasa</h2><p>Hanya jasa aktif yang muncul di katalog publik.</p></div></div>
			{#if data.services.length === 0}
				<div class="owner-empty"><span aria-hidden="true">⌑</span><h3>Belum ada jasa</h3><p>Isi formulir di atas untuk membuat listing pertamamu.</p></div>
			{:else}
				<div class="owner-service-list">
					{#each data.services as service (service.id)}
						<article class="owner-service-card">
							<div class="owner-service-title">
								<div><span class="owner-category">{service.category}</span><span class={`owner-status owner-status-${service.status}`}>{service.status === 'active' ? 'Aktif' : service.status === 'draft' ? 'Draft' : service.status === 'unavailable' ? 'Tidak tersedia' : service.status === 'archived' ? 'Diarsipkan' : 'Ditangguhkan'}</span></div>
								<h3>{service.title}</h3>
								<p>{service.location} · {formatServicePrice(service.price)} {formatPriceUnit(service.priceUnit)}</p>
							</div>
							<details class="owner-edit">
								<summary>Edit detail</summary>
								<form class="owner-form owner-edit-form" method="POST" action="?/update">
									<input type="hidden" name="id" value={service.id} />
									<label><span>Nama jasa</span><input name="title" value={service.title} minlength="3" maxlength="120" required /></label>
									<label><span>Kategori</span><input name="category" value={service.category} minlength="2" maxlength="80" required /></label>
									<label class="owner-form-wide"><span>Deskripsi</span><textarea name="description" minlength="20" maxlength="5000" required rows="4">{service.description}</textarea></label>
									<label><span>Harga (rupiah)</span><input type="number" name="price" value={service.price} min="0" max="100000000" step="1" required /></label>
									<label><span>Satuan harga</span><select name="priceUnit" value={service.priceUnit}>
										<option value="hour">Per jam</option><option value="visit">Per kunjungan</option><option value="project">Per proyek</option><option value="session">Per sesi</option><option value="fixed">Harga tetap</option>
									</select></label>
									<label><span>Lokasi</span><input name="location" value={service.location} minlength="2" maxlength="160" required /></label>
									<label><span>Status</span><select name="status" value={service.status === 'suspended' ? 'draft' : service.status}>
										<option value="draft">Draft</option><option value="active">Aktif (publikasikan)</option><option value="unavailable">Tidak tersedia</option><option value="archived">Arsipkan</option>
									</select></label>
									<div class="owner-form-wide owner-edit-actions"><button class="owner-button" type="submit">Simpan perubahan</button><a href={`/jasa/${service.id}`}>Lihat halaman jasa →</a></div>
								</form>
								{#if service.status !== 'archived'}
									<form method="POST" action="?/archive" class="owner-archive-form" onsubmit={(event) => { if (!confirm('Arsipkan jasa ini? Jasa tidak lagi tampil di katalog publik.')) event.preventDefault(); }}>
										<input type="hidden" name="id" value={service.id} /><button type="submit">Arsipkan jasa</button>
									</form>
								{/if}
							</details>
						</article>
					{/each}
				</div>
			{/if}
		</section>

		<p class="owner-note">Fitur verifikasi owner dan moderasi admin belum tersedia. Jangan publikasikan informasi pribadi atau data sensitif pada deskripsi jasa.</p>
	</div>
</main>

<style>
	.owner-page{min-height:100vh;background:#f6f9fe;color:#152b49}.owner-header{height:74px;padding:0 max(22px,calc((100% - 1120px)/2));display:flex;align-items:center;justify-content:space-between;background:#fff;border-bottom:1px solid #e8edf4}.owner-brand{font-family:'Poppins',sans-serif;font-size:19px;font-weight:700;letter-spacing:-.7px}.owner-brand>span:first-child{display:inline-grid;width:35px;height:35px;margin-right:6px;place-items:center;border-radius:11px;background:#2874d8;color:#fff}.owner-brand i{font-style:normal;color:#3982e2}.owner-header nav{display:flex;gap:22px;color:#526984;font-size:13px;font-weight:700}.owner-content{width:min(980px,calc(100% - 36px));margin:42px auto 70px}.owner-back{font-size:13px;font-weight:700;color:#53708e}.owner-heading{display:flex;justify-content:space-between;align-items:flex-end;margin:25px 0 28px}.owner-eyebrow{margin:0 0 8px;color:#2874d8;font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase}.owner-heading h1{margin:0;font:700 clamp(28px,4vw,38px)/1.2 'Poppins',sans-serif;letter-spacing:-1.3px}.owner-heading p,.owner-panel-heading p,.owner-list-heading p{margin:8px 0 0;color:#77869a;font-size:13px;line-height:1.6}.owner-count{padding:9px 13px;border-radius:999px;background:#eaf3ff;color:#2764ad;font-size:12px;font-weight:800;white-space:nowrap}.owner-panel,.owner-service-card{border:1px solid #e4ebf4;border-radius:18px;background:#fff;box-shadow:0 12px 32px rgba(30,65,110,.045)}.owner-panel{padding:24px}.owner-panel-heading{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px}.owner-panel-heading h2,.owner-list-heading h2{margin:0;font:700 19px 'Poppins',sans-serif;letter-spacing:-.4px}.owner-panel-heading>span{display:grid;width:36px;height:36px;place-items:center;border-radius:12px;background:#eff6ff;color:#2874d8;font-size:21px}.owner-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.owner-form label{display:grid;gap:7px;color:#405570;font-size:12px;font-weight:700}.owner-form label small{margin-left:5px;color:#8794a7;font-weight:500}.owner-form input,.owner-form textarea,.owner-form select{width:100%;min-height:44px;padding:10px 12px;border:1px solid #dfe7f1;border-radius:10px;outline:none;background:#fbfdff;color:#152b49;font:400 13px 'DM Sans',sans-serif}.owner-form textarea{resize:vertical;line-height:1.6}.owner-form input:focus,.owner-form textarea:focus,.owner-form select:focus{border-color:#6ea2e5;box-shadow:0 0 0 3px rgba(40,116,216,.11)}.owner-form-wide{grid-column:1/-1}.owner-submit-row,.owner-edit-actions{display:flex;align-items:center;justify-content:space-between;gap:14px}.owner-submit-row p{margin:0;color:#8794a7;font-size:11px;line-height:1.5}.owner-button{min-height:43px;padding:0 17px;border:0;border-radius:10px;background:#2874d8;color:#fff;font:700 12px 'DM Sans',sans-serif;cursor:pointer}.owner-button:hover{background:#1d64c0}.owner-list{margin-top:38px}.owner-list-heading{margin-bottom:16px}.owner-service-list{display:grid;gap:12px}.owner-service-card{padding:19px 21px}.owner-service-title>div{display:flex;gap:7px;align-items:center}.owner-category,.owner-status{padding:5px 8px;border-radius:999px;background:#eff5fc;color:#526d8b;font-size:10px;font-weight:800}.owner-status-active{background:#e8f7ef;color:#21834c}.owner-status-draft{background:#fff5df;color:#a77415}.owner-status-unavailable,.owner-status-archived,.owner-status-suspended{background:#f2f3f5;color:#6d7886}.owner-service-title h3{margin:10px 0 4px;font:700 16px 'Poppins',sans-serif}.owner-service-title p{margin:0;color:#78879a;font-size:12px}.owner-edit{margin-top:14px;padding-top:12px;border-top:1px solid #edf1f6}.owner-edit summary{color:#2874d8;font-size:12px;font-weight:800;cursor:pointer}.owner-edit-form{margin-top:15px}.owner-edit-actions a{font-size:12px;font-weight:700;color:#2874d8}.owner-archive-form{margin-top:13px}.owner-archive-form button{padding:0;border:0;background:none;color:#b34848;font:700 11px 'DM Sans',sans-serif;cursor:pointer}.owner-empty{padding:38px 20px;text-align:center;border:1px dashed #dbe5f1;border-radius:16px;background:rgba(255,255,255,.65)}.owner-empty>span{font-size:28px;color:#82a8d7}.owner-empty h3{margin:8px 0 4px;font:700 16px 'Poppins',sans-serif}.owner-empty p,.owner-note{color:#8794a7;font-size:12px;line-height:1.7}.owner-empty p{margin:0}.owner-alert{margin:0 0 18px;padding:12px 14px;border:1px solid #f1caca;border-radius:11px;background:#fff6f6;color:#9e3939;font-size:13px}.owner-note{margin:24px auto 0;text-align:center;max-width:680px}@media(max-width:640px){.owner-content{margin-top:28px}.owner-heading{align-items:flex-start;gap:12px}.owner-heading h1{font-size:27px}.owner-count{font-size:10px;padding:8px 10px}.owner-panel{padding:18px}.owner-form{grid-template-columns:1fr;gap:13px}.owner-form-wide{grid-column:auto}.owner-submit-row,.owner-edit-actions{align-items:stretch;flex-direction:column}.owner-submit-row .owner-button{width:100%}.owner-service-card{padding:16px}.owner-header nav{gap:14px}}
</style>
