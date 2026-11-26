import { BACKEND_URL } from '$app/env/private';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const apiBaseUrl = BACKEND_URL.replace(/\/+$/, '');

type ModeratedService = {
	id: string;
	title: string;
	description: string;
	category: string;
	status: 'draft' | 'active' | 'unavailable' | 'suspended';
	statusBeforeSuspension: string | null;
	location: string;
	ownerName: string;
	ownerEmail: string;
};

type ApiResponse = {
	data?: ModeratedService[];
	error?: { message?: string };
};

function cookieHeaders(cookie: string | null): Record<string, string> {
	return cookie ? { cookie } : {};
}

function errorMessage(body: ApiResponse, status: number): string {
	return body.error?.message ?? `Permintaan moderasi gagal (HTTP ${status}).`;
}

export const load: PageServerLoad = async ({ fetch, request }) => {
	const headers = cookieHeaders(request.headers.get('cookie'));
	try {
		const accountResponse = await fetch(`${apiBaseUrl}/api/auth/me`, { headers });
		if (accountResponse.status === 401) throw redirect(303, '/akun');
		if (!accountResponse.ok) {
			return { services: [], apiError: 'Status akun belum dapat diverifikasi.' };
		}

		const account = (await accountResponse.json()) as {
			data?: { user?: { displayName: string; roles: string[] } };
		};
		const user = account.data?.user;
		if (!user?.roles.some((role) => role === 'admin' || role === 'super_admin')) {
			return {
				services: [],
				apiError: 'Halaman ini hanya untuk admin dan super admin.',
				forbidden: true
			};
		}

		const response = await fetch(`${apiBaseUrl}/api/admin/services`, { headers });
		const body = (await response.json()) as ApiResponse;
		if (!response.ok) {
			return { services: [], apiError: errorMessage(body, response.status), forbidden: response.status === 403 };
		}
		return { services: body.data ?? [], apiError: null, moderatorName: user.displayName, forbidden: false };
	} catch (error) {
		if (error && typeof error === 'object' && 'status' in error) throw error;
		if (!(error instanceof TypeError)) throw error;
		return {
			services: [],
			apiError: 'Tidak dapat terhubung ke layanan moderasi. Pastikan backend sedang berjalan.',
			forbidden: false
		};
	}
};

export const actions: Actions = {
	moderate: async ({ fetch, request }) => {
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const action = String(form.get('action') ?? '');
		const reason = String(form.get('reason') ?? '').trim();
		if (
			!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ||
			!['approve', 'suspend', 'restore'].includes(action) ||
			reason.length < 8 ||
			reason.length > 500
		) {
			return fail(422, { error: 'Jasa, tindakan, atau alasan moderasi tidak valid.' });
		}

		try {
			const response = await fetch(`${apiBaseUrl}/api/admin/services/${id}/moderate`, {
				method: 'POST',
				headers: {
					...cookieHeaders(request.headers.get('cookie')),
					'content-type': 'application/json'
				},
				body: JSON.stringify({ action, reason })
			});
			const body = (await response.json()) as ApiResponse;
			if (!response.ok) return fail(response.status, { error: errorMessage(body, response.status) });
		} catch (error) {
			if (!(error instanceof TypeError)) throw error;
			return fail(503, { error: 'Tidak dapat menghubungi backend moderasi. Silakan coba lagi.' });
		}

		throw redirect(303, '/admin/jasa');
	}
};
