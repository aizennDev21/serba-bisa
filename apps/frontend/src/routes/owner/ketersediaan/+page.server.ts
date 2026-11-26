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
type ApiResponse<T> = { data?: T; error?: { message?: string } };

function authHeaders(cookie: string | null): Record<string, string> {
	return cookie ? { cookie } : {};
}

export const load: PageServerLoad = async ({ fetch, request, url }) => {
	const saved = url.searchParams.get('saved') === '1';
	try {
		const response = await fetch(`${apiBaseUrl}/api/owner/availability`, {
			headers: authHeaders(request.headers.get('cookie'))
		});
		if (response.status === 401) throw redirect(303, '/akun');
		const body = (await response.json()) as ApiResponse<AvailabilityDay[]>;
		if (!response.ok) {
			return { days: [], dayLabels, apiError: body.error?.message ?? 'Jadwal belum dapat dimuat.', saved };
		}
		return { days: body.data ?? [], dayLabels, apiError: null, saved };
	} catch (cause) {
		if (cause instanceof Response) throw cause;
		if (!(cause instanceof TypeError)) throw cause;
		return { days: [], dayLabels, apiError: 'Tidak dapat terhubung ke layanan jadwal.', saved };
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
	}
};
