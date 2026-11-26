import { error } from '@sveltejs/kit';
import { BACKEND_URL } from '$app/env/private';
import type { PageServerLoad } from './$types';

import type { ServiceDetail } from '../../../lib/services';

type ServiceResponse = { data: ServiceDetail };
type ApiErrorResponse = { error?: { message?: string } };

export const load: PageServerLoad = async ({ fetch, params }) => {
	const apiBaseUrl = BACKEND_URL.replace(/\/+$/, '');

	try {
		const response = await fetch(`${apiBaseUrl}/api/services/${encodeURIComponent(params.id)}`);

		if (response.status === 404 || response.status === 422) {
			error(404, 'Jasa yang kamu cari tidak ditemukan.');
		}

		if (!response.ok) {
			const body = (await response.json()) as ApiErrorResponse;
			return {
				service: null,
				apiError:
					body.error?.message ??
					`Detail jasa belum dapat dimuat (HTTP ${response.status}). Silakan coba lagi nanti.`
			};
		}

		const result = (await response.json()) as ServiceResponse;
		return { service: result.data, apiError: null };
	} catch (cause) {
		if (cause instanceof Response) {
			throw cause;
		}

		if (!(cause instanceof TypeError)) {
			throw cause;
		}

		return {
			service: null,
			apiError: 'Tidak dapat terhubung ke server katalog. Pastikan backend sedang berjalan.'
		};
	}
};
