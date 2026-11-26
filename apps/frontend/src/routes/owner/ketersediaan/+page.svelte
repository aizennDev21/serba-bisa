<script lang="ts">
	import { untrack } from 'svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const startTimes = Array.from({ length: 24 }, (_, hour) => hour * 60);
	const endTimes = Array.from({ length: 24 }, (_, hour) => (hour + 1) * 60);

	function copyDays(days: PageProps['data']['days']) {
		return days.map((day) => ({
			dayOfWeek: day.dayOfWeek,
			intervals: day.intervals.map((interval) => ({ ...interval }))
		}));
	}

	let editableDays = $state(untrack(() => copyDays(data.days)));
	let exceptionIntervals = $state([{ startMinute: 480, endMinute: 540 }]);
	let exceptionIsAvailable = $state(true);

	function formatMinute(minute: number): string {
		return minute === 1440 ? '24:00' : `${String(Math.floor(minute / 60)).padStart(2, '0')}:00`;
	}

	function addInterval(intervals: { startMinute: number; endMinute: number }[]) {
		for (let startMinute = 0; startMinute <= 1380; startMinute += 60) {
			const endMinute = startMinute + 60;
			if (intervals.every((interval) => endMinute <= interval.startMinute || startMinute >= interval.endMinute)) {
				intervals.push({ startMinute, endMinute });
				return;
			}
		}
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
			<span>Atur beberapa rentang jam per hari untuk semua jasa. Zona waktu: WIB (Asia/Jakarta).</span>
		</div>
		{#if form?.error}<p class="availability-alert" role="alert">{form.error}</p>{/if}
		{#if data.saved}<p class="availability-saved" role="status">Jadwal ketersediaan berhasil disimpan.</p>{/if}
		{#if data.apiError}
			<p class="availability-alert" role="alert">{data.apiError}</p>
		{:else}
			<form class="availability-form" method="POST" action="?/save">
				<div class="availability-hours"><span>Atur beberapa rentang per hari. Setiap slot berdurasi satu jam dan jam akhir tidak termasuk.</span><span>Rentang tidak boleh saling bertumpuk. Contoh 08:00–12:00 dan 13:00–17:00 memiliki jeda satu jam.</span></div>
				{#each editableDays as day (day.dayOfWeek)}
					<fieldset class="availability-day">
						<legend>{data.dayLabels[day.dayOfWeek]}</legend>
						<input type="hidden" name={`interval-count-${day.dayOfWeek}`} value={day.intervals.length} />
						{#if day.intervals.length === 0}
							<p class="day-off">Libur — belum ada rentang waktu.</p>
						{/if}
						{#each day.intervals as interval, index (index)}
							<div class="availability-interval">
								<label>
									<span>Dari</span>
									<select name={`start-${day.dayOfWeek}-${index}`} bind:value={interval.startMinute}>
										{#each startTimes as minute}
											<option value={minute}>{formatMinute(minute)}</option>
										{/each}
									</select>
								</label>
								<label>
									<span>Sampai</span>
									<select name={`end-${day.dayOfWeek}-${index}`} bind:value={interval.endMinute}>
										{#each endTimes as minute}
											<option value={minute}>{formatMinute(minute)}</option>
										{/each}
									</select>
								</label>
								<button type="button" class="remove-interval" onclick={() => day.intervals.splice(index, 1)} aria-label={`Hapus rentang ${index + 1} ${data.dayLabels[day.dayOfWeek]}`}>Hapus</button>
							</div>
						{/each}
						<button type="button" class="add-interval" onclick={() => addInterval(day.intervals)} disabled={day.intervals.length >= 24}>+ Tambah rentang</button>
					</fieldset>
				{/each}
				<button type="submit">Simpan jadwal</button>
			</form>
			<section class="availability-exceptions">
				<div class="availability-heading">
					<p>Jadwal khusus</p>
					<h2>Pengecualian tanggal</h2>
					<span>Tandai hari libur atau atur jam berbeda dari jadwal mingguan. Berlaku untuk semua jasa.</span>
				</div>
				{#if form?.exceptionError}<p class="availability-alert" role="alert">{form.exceptionError}</p>{/if}
				<form class="availability-form exception-form" method="POST" action="?/saveException">
					<label>
						<span>Tanggal (WIB)</span>
						<input type="date" name="date" min={data.minimumExceptionDate} required />
					</label>
					<label>
						<span>Status</span>
						<select name="isAvailable" bind:value={exceptionIsAvailable}>
							<option value={false}>Libur</option>
							<option value={true}>Tersedia dengan jam khusus</option>
						</select>
					</label>
					<input type="hidden" name="intervalCount" value={exceptionIsAvailable ? exceptionIntervals.length : 0} />
					{#if exceptionIsAvailable}
						<div class="exception-intervals">
							{#each exceptionIntervals as interval, index (index)}
								<div class="availability-interval">
									<label>
										<span>Dari</span>
										<select name={`exceptionStart-${index}`} bind:value={interval.startMinute}>
											{#each startTimes as minute}
												<option value={minute}>{formatMinute(minute)}</option>
											{/each}
										</select>
									</label>
									<label>
										<span>Sampai</span>
										<select name={`exceptionEnd-${index}`} bind:value={interval.endMinute}>
											{#each endTimes as minute}
												<option value={minute}>{formatMinute(minute)}</option>
											{/each}
										</select>
									</label>
									<button type="button" class="remove-interval" onclick={() => exceptionIntervals.splice(index, 1)} aria-label={`Hapus rentang pengecualian ${index + 1}`}>Hapus</button>
								</div>
							{/each}
							<button type="button" class="add-interval" onclick={() => addInterval(exceptionIntervals)} disabled={exceptionIntervals.length >= 24}>+ Tambah rentang</button>
						</div>
					{/if}
					<p class="exception-hint">Jam khusus menggantikan jadwal mingguan pada tanggal tersebut. Rentang tidak boleh bertumpuk.</p>
					<button type="submit">Simpan tanggal khusus</button>
				</form>
				{#if data.exceptions.length}
					<div class="exception-list">
						{#each data.exceptions as exception (exception.date)}
							<article class="exception-item">
								<div>
									<strong>{new Intl.DateTimeFormat('id-ID', { dateStyle: 'full', timeZone: 'Asia/Jakarta' }).format(new Date(`${exception.date}T12:00:00+07:00`))}</strong>
									<span>{exception.isAvailable ? exception.intervals.map(({ startMinute, endMinute }) => `${formatMinute(startMinute)}–${formatMinute(endMinute)}`).join(', ') + ' WIB' : 'Libur'}</span>
								</div>
								<form method="POST" action="?/deleteException">
									<input type="hidden" name="date" value={exception.date} />
									<button type="submit" aria-label={`Hapus pengecualian ${exception.date}`}>Hapus</button>
								</form>
							</article>
						{/each}
					</div>
				{:else}
					<p class="exception-empty">Belum ada pengecualian tanggal mendatang.</p>
				{/if}
			</section>
		{/if}
	</section>
</main>

<style>
	.availability-page{min-height:100vh;background:#f6f9fe;color:#152b49}.availability-header{height:70px;padding:0 max(20px,calc((100% - 1000px)/2));display:flex;align-items:center;justify-content:space-between;background:#fff;border-bottom:1px solid #e8edf4}.availability-brand{font:700 19px Poppins,sans-serif;color:#2874d8}.availability-brand span{color:#152b49}.availability-header nav{display:flex;gap:20px;font-size:12px;font-weight:700;color:#526984}.availability-content{width:min(760px,calc(100% - 32px));margin:38px auto}.availability-heading>p{margin:0 0 7px;color:#2874d8;font-size:10px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase}.availability-heading h1{margin:0;font:700 30px Poppins,sans-serif}.availability-heading h2{margin:0;font:700 23px Poppins,sans-serif}.availability-heading>span{display:block;margin-top:7px;color:#78889b;font-size:12px}.availability-form{display:grid;gap:10px;margin-top:22px}.availability-hours{display:grid;gap:5px;padding:13px;border-radius:10px;background:#eaf3ff;color:#526984;font-size:10px;line-height:1.5}.availability-day{display:grid;gap:10px;padding:14px;border:1px solid #e3eaf3;border-radius:12px;background:#fff}.availability-day legend{padding:0 5px;color:#152b49;font:600 12px Poppins,sans-serif}.availability-day label,.exception-form>label{display:grid;gap:5px;color:#78889b;font-size:10px}.availability-day select,.exception-form select,.exception-form input{min-width:0;padding:9px;border:1px solid #dfe7f0;border-radius:8px;background:#fff;color:#405873;font:inherit;font-size:11px}.availability-interval{display:grid;grid-template-columns:1fr 1fr auto;align-items:end;gap:8px;padding:10px;border:1px solid #e9eef5;border-radius:9px}.availability-interval label{display:grid;gap:5px;color:#78889b;font-size:10px}.add-interval,.remove-interval{justify-self:start;padding:8px 10px;border:1px solid #dce8f7;border-radius:8px;background:#f8fbff;color:#2874d8;font-size:10px;font-weight:700;cursor:pointer}.remove-interval{background:#fff;color:#9e3939;border-color:#efd6d6}.add-interval:disabled{opacity:.5;cursor:not-allowed}.day-off,.exception-hint{margin:0;color:#78889b;font-size:10px}.availability-form>button,.exception-item button{justify-self:start;padding:11px 16px;border:0;border-radius:9px;background:#2874d8;color:#fff;font-size:11px;font-weight:800;cursor:pointer}.availability-alert{padding:13px;border:1px solid #f1caca;border-radius:12px;background:#fff6f6;color:#9e3939;font-size:12px}.availability-saved{padding:13px;border:1px solid #cce8d4;border-radius:12px;background:#f1fbf3;color:#237342;font-size:12px}.availability-exceptions{display:grid;gap:12px;margin-top:42px;padding-top:30px;border-top:1px solid #dfe7f0}.exception-form{grid-template-columns:repeat(2,minmax(0,1fr));padding:16px;border:1px solid #e3eaf3;border-radius:12px;background:#fff}.exception-hint{grid-column:1/-1}.exception-intervals{grid-column:1/-1;display:grid;gap:8px}.exception-intervals .availability-interval{grid-template-columns:1fr 1fr auto}.exception-form>button{grid-column:1/-1}.exception-list{display:grid;gap:8px}.exception-item{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 15px;border:1px solid #e3eaf3;border-radius:10px;background:#fff}.exception-item>div{display:grid;gap:4px}.exception-item strong{font-size:11px}.exception-item span,.exception-empty{color:#78889b;font-size:10px}.exception-item form{margin:0}.exception-item button{padding:8px 11px;background:#fff;color:#9e3939;border:1px solid #efd6d6}
	@media(max-width:600px){.availability-interval{grid-template-columns:1fr 1fr}.availability-interval .remove-interval{grid-column:1/-1}.exception-form{grid-template-columns:1fr}.availability-heading h1{font-size:25px}}
</style>
