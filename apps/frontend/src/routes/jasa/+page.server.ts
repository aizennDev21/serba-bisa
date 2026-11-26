import { BACKEND_URL } from '$app/env/private';
import type { PageServerLoad } from './$types';

import type { ServiceListResponse } from '../../lib/services';

type CategoryResponse = { data: string[] };
type ApiErrorResponse = { error?: { message?: string } };

function getApiBaseUrl(): string {
	return BACKEND_URL.replace(/\/+$/, '');
}

function pageHref(filters: { q: string; category: string; location: string }, page: number): string {
	const params = new URLSearchParams();
	if (filters.q) params.set('q', filters.q);
	if (filters.category) params.set('category', filters.category);
	if (filters.location) params.set('location', filters.location);
	params.set('page', String(page));
	return `/jasa?${params.toString()}`;
}

export const load: PageServerLoad = async ({ fetch, url }) => {
	const filters = {
		q: url.searchParams.get('q')?.trim() ?? '',
		category: url.searchParams.get('category')?.trim() ?? '',
		location: url.searchParams.get('location')?.trim() ?? ''
	};
	const requestedPage = Number(url.searchParams.get('page') ?? '1');
	const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
	const query = new URLSearchParams({ page: String(page), limit: '12' });

	for (const [key, value] of Object.entries(filters)) {
		if (value) query.set(key, value);
	}

	try {
		const [listingResponse, categoryResponse] = await Promise.all([
			fetch(`${getApiBaseUrl()}/api/services?${query.toString()}`),
			fetch(`${getApiBaseUrl()}/api/services/categories`)
		]);

		if (!listingResponse.ok) {
			const body = (await listingResponse.json()) as ApiErrorResponse;
			return {
				filters,
				listings: [],
				categories: filters.category ? [filters.category] : [],
				pagination: null,
				apiError:
					body.error?.message ??
					`Katalog belum dapat dimuat (HTTP ${listingResponse.status}). Silakan coba lagi nanti.`,
				previousHref: null,
				nextHref: null
			};
		}

		const result = (await listingResponse.json()) as ServiceListResponse;
		let categories: string[] = [];
		let categoriesError: string | null = null;

		if (categoryResponse.ok) {
			const categoryResult = (await categoryResponse.json()) as CategoryResponse;
			categories = categoryResult.data;
		} else {
			categoriesError = `Filter kategori belum dapat dimuat (HTTP ${categoryResponse.status}).`;
		}

		if (filters.category && !categories.includes(filters.category)) {
			categories = [...categories, filters.category];
		}

		return {
			filters,
			listings: result.data,
			categories,
			pagination: result.pagination,
			apiError: categoriesError,
			previousHref:
				result.pagination.page > 1
					? pageHref(filters, result.pagination.page - 1)
					: null,
			nextHref:
				result.pagination.page < result.pagination.totalPages
					? pageHref(filters, result.pagination.page + 1)
					: null
		};
	} catch (error) {
		if (!(error instanceof TypeError)) {
			throw error;
		}

		return {
			filters,
			listings: [],
			categories: [],
			pagination: null,
			apiError: 'Tidak dapat terhubung ke server katalog. Pastikan backend sedang berjalan.',
			previousHref: null,
			nextHref: null
		};
	}
};
