import { BACKEND_URL } from '$app/env/private';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const apiBaseUrl = BACKEND_URL.replace(/\/+$/, '');
const dayLabels = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

type AvailabilityDay = {
	dayOfWeek: number;
	isAvailable: boolean;
	startMinute: number;
	endMinute: number;
};
type AvailabilityException = {
	date: string;
	isAvailable: boolean;
	startMinute: number;
	endMinute: number;
};
type ApiResponse<T> = { data?: T; error?: { message?: string } };

function authHeaders(cookie: string | null): Record<string, string> {
	return cookie ? { cookie } : {};
}

export const load: PageServerLoad = async ({ fetch, request, url }) => {
	const saved = ['saved', 'exceptionSaved'].some((key) => url.searchParams.get(key) === '1');
	try {
		const headers = authHeaders(request.headers.get('cookie'));
		const [response, exceptionsResponse] = await Promise.all([
			fetch(`${apiBaseUrl}/api/owner/availability`, { headers }),
			fetch(`${apiBaseUrl}/api/owner/availability/exceptions`, { headers })
		]);
		if (response.status === 401) throw redirect(303, '/akun');
		if (exceptionsResponse.status === 401) throw redirect(303, '/akun');
		const [body, exceptionsBody] = (await Promise.all([
			response.json(),
			exceptionsResponse.json()
		])) as [ApiResponse<AvailabilityDay[]>, ApiResponse<AvailabilityException[]>];
		if (!response.ok) {
			return {
				days: [],
				exceptions: [],
				dayLabels,
				minimumExceptionDate: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date()),
				apiError: body.error?.message ?? 'Jadwal belum dapat dimuat.',
				saved
			};
		}
		if (!exceptionsResponse.ok) {
			return {
				days: body.data ?? [],
				exceptions: [],
				dayLabels,
				minimumExceptionDate: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date()),
				apiError: exceptionsBody.error?.message ?? 'Pengecualian jadwal belum dapat dimuat.',
				saved
			};
		}
		return {
			days: body.data ?? [],
			exceptions: exceptionsBody.data ?? [],
			dayLabels,
			minimumExceptionDate: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date()),
			apiError: null,
			saved
		};
	} catch (cause) {
		if (cause instanceof Response) throw cause;
		if (!(cause instanceof TypeError)) throw cause;
		return {
			days: [],
			exceptions: [],
			dayLabels,
			minimumExceptionDate: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date()),
			apiError: 'Tidak dapat terhubung ke layanan jadwal.',
			saved
		};
	}
};

export const actions: Actions = {
	save: async ({ fetch, request }) => {
		const form = await request.formData();
		const days: AvailabilityDay[] = [];
		for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
			const startMinute = Number(form.get(`start-${dayOfWeek}`));
			const endMinute = Number(form.get(`end-${dayOfWeek}`));
			const isAvailable = form.get(`available-${dayOfWeek}`) === 'true';
			if (
				!Number.isInteger(startMinute) ||
				!Number.isInteger(endMinute) ||
				startMinute < 0 ||
				startMinute > 1380 ||
				endMinute < 60 ||
				endMinute > 1440 ||
				startMinute % 60 !== 0 ||
				endMinute % 60 !== 0 ||
				(isAvailable && endMinute <= startMinute)
			) {
				return fail(422, { error: `Rentang waktu hari ${dayLabels[dayOfWeek]} tidak valid.` });
			}
			days.push({ dayOfWeek, isAvailable, startMinute, endMinute });
		}

		try {
			const response = await fetch(`${apiBaseUrl}/api/owner/availability`, {
				method: 'PUT',
				headers: {
					...authHeaders(request.headers.get('cookie')),
					'content-type': 'application/json'
				},
				body: JSON.stringify({ days })
			});
			const body = (await response.json()) as ApiResponse<AvailabilityDay[]>;
			if (!response.ok) {
				return fail(response.status, { error: body.error?.message ?? 'Jadwal tidak dapat disimpan.' });
			}
		} catch (cause) {
			if (!(cause instanceof TypeError)) throw cause;
			return fail(503, { error: 'Tidak dapat menghubungi layanan jadwal.' });
		}
		throw redirect(303, '/owner/ketersediaan?saved=1');
	},
	saveException: async ({ fetch, request }) => {
		const form = await request.formData();
		const date = String(form.get('date') ?? '');
		const isAvailable = form.get('isAvailable') === 'true';
		const startMinute = Number(form.get('startMinute'));
		const endMinute = Number(form.get('endMinute'));
		if (
			!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
			!Number.isInteger(startMinute) ||
			!Number.isInteger(endMinute) ||
			startMinute < 0 ||
			startMinute > 1380 ||
			endMinute < 60 ||
			endMinute > 1440 ||
			startMinute % 60 !== 0 ||
			endMinute % 60 !== 0 ||
			(isAvailable && endMinute <= startMinute)
		) {
			return fail(422, { error: 'Tanggal atau rentang waktu pengecualian tidak valid.' });
		}
		try {
			const response = await fetch(`${apiBaseUrl}/api/owner/availability/exceptions`, {
				method: 'PUT',
				headers: {
					...authHeaders(request.headers.get('cookie')),
					'content-type': 'application/json'
				},
				body: JSON.stringify({ date, isAvailable, startMinute, endMinute })
			});
			const body = (await response.json()) as ApiResponse<AvailabilityException>;
			if (!response.ok) {
				return fail(response.status, {
					exceptionError: body.error?.message ?? 'Pengecualian jadwal tidak dapat disimpan.'
				});
			}
		} catch (cause) {
			if (!(cause instanceof TypeError)) throw cause;
			return fail(503, { exceptionError: 'Tidak dapat menghubungi layanan jadwal.' });
		}
		throw redirect(303, '/owner/ketersediaan?exceptionSaved=1');
	},
	deleteException: async ({ fetch, request }) => {
		const form = await request.formData();
		const date = String(form.get('date') ?? '');
		if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
			return fail(422, { exceptionError: 'Tanggal pengecualian tidak valid.' });
		}
		try {
			const response = await fetch(
				`${apiBaseUrl}/api/owner/availability/exceptions/${encodeURIComponent(date)}`,
				{
					method: 'DELETE',
					headers: authHeaders(request.headers.get('cookie'))
				}
			);
			const body = (await response.json()) as ApiResponse<{ date: string; deleted: boolean }>;
			if (!response.ok) {
				return fail(response.status, {
					exceptionError: body.error?.message ?? 'Pengecualian jadwal tidak dapat dihapus.'
				});
			}
		} catch (cause) {
			if (!(cause instanceof TypeError)) throw cause;
			return fail(503, { exceptionError: 'Tidak dapat menghubungi layanan jadwal.' });
		}
		throw redirect(303, '/owner/ketersediaan?exceptionSaved=1');
	}
};
