<script lang="ts">
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>Akun | Serba Bisa</title>
	<meta name="description" content="Masuk atau buat akun Serba Bisa untuk menyewa dan menawarkan jasa." />
</svelte:head>

<main class="account-page">
	<header class="account-header">
		<a class="account-brand" href="/"><span>s.</span> serba<span>bisa</span><i>.</i></a>
		<a class="account-back" href="/jasa">Jelajahi jasa <span aria-hidden="true">→</span></a>
	</header>

	<section class="account-content">
		<div class="account-intro">
			<p class="account-eyebrow">Akun Serba Bisa</p>
			<h1>{data.user ? `Halo, ${data.user.displayName}.` : 'Mulai dari satu akun.'}</h1>
			<p>
				{data.user
					? 'Kamu sudah masuk. Akunmu dapat digunakan untuk mencari maupun menawarkan jasa.'
					: 'Masuk untuk melanjutkan, atau daftar agar bisa menyewa dan menawarkan jasa.'}
			</p>
		</div>

		{#if data.apiError}
			<p class="account-alert" role="status">{data.apiError}</p>
		{/if}
		{#if form?.error}
			<p class="account-alert" role="alert">{form.error}</p>
		{/if}

		{#if data.user}
			<article class="account-card account-profile">
				<div class="account-avatar" aria-hidden="true">{data.user.displayName.slice(0, 1).toUpperCase()}</div>
				<div>
					<h2>{data.user.displayName}</h2>
					<p>{data.user.email}</p>
					<div class="account-roles">
						{#each data.user.roles as role}
							<span>{role === 'seeker' ? 'Penyewa jasa' : role === 'provider' ? 'Penyedia jasa' : role}</span>
						{/each}
					</div>
					<a class="account-manage-services" href="/owner/jasa">Kelola jasa saya →</a>
					{#if data.user.roles.includes('admin') || data.user.roles.includes('super_admin')}
						<a class="account-manage-services" href="/admin/jasa">Moderasi jasa →</a>
					{/if}
				</div>
				<form method="POST" action="?/logout">
					<button class="account-button account-button-secondary" type="submit">Keluar</button>
				</form>
			</article>
		{:else}
			<div class="account-forms">
				<form class="account-card" method="POST" action="?/login">
					<h2>Masuk</h2>
					<p class="account-form-hint">Lanjutkan ke akun Serba Bisa.</p>
					<label>
						<span>Email</span>
						<input type="email" name="email" autocomplete="email" required maxlength="254" />
					</label>
					<label>
						<span>Kata sandi</span>
						<input type="password" name="password" autocomplete="current-password" required maxlength="128" />
					</label>
					<button class="account-button" type="submit">Masuk <span aria-hidden="true">→</span></button>
				</form>

				<form class="account-card" method="POST" action="?/register">
					<h2>Buat akun</h2>
					<p class="account-form-hint">Satu akun bisa menyewa sekaligus menawarkan jasa.</p>
					<label>
						<span>Nama tampilan</span>
						<input type="text" name="displayName" autocomplete="name" required minlength="2" maxlength="80" />
					</label>
					<label>
						<span>Email</span>
						<input type="email" name="email" autocomplete="email" required maxlength="254" />
					</label>
					<label>
						<span>Kata sandi <small>(minimal 12 karakter)</small></span>
						<input type="password" name="password" autocomplete="new-password" required minlength="12" maxlength="128" />
					</label>
					<button class="account-button" type="submit">Daftar <span aria-hidden="true">→</span></button>
				</form>
			</div>
		{/if}

		<p class="account-note">
			Akun baru memiliki kapabilitas penyewa dan penyedia. Role admin dan super admin hanya dapat diberikan melalui proses pengelolaan tepercaya.
		</p>
	</section>
</main>

<style>
	.account-page {
		min-height: 100vh;
		background:
			radial-gradient(ellipse at 50% 12%, rgba(216, 233, 255, 0.62), transparent 44%),
			#f7faff;
		color: #152b49;
	}

	.account-header {
		display: flex;
		height: 76px;
		align-items: center;
		justify-content: space-between;
		padding-inline: max(24px, calc((100% - 1120px) / 2));
		border-bottom: 1px solid #e8edf4;
		background: rgba(255, 255, 255, 0.88);
	}

	.account-brand {
		font-family: 'Poppins', sans-serif;
		font-size: 20px;
		font-weight: 700;
		letter-spacing: -0.8px;
	}

	.account-brand > span:first-child {
		display: inline-grid;
		width: 36px;
		height: 36px;
		margin-right: 7px;
		place-items: center;
		border-radius: 12px;
		color: #fff;
		background: #2874d8;
	}

	.account-brand i {
		color: #3982e2;
		font-style: normal;
	}

	.account-back {
		color: #45617f;
		font-size: 13px;
		font-weight: 700;
	}

	.account-back span {
		margin-left: 6px;
		color: #2874d8;
	}

	.account-content {
		width: min(940px, calc(100% - 40px));
		margin: 72px auto;
	}

	.account-intro {
		max-width: 580px;
		margin: 0 auto 34px;
		text-align: center;
	}

	.account-eyebrow {
		margin: 0 0 10px;
		color: #2874d8;
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 1.5px;
		text-transform: uppercase;
	}

	.account-intro h1 {
		margin: 0;
		font-family: 'Poppins', sans-serif;
		font-size: clamp(30px, 5vw, 46px);
		letter-spacing: -1.7px;
	}

	.account-intro > p:last-child {
		margin: 12px 0 0;
		color: #74839a;
		font-size: 15px;
		line-height: 1.7;
	}

	.account-forms {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 20px;
	}

	.account-card {
		display: grid;
		align-content: start;
		gap: 18px;
		padding: 30px;
		border: 1px solid #e5ecf5;
		border-radius: 22px;
		background: #fff;
		box-shadow: 0 18px 50px rgba(30, 65, 110, 0.06);
	}

	.account-card h2 {
		margin: 0;
		font-family: 'Poppins', sans-serif;
		font-size: 22px;
		letter-spacing: -0.5px;
	}

	.account-form-hint {
		margin: -13px 0 0;
		color: #74839a;
		font-size: 13px;
		line-height: 1.5;
	}

	.account-card label {
		display: grid;
		gap: 8px;
		color: #405570;
		font-size: 12px;
		font-weight: 700;
	}

	.account-card label small {
		color: #8996a9;
		font-weight: 500;
	}

	.account-card input {
		width: 100%;
		min-height: 48px;
		padding: 0 14px;
		border: 1px solid #dfe7f1;
		border-radius: 11px;
		outline: none;
		color: #152b49;
		background: #fbfdff;
		font-size: 14px;
	}

	.account-card input:focus {
		border-color: #6ea2e5;
		box-shadow: 0 0 0 3px rgba(40, 116, 216, 0.12);
	}

	.account-button {
		display: flex;
		min-height: 48px;
		align-items: center;
		justify-content: center;
		gap: 10px;
		border: 0;
		border-radius: 11px;
		color: #fff;
		background: #2874d8;
		font: inherit;
		font-size: 13px;
		font-weight: 800;
		cursor: pointer;
	}

	.account-button:hover {
		background: #1d64c0;
	}

	.account-button-secondary {
		padding-inline: 18px;
		border: 1px solid #dfe7f1;
		color: #315476;
		background: #fff;
	}

	.account-profile {
		display: flex;
		align-items: center;
		max-width: 620px;
		margin: 0 auto;
	}

	.account-profile > div:nth-child(2) {
		flex: 1;
		min-width: 0;
	}

	.account-profile h2 {
		font-size: 18px;
	}

	.account-profile p {
		margin: 5px 0 10px;
		color: #74839a;
		font-size: 13px;
	}

	.account-avatar {
		display: grid;
		width: 48px;
		height: 48px;
		flex: 0 0 auto;
		place-items: center;
		border-radius: 50%;
		color: #2874d8;
		background: #e9f2ff;
		font-weight: 800;
	}

	.account-roles {
		display: flex;
		flex-wrap: wrap;
		gap: 7px;
	}

	.account-roles span {
		padding: 6px 9px;
		border-radius: 999px;
		color: #2764ad;
		background: #f0f6ff;
		font-size: 11px;
		font-weight: 700;
	}

	.account-manage-services {
		display: inline-flex;
		margin-top: 12px;
		color: #2874d8;
		font-size: 12px;
		font-weight: 800;
	}

	.account-alert {
		max-width: 620px;
		margin: 0 auto 16px;
		padding: 12px 15px;
		border: 1px solid #f1caca;
		border-radius: 11px;
		color: #9e3939;
		background: #fff6f6;
		font-size: 13px;
	}

	.account-note {
		max-width: 680px;
		margin: 24px auto 0;
		color: #8290a3;
		font-size: 12px;
		line-height: 1.7;
		text-align: center;
	}

	@media (max-width: 700px) {
		.account-content {
			margin-block: 46px;
		}

		.account-forms {
			grid-template-columns: 1fr;
		}

		.account-card {
			padding: 23px;
			border-radius: 18px;
		}

		.account-profile {
			align-items: flex-start;
			flex-wrap: wrap;
		}

		.account-profile form {
			width: 100%;
		}

		.account-button-secondary {
			width: 100%;
		}
	}
</style>
