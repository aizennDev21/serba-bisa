import { describe, expect, test } from 'bun:test';

import { createApp } from './app';

describe('public service API', () => {
	const app = createApp();

	test('returns a clear service-unavailable response when the database is not configured', async () => {
		const response = await app.handle(new Request('http://localhost/api/services'));

		expect(response.status).toBe(503);
		expect(await response.json()).toEqual({
			error: {
				code: 'DATABASE_UNAVAILABLE',
				message:
					'Daftar jasa belum tersedia karena koneksi database belum dikonfigurasi.'
			}
		});
	});

	test('keeps category discovery explicitly unavailable without a database', async () => {
		const response = await app.handle(new Request('http://localhost/api/services/categories'));

		expect(response.status).toBe(503);
		expect(await response.json()).toMatchObject({
			error: {
				code: 'DATABASE_UNAVAILABLE'
			}
		});
	});

	test('rejects invalid pagination instead of silently changing the requested page size', async () => {
		const response = await app.handle(
			new Request('http://localhost/api/services?limit=51')
		);

		expect(response.status).toBe(422);
	});

	test('validates service identifiers as UUIDs', async () => {
		const response = await app.handle(new Request('http://localhost/api/services/not-a-uuid'));

		expect(response.status).toBe(422);
	});

	test('keeps the health endpoint independent from database availability', async () => {
		const response = await app.handle(new Request('http://localhost/api/health'));

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			status: 'ok',
			service: 'serba-bisa-api'
		});
	});
});
