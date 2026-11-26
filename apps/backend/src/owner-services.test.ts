import { describe, expect, test } from 'bun:test';

import { createApp } from './app';

describe('owner service API without a database', () => {
	const app = createApp();

	test('returns an explicit unavailable response for owner listings', async () => {
		const response = await app.handle(new Request('http://localhost/api/owner/services'));

		expect(response.status).toBe(503);
		expect(await response.json()).toMatchObject({
			error: { code: 'DATABASE_UNAVAILABLE' }
		});
	});

	test('rejects invalid service fields before attempting creation', async () => {
		const response = await app.handle(
			new Request('http://localhost/api/owner/services', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					title: 'ab',
					description: 'too short',
					category: 'x',
					price: -1,
					priceUnit: 'unknown',
					location: ''
				})
			})
		);

		expect(response.status).toBe(422);
	});

	test('returns an explicit unavailable response for valid owner service creation', async () => {
		const response = await app.handle(
			new Request('http://localhost/api/owner/services', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					title: 'Servis laptop',
					description: 'Pemeriksaan dan perbaikan perangkat laptop dengan detail.',
					category: 'Teknologi',
					price: 100000,
					priceUnit: 'visit',
					location: 'Jakarta'
				})
			})
		);

		expect(response.status).toBe(503);
	});
});
