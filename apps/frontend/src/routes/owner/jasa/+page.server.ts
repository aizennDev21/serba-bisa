import { BACKEND_URL } from '$app/env/private';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const apiBaseUrl = BACKEND_URL.replace(/\/+$/, '');

type ProviderService = {
	id: string;
	title: string;
	description: string;
	category: string;
	price: number;
	priceUnit: 'hour' | 'visit' | 'project' | 'session' | 'fixed';
	status: 'draft' | 'active' | 'unavailable' | 'suspended' | 'archived';
	location: string;
};

type ApiResponse = {
	data?: ProviderService[] | ProviderService;
	error?: { message?: string };
};

function cookieHeader(cookie: string | null): Record<string, string> {
	return cookie ? { cookie } : {};
}

function getErrorMessage(body: ApiResponse, status: number): string {
	return body.error?.message ?? `Permintaan tidak dapat diproses (HTTP ${status}).`;
}

export const load: PageServerLoad = async ({ fetch, request }) => {
	const headers = cookieHeader(request.headers.get('cookie'));

	try {
		const accountResponse = await fetch(`${apiBaseUrl}/api/auth/me`, { headers });
		if (accountResponse.status === 401) throw redirect(303, '/akun');
		if (!accountResponse.ok) {
			const body = (await accountResponse.json()) as ApiResponse;
			return { services: [], apiError: getErrorMessage(body, accountResponse.status) };
		}

		const [listResponse, account] = await Promise.all([
			fetch(`${apiBaseUrl}/api/owner/services`, { headers }),
			accountResponse.json()
		]);

		if (!listResponse.ok) {
			const body = (await listResponse.json()) as ApiResponse;
			return { services: [], apiError: getErrorMessage(body, listResponse.status) };
		}

		const body = (await listResponse.json()) as ApiResponse;
		return {
			services: (body.data as ProviderService[] | undefined) ?? [],
			account: (account as { data?: { user?: { displayName: string } } }).data?.user ?? null,
			apiError: null
		};
	} catch (error) {
		if (error && typeof error === 'object' && 'status' in error) throw error;
		if (!(error instanceof TypeError)) throw error;
		return {
			services: [],
			account: null,
			apiError: 'Tidak dapat terhubung ke layanan jasa. Pastikan backend sedang berjalan.'
		};
	}
};

async function submitService(
	fetch: typeof globalThis.fetch,
	request: Request,
	endpoint: 'create' | 'update'
) {
	const form = await request.formData();
	const price = Number(form.get('price'));
	if (!Number.isInteger(price) || price < 0 || price > 100_000_000) {
		return fail(422, { error: 'Harga harus berupa bilangan bulat antara 0 dan 100.000.000.' });
	}

	const payload = {
		title: String(form.get('title') ?? ''),
		description: String(form.get('description') ?? ''),
		category: String(form.get('category') ?? ''),
		price,
		priceUnit: String(form.get('priceUnit') ?? ''),
		location: String(form.get('location') ?? ''),
		...(endpoint === 'update' ? { status: String(form.get('status') ?? 'draft') } : {})
	};
	const id = String(form.get('id') ?? '');
	const path = endpoint === 'create'
		? `${apiBaseUrl}/api/owner/services`
		: `${apiBaseUrl}/api/owner/services/${encodeURIComponent(id)}`;

	try {
		const response = await fetch(path, {
			method: endpoint === 'create' ? 'POST' : 'PATCH',
			headers: {
				cookie: request.headers.get('cookie') ?? '',
				'content-type': 'application/json'
			},
			body: JSON.stringify(payload)
		});
		const body = (await response.json()) as ApiResponse;
		if (!response.ok) return fail(response.status, { error: getErrorMessage(body, response.status) });
	} catch (error) {
		if (!(error instanceof TypeError)) throw error;
		return fail(503, { error: 'Tidak dapat menghubungi backend jasa. Silakan coba lagi.' });
	}

	throw redirect(303, '/owner/jasa');
}

export const actions: Actions = {
	create: ({ fetch, request }) => submitService(fetch, request, 'create'),
	update: ({ fetch, request }) => submitService(fetch, request, 'update'),
	archive: async ({ fetch, request }) => {
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
			return fail(422, { error: 'ID jasa tidak valid.' });
		}

		try {
			const response = await fetch(`${apiBaseUrl}/api/owner/services/${id}`, {
				method: 'DELETE',
				headers: cookieHeader(request.headers.get('cookie'))
			});
			if (!response.ok) {
				const body = (await response.json()) as ApiResponse;
				return fail(response.status, { error: getErrorMessage(body, response.status) });
			}
		} catch (error) {
			if (!(error instanceof TypeError)) throw error;
			return fail(503, { error: 'Tidak dapat menghubungi backend jasa. Silakan coba lagi.' });
		}

		throw redirect(303, '/owner/jasa');
	}
};
