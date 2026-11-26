import { BACKEND_URL } from '$app/env/private';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const apiBaseUrl = BACKEND_URL.replace(/\/+$/, '');
const eventsBaseUrl = BACKEND_URL.replace(/\/+$/, '');

type ApiResponse<T> = { data?: T; error?: { message?: string } };
type Message = {
	id: string;
	senderId: string;
	senderName: string;
	content: string;
	createdAt: string;
};

function cookieHeaders(cookie: string | null): Record<string, string> {
	return cookie ? { cookie } : {};
}

export const load: PageServerLoad = async ({ fetch, params, request }) => {
	const headers = cookieHeaders(request.headers.get('cookie'));
	try {
		const [conversationResponse, messagesResponse, accountResponse] = await Promise.all([
			fetch(`${apiBaseUrl}/api/chat/${params.conversationId}`, { headers }),
			fetch(`${apiBaseUrl}/api/chat/${params.conversationId}/messages`, { headers }),
			fetch(`${apiBaseUrl}/api/auth/me`, { headers })
		]);
		if (accountResponse.status === 401) throw redirect(303, '/akun');
		if (conversationResponse.status === 404 || conversationResponse.status === 422) {
			error(404, 'Percakapan tidak ditemukan.');
		}
		if (!conversationResponse.ok || !messagesResponse.ok || !accountResponse.ok) {
			const body = (await conversationResponse.json()) as ApiResponse<unknown>;
			return {
				conversation: null,
				messages: [],
				viewerId: '',
				eventsUrl: '',
				apiError: body.error?.message ?? 'Percakapan belum dapat dimuat.'
			};
		}
		const [conversation, messages, account] = (await Promise.all([
			conversationResponse.json(),
			messagesResponse.json(),
			accountResponse.json()
		])) as [
			ApiResponse<{ id: string; serviceId: string; serviceTitle: string; otherUserName: string }>,
			ApiResponse<Message[]>,
			{ data?: { user?: { id: string } } }
		];
		if (!conversation.data) error(404, 'Percakapan tidak ditemukan.');
		return {
			conversation: conversation.data,
			messages: messages.data ?? [],
			viewerId: account.data?.user?.id ?? '',
			eventsUrl: `${eventsBaseUrl}/api/chat/${params.conversationId}/events`,
			apiError: null
		};
	} catch (cause) {
		if (cause instanceof Response) throw cause;
		if (!(cause instanceof TypeError)) throw cause;
		return {
			conversation: null,
			messages: [],
			viewerId: '',
			eventsUrl: '',
			apiError: 'Tidak dapat terhubung ke layanan chat.'
		};
	}
};

export const actions: Actions = {
	send: async ({ fetch, params, request }) => {
		const form = await request.formData();
		const content = String(form.get('content') ?? '').trim();
		if (content.length < 1 || content.length > 4000) {
			return fail(422, { error: 'Pesan harus terdiri dari 1–4.000 karakter.' });
		}
		try {
			const response = await fetch(`${apiBaseUrl}/api/chat/${params.conversationId}/messages`, {
				method: 'POST',
				headers: {
					...cookieHeaders(request.headers.get('cookie')),
					'content-type': 'application/json'
				},
				body: JSON.stringify({ content })
			});
			const body = (await response.json()) as ApiResponse<Message>;
			if (!response.ok) return fail(response.status, { error: body.error?.message ?? 'Pesan gagal dikirim.' });
		} catch (cause) {
			if (!(cause instanceof TypeError)) throw cause;
			return fail(503, { error: 'Tidak dapat menghubungi layanan chat.' });
		}
		throw redirect(303, `/chat/${params.conversationId}`);
	}
};
