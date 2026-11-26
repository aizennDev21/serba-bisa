import { BACKEND_URL } from '$app/env/private';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const apiBaseUrl = BACKEND_URL.replace(/\/+$/, '');
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Notification = {
	id: string;
	bookingId: string;
	type: 'booking_requested' | 'booking_status_changed';
	title: string;
	message: string;
	readAt: string | null;
	createdAt: string;
};

type ApiResponse<T> = { data?: T; unreadCount?: number; error?: { message?: string } };

function authHeaders(cookie: string | null): Record<string, string> {
	return cookie ? { cookie } : {};
}

export const load: PageServerLoad = async ({ fetch, request }) => {
	try {
		const response = await fetch(`${apiBaseUrl}/api/notifications`, {
			headers: authHeaders(request.headers.get('cookie'))
		});
		if (response.status === 401) throw redirect(303, '/akun');
		const body = (await response.json()) as ApiResponse<Notification[]>;
		if (!response.ok) {
			return {
				notifications: [],
				unreadCount: 0,
				eventsUrl: `${apiBaseUrl}/api/notifications/events`,
				apiError: body.error?.message ?? 'Notifikasi belum tersedia.'
			};
		}
		return {
			notifications: body.data ?? [],
			unreadCount: body.unreadCount ?? 0,
			eventsUrl: `${apiBaseUrl}/api/notifications/events`,
			apiError: null
		};
	} catch (cause) {
		if (cause instanceof Response) throw cause;
		if (!(cause instanceof TypeError)) throw cause;
		return {
			notifications: [],
			unreadCount: 0,
			eventsUrl: `${apiBaseUrl}/api/notifications/events`,
			apiError: 'Tidak dapat terhubung ke layanan notifikasi.'
		};
	}
};

export const actions: Actions = {
	read: async ({ fetch, request }) => {
		const form = await request.formData();
		const notificationId = String(form.get('notificationId') ?? '');
		if (!uuidPattern.test(notificationId)) return fail(422, { error: 'ID notifikasi tidak valid.' });
		try {
			const response = await fetch(`${apiBaseUrl}/api/notifications/${notificationId}/read`, {
				method: 'POST',
				headers: authHeaders(request.headers.get('cookie'))
			});
			const body = (await response.json()) as ApiResponse<unknown>;
			if (!response.ok) return fail(response.status, { error: body.error?.message ?? 'Notifikasi tidak dapat diperbarui.' });
		} catch (cause) {
			if (!(cause instanceof TypeError)) throw cause;
			return fail(503, { error: 'Tidak dapat menghubungi layanan notifikasi.' });
		}
		throw redirect(303, '/pesanan');
	},
	readAll: async ({ fetch, request }) => {
		try {
			const response = await fetch(`${apiBaseUrl}/api/notifications/read-all`, {
				method: 'POST',
				headers: authHeaders(request.headers.get('cookie'))
			});
			const body = (await response.json()) as ApiResponse<unknown>;
			if (!response.ok) return fail(response.status, { error: body.error?.message ?? 'Notifikasi tidak dapat diperbarui.' });
		} catch (cause) {
			if (!(cause instanceof TypeError)) throw cause;
			return fail(503, { error: 'Tidak dapat menghubungi layanan notifikasi.' });
		}
		throw redirect(303, '/notifikasi');
	}
};
