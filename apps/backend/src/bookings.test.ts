import { describe, expect, test } from 'bun:test';

import { createApp } from './app';

describe('booking API without a database', () => {
	const app = createApp();
	const bookingId = '00000000-0000-4000-8000-000000000101';
	const serviceId = '00000000-0000-4000-8000-000000000201';

	test('returns an explicit unavailable response for listing and creation', async () => {
		const list = await app.handle(new Request('http://localhost/api/bookings'));
		const create = await app.handle(
			new Request('http://localhost/api/bookings', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					serviceId,
					requestMessage: 'Saya membutuhkan layanan ini untuk membantu kebutuhan saya.'
				})
			})
		);
		expect(list.status).toBe(503);
		expect(create.status).toBe(503);
	});

	test('validates booking identifiers and required request details', async () => {
		const invalidId = await app.handle(
			new Request('http://localhost/api/bookings/not-a-uuid/status', {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ status: 'accepted' })
			})
		);
		const shortMessage = await app.handle(
			new Request('http://localhost/api/bookings', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ serviceId, requestMessage: 'Singkat' })
			})
		);
		expect(invalidId.status).toBe(422);
		expect(shortMessage.status).toBe(422);
	});

	test('returns explicit unavailable response for valid status changes', async () => {
		const response = await app.handle(
			new Request(`http://localhost/api/bookings/${bookingId}/status`, {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ status: 'accepted' })
			})
		);
		expect(response.status).toBe(503);
		expect(await response.json()).toMatchObject({
			error: { code: 'DATABASE_UNAVAILABLE' }
		});
	});
});
