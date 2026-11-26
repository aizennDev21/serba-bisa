<script lang="ts">
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const startTimes = Array.from({ length: 24 }, (_, hour) => hour * 60);
	const endTimes = Array.from({ length: 24 }, (_, hour) => (hour + 1) * 60);

	function formatMinute(minute: number): string {
		return minute === 1440 ? '24:00' : `${String(Math.floor(minute / 60)).padStart(2, '0')}:00`;
	}
</script>

<svelte:head>
	<title>Jadwal ketersediaan | Serba Bisa</title>
</svelte:head>

<main class="availability-page">
	<header class="availability-header">
		<a href="/" class="availability-brand">s. serba<span>bisa</span>.</a>
		<nav aria-label="Navigasi"><a href="/owner/jasa">Jasa saya</a><a href="/pesanan">Pesanan</a><a href="/akun">Akun</a></nav>
	</header>
	<section class="availability-content">
		<div class="availability-heading">
			<p>Atur jadwal layanan</p>
			<h1>Ketersediaan mingguan</h1>
			<span>Atur satu rentang jam per hari untuk semua jasa. Zona waktu: WIB (Asia/Jakarta).</span>
		</div>
		{#if form?.error}<p class="availability-alert" role="alert">{form.error}</p>{/if}
		{#if data.saved}<p class="availability-saved" role="status">Jadwal ketersediaan berhasil disimpan.</p>{/if}
		{#if data.apiError}
			<p class="availability-alert" role="alert">{data.apiError}</p>
		{:else}
			<form class="availability-form" method="POST" action="?/save">
				<div class="availability-hours"><span>Setiap pilihan jam adalah slot satu jam. Jam akhir tidak termasuk.</span><span>Contoh 08:00–17:00 menyediakan slot terakhir mulai pukul 16:00.</span></div>
				{#each data.days as day (day.dayOfWeek)}
					<fieldset class="availability-day">
						<legend>{data.dayLabels[day.dayOfWeek]}</legend>
						<label class="availability-toggle">
							<span>Status</span>
							<select name={`available-${day.dayOfWeek}`}>
								<option value="false" selected={!day.isAvailable}>Libur</option>
								<option value="true" selected={day.isAvailable}>Tersedia</option>
							</select>
						</label>
						<label>
							<span>Dari</span>
							<select name={`start-${day.dayOfWeek}`}>
								{#each startTimes as minute}
									<option value={minute} selected={minute === day.startMinute}>{formatMinute(minute)}</option>
								{/each}
							</select>
						</label>
						<label>
							<span>Sampai</span>
							<select name={`end-${day.dayOfWeek}`}>
								{#each endTimes as minute}
									<option value={minute} selected={minute === day.endMinute}>{formatMinute(minute)}</option>
								{/each}
							</select>
						</label>
					</fieldset>
				{/each}
				<button type="submit">Simpan jadwal</button>
			</form>
		{/if}
	</section>
</main>

<style>
	.availability-page{min-height:100vh;background:#f6f9fe;color:#152b49}.availability-header{height:70px;padding:0 max(20px,calc((100% - 1000px)/2));display:flex;align-items:center;justify-content:space-between;background:#fff;border-bottom:1px solid #e8edf4}.availability-brand{font:700 19px Poppins,sans-serif;color:#2874d8}.availability-brand span{color:#152b49}.availability-header nav{display:flex;gap:20px;font-size:12px;font-weight:700;color:#526984}.availability-content{width:min(760px,calc(100% - 32px));margin:38px auto}.availability-heading>p{margin:0 0 7px;color:#2874d8;font-size:10px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase}.availability-heading h1{margin:0;font:700 30px Poppins,sans-serif}.availability-heading>span{display:block;margin-top:7px;color:#78889b;font-size:12px}.availability-form{display:grid;gap:10px;margin-top:22px}.availability-hours{display:grid;gap:5px;padding:13px;border-radius:10px;background:#eaf3ff;color:#526984;font-size:10px;line-height:1.5}.availability-day{display:grid;grid-template-columns:1fr repeat(3,minmax(100px,150px));align-items:end;gap:10px;padding:14px;border:1px solid #e3eaf3;border-radius:12px;background:#fff}.availability-day legend{padding:0 5px;color:#152b49;font:600 12px Poppins,sans-serif}.availability-day label{display:grid;gap:5px;color:#78889b;font-size:10px}.availability-day select{min-width:0;padding:9px;border:1px solid #dfe7f0;border-radius:8px;background:#fff;color:#405873;font:inherit;font-size:11px}.availability-form>button{justify-self:start;padding:11px 16px;border:0;border-radius:9px;background:#2874d8;color:#fff;font-size:11px;font-weight:800;cursor:pointer}.availability-alert{padding:13px;border:1px solid #f1caca;border-radius:12px;background:#fff6f6;color:#9e3939;font-size:12px}.availability-saved{padding:13px;border:1px solid #cce8d4;border-radius:12px;background:#f1fbf3;color:#237342;font-size:12px}
	@media(max-width:600px){.availability-day{grid-template-columns:1fr 1fr}.availability-day legend{grid-column:1/-1}.availability-toggle{grid-column:1/-1}.availability-heading h1{font-size:25px}}
</style>
