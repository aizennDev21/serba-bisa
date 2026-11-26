import { BACKEND_URL } from '$app/env/private';
import { fail, redirect, type Cookies } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const apiBaseUrl = BACKEND_URL.replace(/\/+$/, '');
const sessionCookieName = 'serba_bisa_session';
const sessionDurationSeconds = 60 * 60 * 24 * 14;

type User = {
	id: string;
	email: string;
	displayName: string;
	roles: string[];
};

type ApiResponse = {
	data?: { user?: User };
	error?: { message?: string };
};

export const load: PageServerLoad = async ({ fetch, request }) => {
	const cookie = request.headers.get('cookie');

	try {
		const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
			headers: cookie ? { cookie } : {}
		});

		if (response.status === 401) {
			return { user: null, apiError: null };
		}
		if (!response.ok) {
			const body = (await response.json()) as ApiResponse;
			return {
				user: null,
				apiError: body.error?.message ?? 'Status akun belum dapat dimuat.'
			};
		}

		const body = (await response.json()) as ApiResponse;
		return { user: body.data?.user ?? null, apiError: null };
	} catch (error) {
		if (!(error instanceof TypeError)) throw error;
		return {
			user: null,
			apiError: 'Tidak dapat terhubung ke layanan akun. Pastikan backend sedang berjalan.'
		};
	}
};

async function submitCredentials(
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	request: Request,
	endpoint: 'login' | 'register'
) {
	const formData = await request.formData();
	const payload: Record<string, string> = {};

	for (const key of ['email', 'displayName', 'password']) {
		const value = formData.get(key);
		if (typeof value === 'string') payload[key] = value;
	}

	try {
		const response = await fetch(`${apiBaseUrl}/api/auth/${endpoint}`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload)
		});
		const body = (await response.json()) as ApiResponse;

		if (!response.ok) {
			return fail(response.status, {
				error: body.error?.message ?? 'Permintaan akun tidak dapat diproses.'
			});
		}

		const sessionCookie = response.headers.get('set-cookie')?.split(';', 1)[0];
		const token = sessionCookie?.startsWith(`${sessionCookieName}=`)
			? sessionCookie.slice(sessionCookieName.length + 1)
			: '';
		if (!token) {
			throw new Error('Authentication response did not include a session cookie.');
		}

		cookies.set(sessionCookieName, token, {
			path: '/',
			httpOnly: true,
			secure: import.meta.env.PROD,
			sameSite: 'lax',
			maxAge: sessionDurationSeconds
		});
	} catch (error) {
		if (!(error instanceof TypeError)) throw error;
		return fail(503, {
			error: 'Tidak dapat terhubung ke layanan akun. Silakan coba lagi setelah backend tersedia.'
		});
	}

	throw redirect(303, '/akun');
}

export const actions: Actions = {
	register: ({ fetch, cookies, request }) =>
		submitCredentials(fetch, cookies, request, 'register'),
	login: ({ fetch, cookies, request }) =>
		submitCredentials(fetch, cookies, request, 'login'),
	logout: async ({ fetch, cookies, request }) => {
		try {
			await fetch(`${apiBaseUrl}/api/auth/logout`, {
				method: 'POST',
				headers: request.headers.get('cookie')
					? { cookie: request.headers.get('cookie')! }
					: {}
			});
		} catch (error) {
			if (!(error instanceof TypeError)) throw error;
			return fail(503, {
				error: 'Tidak dapat menghubungi layanan akun untuk mengakhiri sesi.'
			});
		}

		cookies.delete(sessionCookieName, { path: '/' });
		throw redirect(303, '/akun');
	}
};
