import { BACKEND_URL } from '$app/env/private';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import type { ServiceDetail } from '../../../lib/services';

const apiBaseUrl = BACKEND_URL.replace(/\/+$/, '');

type ServiceResponse = { data: ServiceDetail };
type ApiErrorResponse = { error?: { message?: string } };

function cookieHeaders(cookie: string | null): Record<string, string> {
	return cookie ? { cookie } : {};
}

function getErrorMessage(body: ApiErrorResponse, status: number): string {
	return body.error?.message ?? `Permintaan gagal (HTTP ${status}).`;
}

export const load: PageServerLoad = async ({ fetch, params, request }) => {
	try {
		const response = await fetch(`${apiBaseUrl}/api/services/${encodeURIComponent(params.id)}`, {
			headers: cookieHeaders(request.headers.get('cookie'))
		});

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
		if (cause instanceof Response) throw cause;
		if (!(cause instanceof TypeError)) throw cause;

		return {
			service: null,
			apiError: 'Tidak dapat terhubung ke server katalog. Pastikan backend sedang berjalan.'
		};
	}
};

async function postReviewAction(
	fetch: typeof globalThis.fetch,
	request: Request,
	serviceId: string
) {
	const form = await request.formData();
	const rating = Number(form.get('rating'));
	const comment = String(form.get('comment') ?? '').trim();
	if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
		return fail(422, { reviewError: 'Pilih rating dari 1 sampai 5.' });
	}
	if (comment.length < 3 || comment.length > 2000) {
		return fail(422, { reviewError: 'Komentar ulasan harus terdiri dari 3–2.000 karakter.' });
	}

	try {
		const response = await fetch(
			`${apiBaseUrl}/api/reviews/services/${encodeURIComponent(serviceId)}`,
			{
				method: 'POST',
				headers: {
					...cookieHeaders(request.headers.get('cookie')),
					'content-type': 'application/json'
				},
				body: JSON.stringify({ rating, comment })
			}
		);
		if (!response.ok) {
			const body = (await response.json()) as ApiErrorResponse;
			return fail(response.status, { reviewError: getErrorMessage(body, response.status) });
		}
	} catch (cause) {
		if (!(cause instanceof TypeError)) throw cause;
		return fail(503, { reviewError: 'Tidak dapat menghubungi backend ulasan. Silakan coba lagi.' });
	}

	throw redirect(303, `/jasa/${encodeURIComponent(serviceId)}?review=sent#ulasan`);
}

async function postReplyAction(
	fetch: typeof globalThis.fetch,
	request: Request,
	serviceId: string
) {
	const form = await request.formData();
	const reviewId = String(form.get('reviewId') ?? '');
	const comment = String(form.get('comment') ?? '').trim();
	if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reviewId)) {
		return fail(422, { replyId: reviewId, replyError: 'ID ulasan tidak valid.' });
	}
	if (comment.length < 2 || comment.length > 2000) {
		return fail(422, { replyId: reviewId, replyError: 'Balasan harus terdiri dari 2–2.000 karakter.' });
	}

	try {
		const response = await fetch(
			`${apiBaseUrl}/api/reviews/${encodeURIComponent(reviewId)}/reply`,
			{
				method: 'POST',
				headers: {
					...cookieHeaders(request.headers.get('cookie')),
					'content-type': 'application/json'
				},
				body: JSON.stringify({ comment })
			}
		);
		if (!response.ok) {
			const body = (await response.json()) as ApiErrorResponse;
			return fail(response.status, {
				replyId: reviewId,
				replyError: getErrorMessage(body, response.status)
			});
		}
	} catch (cause) {
		if (!(cause instanceof TypeError)) throw cause;
		return fail(503, {
			replyId: reviewId,
			replyError: 'Tidak dapat menghubungi backend ulasan. Silakan coba lagi.'
		});
	}

	throw redirect(303, `/jasa/${encodeURIComponent(serviceId)}?reply=sent#ulasan`);
}

async function postBookingAction(
	fetch: typeof globalThis.fetch,
	request: Request,
	serviceId: string
) {
	const form = await request.formData();
	const requestMessage = String(form.get('requestMessage') ?? '').trim();
	const requestedLocation = String(form.get('requestedLocation') ?? '').trim();
	const requestedAtInput = String(form.get('requestedAt') ?? '').trim();
	if (requestMessage.length < 20 || requestMessage.length > 2000) {
		return fail(422, { bookingError: 'Detail permintaan harus terdiri dari 20–2.000 karakter.' });
	}
	if (requestedLocation.length > 200) {
		return fail(422, { bookingError: 'Lokasi maksimal 200 karakter.' });
	}
	const requestedAt = requestedAtInput ? new Date(requestedAtInput) : null;
	if (requestedAt && (!Number.isFinite(requestedAt.getTime()) || requestedAt.getTime() <= Date.now())) {
		return fail(422, { bookingError: 'Pilih jadwal yang berada di masa depan.' });
	}

	try {
		const response = await fetch(`${apiBaseUrl}/api/bookings`, {
			method: 'POST',
			headers: {
				...cookieHeaders(request.headers.get('cookie')),
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				serviceId,
				requestMessage,
				requestedLocation: requestedLocation || undefined,
				requestedAt: requestedAt?.toISOString()
			})
		});
		if (!response.ok) {
			const body = (await response.json()) as ApiErrorResponse;
			return fail(response.status, { bookingError: getErrorMessage(body, response.status) });
		}
	} catch (cause) {
		if (!(cause instanceof TypeError)) throw cause;
		return fail(503, { bookingError: 'Tidak dapat menghubungi layanan pemesanan. Silakan coba lagi.' });
	}

	throw redirect(303, '/pesanan?booking=created');
}

export const actions: Actions = {
	review: ({ fetch, request, params }) => postReviewAction(fetch, request, params.id),
	reply: ({ fetch, request, params }) => postReplyAction(fetch, request, params.id),
	booking: ({ fetch, request, params }) => postBookingAction(fetch, request, params.id),
	chat: async ({ fetch, request, params }) => {
		try {
			const response = await fetch(
				`${apiBaseUrl}/api/chat/services/${encodeURIComponent(params.id)}/conversations`,
				{ method: 'POST', headers: cookieHeaders(request.headers.get('cookie')) }
			);
			const body = (await response.json()) as {
				data?: { id: string };
				error?: { message?: string };
			};
			if (!response.ok || !body.data) {
				return fail(response.status, {
					chatError: body.error?.message ?? 'Percakapan tidak dapat dimulai.'
				});
			}
			throw redirect(303, `/chat/${body.data.id}`);
		} catch (cause) {
			if (cause instanceof Response) throw cause;
			if (!(cause instanceof TypeError)) throw cause;
			return fail(503, { chatError: 'Tidak dapat menghubungi layanan chat. Silakan coba lagi.' });
		}
	}
};
