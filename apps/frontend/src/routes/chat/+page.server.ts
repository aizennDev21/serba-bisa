import { BACKEND_URL } from '$app/env/private';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const apiBaseUrl = BACKEND_URL.replace(/\/+$/, '');

type ChatListEntry = {
	id: string;
	serviceId: string;
	serviceTitle: string;
	otherUserName: string;
	lastMessage: string;
	updatedAt: string;
};

type ApiResponse<T> = { data?: T; error?: { message?: string } };

export const load: PageServerLoad = async ({ fetch, request }) => {
	try {
		const response = await fetch(`${apiBaseUrl}/api/chat`, {
			headers: request.headers.get('cookie')
				? { cookie: request.headers.get('cookie') as string }
				: {}
		});
		if (response.status === 401) throw redirect(303, '/akun');
		const body = (await response.json()) as ApiResponse<ChatListEntry[]>;
		if (!response.ok) return { conversations: [], apiError: body.error?.message ?? 'Daftar chat belum tersedia.' };
		return { conversations: body.data ?? [], apiError: null };
	} catch (cause) {
		if (cause instanceof Response) throw cause;
		if (!(cause instanceof TypeError)) throw cause;
		return { conversations: [], apiError: 'Tidak dapat terhubung ke layanan chat.' };
	}
};

export const actions: Actions = {
	open: async ({ fetch, request }) => {
		const form = await request.formData();
		const serviceId = String(form.get('serviceId') ?? '');
		if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(serviceId)) {
			return fail(422, { error: 'ID jasa tidak valid.' });
		}
		try {
			const response = await fetch(`${apiBaseUrl}/api/chat/services/${serviceId}/conversations`, {
				method: 'POST',
				headers: request.headers.get('cookie') ? { cookie: request.headers.get('cookie') as string } : {}
			});
			const body = (await response.json()) as ApiResponse<{ id: string }>;
			if (!response.ok || !body.data) {
				return fail(response.status, { error: body.error?.message ?? 'Chat tidak dapat dimulai.' });
			}
			throw redirect(303, `/chat/${body.data.id}`);
		} catch (cause) {
			if (cause instanceof Response) throw cause;
			if (!(cause instanceof TypeError)) throw cause;
			return fail(503, { error: 'Tidak dapat menghubungi layanan chat.' });
		}
	}
};
