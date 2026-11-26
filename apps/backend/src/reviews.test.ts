import { describe, expect, test } from 'bun:test';

import { createApp } from './app';

describe('review API without a database', () => {
	const app = createApp();
	const serviceId = '00000000-0000-4000-8000-000000000101';
	const reviewId = '00000000-0000-4000-8000-000000000201';

	test('returns an explicit unavailable response for valid review creation', async () => {
		const response = await app.handle(
			new Request(`http://localhost/api/reviews/services/${serviceId}`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ rating: 5, comment: 'Pelayanan sangat membantu.' })
			})
		);

		expect(response.status).toBe(503);
		expect(await response.json()).toMatchObject({
			error: { code: 'DATABASE_UNAVAILABLE' }
		});
	});

	test('rejects invalid review ratings and comments before database access', async () => {
		const response = await app.handle(
			new Request(`http://localhost/api/reviews/services/${serviceId}`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ rating: 6, comment: 'Valid comment.' })
			})
		);

		expect(response.status).toBe(422);
	});

	test('rejects whitespace-only review comments', async () => {
		const response = await app.handle(
			new Request(`http://localhost/api/reviews/services/${serviceId}`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ rating: 5, comment: '   ' })
			})
		);

		expect(response.status).toBe(422);
	});

	test('returns an explicit unavailable response for valid provider replies', async () => {
		const response = await app.handle(
			new Request(`http://localhost/api/reviews/${reviewId}/reply`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ comment: 'Terima kasih atas masukannya.' })
			})
		);

		expect(response.status).toBe(503);
		expect(await response.json()).toMatchObject({
			error: { code: 'DATABASE_UNAVAILABLE' }
		});
	});

	test('rejects invalid reply identifiers and comments before database access', async () => {
		const response = await app.handle(
			new Request('http://localhost/api/reviews/not-a-uuid/reply', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ comment: 'Thanks.' })
			})
		);

		expect(response.status).toBe(422);
	});

	test('rejects whitespace-only replies', async () => {
		const response = await app.handle(
			new Request(`http://localhost/api/reviews/${reviewId}/reply`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ comment: '  ' })
			})
		);

		expect(response.status).toBe(422);
	});
});
