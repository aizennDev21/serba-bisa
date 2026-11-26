<script lang="ts">
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	function roleLabel(role: string): string {
		return {
			seeker: 'Penyewa',
			provider: 'Penyedia',
			admin: 'Admin',
			super_admin: 'Super admin'
		}[role] ?? role;
	}

	function actionLabel(action: string): string {
		return {
			suspend: 'Menonaktifkan akun',
			restore: 'Memulihkan akun',
			grant_admin: 'Memberikan role admin',
			revoke_admin: 'Mencabut role admin'
		}[action] ?? action;
	}
</script>

<svelte:head>
	<title>Manajemen pengguna | Serba Bisa</title>
	<meta name="description" content="Kelola akun pengguna Serba Bisa sesuai kewenangan admin." />
</svelte:head>

<main class="users-page">
	<header class="users-header">
		<a class="users-brand" href="/"><span>s.</span> serba<span>bisa</span><i>.</i></a>
		<nav aria-label="Navigasi administrasi"><a href="/admin/jasa">Moderasi jasa</a><a href="/akun">Akun</a></nav>
	</header>

	<div class="users-content">
		<a class="users-back" href="/akun">← Kembali ke akun</a>
		<div class="users-heading">
			<div><p>Area administrasi</p><h1>Manajemen pengguna</h1><span>Kelola status akun berdasarkan cakupan role-mu.</span></div>
			{#if data.pagination}<strong>{data.pagination.total} akun</strong>{/if}
		</div>

		{#if data.apiError}
			<div class:users-forbidden={data.forbidden} class="users-alert" role="status">
				<strong>{data.forbidden ? 'Akses terbatas' : 'Manajemen akun belum tersedia'}</strong>
				<p>{data.apiError}</p>
			</div>
		{/if}
		{#if form?.error}<p class="users-alert users-error" role="alert">{form.error}</p>{/if}

		{#if !data.apiError}
			<form class="users-search" method="GET" action="/admin/users">
				<label for="user-search">Cari nama atau email</label>
				<div><input id="user-search" name="q" value={data.search} placeholder="Contoh: nama@email.com" maxlength="100" /><button type="submit">Cari</button>{#if data.search}<a href="/admin/users">Hapus filter</a>{/if}</div>
			</form>

			{#if data.users.length === 0}
				<div class="users-empty"><span aria-hidden="true">⌕</span><h2>Tidak ada akun ditemukan</h2><p>Coba kata kunci pencarian lain.</p></div>
			{:else}
				<div class="users-list">
					{#each data.users as user (user.id)}
						<article class="user-card">
							<div class="user-main">
								<span class="user-avatar">{user.displayName.slice(0, 1).toUpperCase()}</span>
								<div class="user-info"><h2>{user.displayName}</h2><p>{user.email}</p><div class="user-meta"><span class={`user-status user-status-${user.status}`}>{user.status === 'active' ? 'Aktif' : 'Dinonaktifkan'}</span><span>{new Date(user.createdAt).toLocaleDateString('id-ID')}</span></div></div>
								<div class="user-roles">{#each user.roles as role}<span class:role-admin={role === 'admin'} class:role-super={role === 'super_admin'}>{roleLabel(role)}</span>{/each}</div>
							</div>

							{#if user.roles.includes('super_admin') && !data.canManageRoles}
								<p class="user-protected">Akun super admin tidak ditampilkan dalam cakupan pengelolaan admin.</p>
							{:else if user.id !== data.actorId}
								<form class="user-actions" method="POST" action="?/manage">
									<input type="hidden" name="id" value={user.id} />
									<label><span>Alasan tindakan <small>(minimal 8 karakter)</small></span><input name="reason" minlength="8" maxlength="500" required placeholder="Wajib untuk audit, minimal 8 karakter" /></label>
									<div class="user-action-buttons">
										{#if user.status === 'active'}
											<button class="user-button user-button-warn" name="action" value="suspend" type="submit">Nonaktifkan</button>
										{:else}
											<button class="user-button user-button-primary" name="action" value="restore" type="submit">Pulihkan akun</button>
										{/if}
										{#if data.canManageRoles && !user.roles.includes('super_admin')}
											{#if user.roles.includes('admin')}
												<button class="user-button user-button-neutral" name="action" value="revoke_admin" type="submit">Cabut admin</button>
											{:else}
												<button class="user-button user-button-neutral" name="action" value="grant_admin" type="submit">Jadikan admin</button>
											{/if}
										{/if}
									</div>
								</form>
							{:else}
								<p class="user-protected">Pengelolaan terhadap akun sendiri tidak diizinkan.</p>
							{/if}

							{#if data.canManageRoles && user.audit.length > 0}
								<details class="user-audit">
									<summary>Riwayat administratif ({user.audit.length})</summary>
									<ul>
										{#each user.audit as entry (entry.id)}
											<li><strong>{actionLabel(entry.action)}</strong><span>{entry.actorName} · {new Date(entry.createdAt).toLocaleString('id-ID')}</span><p>{entry.reason}</p></li>
										{/each}
									</ul>
								</details>
							{/if}
						</article>
					{/each}
				</div>
			{/if}

			{#if data.pagination && data.pagination.totalPages > 1}
				<nav class="users-pagination" aria-label="Halaman pengguna">
					{#if data.pagination.page > 1}<a href={`/admin/users?${new URLSearchParams({ ...(data.search ? { q: data.search } : {}), page: String(data.pagination.page - 1) })}`}>← Sebelumnya</a>{/if}
					<span>Halaman {data.pagination.page} dari {data.pagination.totalPages}</span>
					{#if data.pagination.page < data.pagination.totalPages}<a href={`/admin/users?${new URLSearchParams({ ...(data.search ? { q: data.search } : {}), page: String(data.pagination.page + 1) })}`}>Selanjutnya →</a>{/if}
				</nav>
			{/if}
		{/if}

		<div class="users-scope">
			<strong>{data.canManageRoles ? 'Cakupan super admin' : 'Cakupan admin'}</strong>
			<p>{data.canManageRoles ? 'Dapat mengelola akun biasa dan admin serta memberikan/mencabut role admin. Role super admin tetap tidak dapat diubah dari dashboard ini.' : 'Hanya akun biasa yang dapat dikelola. Akun super admin tidak dapat dicari atau diubah oleh admin.'}</p>
		</div>
		<p class="users-note">Menonaktifkan akun mencabut semua sesi aktif. Semua tindakan wajib memiliki alasan dan masuk ke audit log administratif.</p>
	</div>
</main>

<style>
	.users-page{min-height:100vh;background:#f6f9fe;color:#152b49}.users-header{height:74px;padding:0 max(22px,calc((100% - 1120px)/2));display:flex;align-items:center;justify-content:space-between;background:#fff;border-bottom:1px solid #e8edf4}.users-brand{font-family:'Poppins',sans-serif;font-size:19px;font-weight:700;letter-spacing:-.7px}.users-brand>span:first-child{display:inline-grid;width:35px;height:35px;margin-right:6px;place-items:center;border-radius:11px;background:#2874d8;color:#fff}.users-brand i{font-style:normal;color:#3982e2}.users-header nav{display:flex;gap:22px;color:#526984;font-size:13px;font-weight:700}.users-content{width:min(980px,calc(100% - 36px));margin:42px auto 70px}.users-back{font-size:13px;font-weight:700;color:#53708e}.users-heading{display:flex;align-items:flex-end;justify-content:space-between;margin:24px 0}.users-heading p{margin:0 0 8px;color:#2874d8;font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase}.users-heading h1{margin:0;font:700 clamp(28px,4vw,38px)/1.2 'Poppins',sans-serif;letter-spacing:-1.3px}.users-heading span{display:block;margin-top:8px;color:#77869a;font-size:13px}.users-heading>strong{padding:9px 13px;border-radius:999px;background:#eaf3ff;color:#2764ad;font-size:12px;white-space:nowrap}.users-alert{margin:0 0 18px;padding:15px 17px;border:1px solid #dfe8f4;border-radius:13px;background:#fff;color:#405570;font-size:13px;line-height:1.6}.users-alert strong{display:block;margin-bottom:4px;color:#18385e}.users-alert p{margin:0}.users-forbidden{border-color:#f1d8ae;background:#fffbf3}.users-error{border-color:#f1caca;background:#fff6f6;color:#9e3939}.users-search{margin-bottom:18px;padding:17px;border:1px solid #e4ebf4;border-radius:14px;background:#fff}.users-search label{display:block;margin-bottom:8px;color:#405570;font-size:12px;font-weight:800}.users-search>div{display:flex;gap:8px}.users-search input,.user-actions input{min-width:0;min-height:42px;padding:0 12px;border:1px solid #dfe7f1;border-radius:9px;outline:none;color:#152b49;background:#fbfdff;font:400 12px 'DM Sans',sans-serif}.users-search input{flex:1}.users-search input:focus,.user-actions input:focus{border-color:#6ea2e5;box-shadow:0 0 0 3px rgba(40,116,216,.1)}.users-search button{padding:0 16px;border:0;border-radius:9px;background:#2874d8;color:#fff;font:700 12px 'DM Sans',sans-serif;cursor:pointer}.users-search a{align-self:center;color:#2874d8;font-size:11px;font-weight:700}.users-list{display:grid;gap:13px}.user-card{padding:19px;border:1px solid #e4ebf4;border-radius:16px;background:#fff;box-shadow:0 10px 28px rgba(30,65,110,.04)}.user-main{display:flex;align-items:flex-start;gap:12px}.user-avatar{display:grid;width:40px;height:40px;flex:0 0 auto;place-items:center;border-radius:50%;background:#eaf3ff;color:#2874d8;font-weight:800}.user-info{flex:1;min-width:0}.user-info h2{margin:0;font:700 15px 'Poppins',sans-serif}.user-info>p{margin:4px 0 9px;color:#77869a;font-size:12px;overflow-wrap:anywhere}.user-meta,.user-roles{display:flex;align-items:center;flex-wrap:wrap;gap:7px}.user-meta{color:#8794a7;font-size:10px}.user-status,.user-roles span{padding:5px 8px;border-radius:999px;background:#eff5fc;color:#526d8b;font-size:10px;font-weight:800}.user-status-active{background:#e8f7ef;color:#21834c}.user-status-suspended{background:#fff0ee;color:#aa4d40}.user-roles{justify-content:flex-end;max-width:180px}.user-roles .role-admin{background:#fff5df;color:#a77415}.user-roles .role-super{background:#f2eaff;color:#7043aa}.user-actions{display:grid;gap:10px;margin:15px 0 0;padding-top:13px;border-top:1px solid #edf1f6}.user-actions label{display:grid;gap:6px;color:#405570;font-size:11px;font-weight:800}.user-actions small{color:#8794a7;font-weight:500}.user-actions input{width:100%}.user-action-buttons{display:flex;flex-wrap:wrap;gap:8px}.user-button{min-height:36px;padding:0 12px;border:0;border-radius:9px;font:700 11px 'DM Sans',sans-serif;cursor:pointer}.user-button-warn{background:#fff0ee;color:#a8463a}.user-button-primary{background:#e8f7ef;color:#21834c}.user-button-neutral{background:#eff5fc;color:#315476}.user-protected{margin:13px 0 0;padding-top:11px;border-top:1px solid #edf1f6;color:#8794a7;font-size:11px}.user-audit{margin-top:13px;padding-top:11px;border-top:1px solid #edf1f6}.user-audit summary{color:#2874d8;font-size:11px;font-weight:800;cursor:pointer}.user-audit ul{display:grid;gap:10px;margin:12px 0 0;padding:0;list-style:none}.user-audit li{padding:10px;border-radius:9px;background:#f8faff}.user-audit li strong,.user-audit li span{display:block;font-size:11px}.user-audit li span{margin-top:3px;color:#8290a3;font-size:10px}.user-audit li p{margin:5px 0 0;color:#526984;font-size:11px;line-height:1.5}.users-empty{padding:42px 20px;text-align:center;border:1px dashed #dbe5f1;border-radius:16px;background:rgba(255,255,255,.7)}.users-empty>span{font-size:28px;color:#82a8d7}.users-empty h2{margin:8px 0 5px;font:700 16px 'Poppins',sans-serif}.users-empty p{margin:0;color:#8794a7;font-size:12px}.users-pagination{display:flex;align-items:center;justify-content:center;gap:18px;margin:20px auto;color:#75869b;font-size:12px}.users-pagination a{color:#2874d8;font-weight:800}.users-scope{margin-top:26px;padding:15px 17px;border:1px solid #e1e9f4;border-radius:13px;background:#fafdff}.users-scope strong{font-size:12px}.users-scope p,.users-note{margin:5px 0 0;color:#8290a3;font-size:11px;line-height:1.6}.users-note{text-align:center;margin-top:17px}@media(max-width:600px){.users-content{margin-top:28px}.users-heading{align-items:flex-start;gap:12px}.users-heading h1{font-size:28px}.users-heading>strong{padding:8px 10px;font-size:10px}.user-card{padding:15px}.user-main{flex-wrap:wrap}.user-roles{width:100%;max-width:none;justify-content:flex-start;padding-left:52px}.users-search>div{flex-wrap:wrap}.users-search input{flex-basis:100%}}
</style>
