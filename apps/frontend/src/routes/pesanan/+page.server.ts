import { BACKEND_URL } from '$app/env/private';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const apiBaseUrl = BACKEND_URL.replace(/\/+$/, '');
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const allowedStatuses = new Set(['accepted', 'declined', 'cancelled', 'completed']);

type Booking = {
	id: string;
	serviceId: string;
	serviceTitle: string;
	price: number;
	priceUnit: 'hour' | 'visit' | 'project' | 'session' | 'fixed';
	requestMessage: string;
	requestedAt: string | null;
	requestedLocation: string | null;
	status: 'requested' | 'accepted' | 'declined' | 'cancelled' | 'completed';
	statusReason: string | null;
	createdAt: string;
	updatedAt: string;
	seekerName: string;
	ownerName: string;
	viewerRole: 'seeker' | 'provider';
};

type ApiResponse<T> = { data?: T; error?: { message?: string } };

function authHeaders(cookie: string | null): Record<string, string> {
	return cookie ? { cookie } : {};
}

export const load: PageServerLoad = async ({ fetch, request }) => {
	try {
		const response = await fetch(`${apiBaseUrl}/api/bookings`, {
			headers: authHeaders(request.headers.get('cookie'))
		});
		if (response.status === 401) throw redirect(303, '/akun');
		const body = (await response.json()) as ApiResponse<Booking[]>;
		if (!response.ok) return { bookings: [], apiError: body.error?.message ?? 'Daftar pesanan belum tersedia.' };
		return { bookings: body.data ?? [], apiError: null };
	} catch (cause) {
		if (cause instanceof Response) throw cause;
		if (!(cause instanceof TypeError)) throw cause;
		return { bookings: [], apiError: 'Tidak dapat terhubung ke layanan pemesanan.' };
	}
};

export const actions: Actions = {
	transition: async ({ fetch, request }) => {
		const form = await request.formData();
		const bookingId = String(form.get('bookingId') ?? '');
		const status = String(form.get('status') ?? '');
		const reason = String(form.get('reason') ?? '').trim();
		if (!uuidPattern.test(bookingId) || !allowedStatuses.has(status)) {
			return fail(422, { error: 'ID atau perubahan status pesanan tidak valid.' });
		}
		if ((status === 'declined' || status === 'cancelled') && (reason.length < 8 || reason.length > 500)) {
			return fail(422, { error: 'Alasan penolakan atau pembatalan harus terdiri dari 8–500 karakter.' });
		}

		try {
			const response = await fetch(`${apiBaseUrl}/api/bookings/${bookingId}/status`, {
				method: 'PATCH',
				headers: {
					...authHeaders(request.headers.get('cookie')),
					'content-type': 'application/json'
				},
				body: JSON.stringify({ status, reason: reason || undefined })
			});
			const body = (await response.json()) as ApiResponse<unknown>;
			if (!response.ok) {
				return fail(response.status, { error: body.error?.message ?? 'Status pesanan tidak dapat diperbarui.' });
			}
		} catch (cause) {
			if (!(cause instanceof TypeError)) throw cause;
			return fail(503, { error: 'Tidak dapat menghubungi layanan pemesanan.' });
		}
		throw redirect(303, '/pesanan');
	}
};
