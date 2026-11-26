import { describe, expect, test } from 'bun:test';

import { createApp } from './app';

describe('admin service API without a database', () => {
	const app = createApp();

	test('returns an explicit unavailable response for moderation queue', async () => {
		const response = await app.handle(new Request('http://localhost/api/admin/services'));

		expect(response.status).toBe(503);
		expect(await response.json()).toMatchObject({
			error: { code: 'DATABASE_UNAVAILABLE' }
		});
	});

	test('rejects short moderation reasons before accessing the database', async () => {
		const response = await app.handle(
			new Request(
				'http://localhost/api/admin/services/00000000-0000-4000-8000-000000000101/moderate',
				{
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ action: 'suspend', reason: 'short' })
				}
			)
		);

		expect(response.status).toBe(422);
	});

	test('rejects an invalid moderation action', async () => {
		const response = await app.handle(
			new Request(
				'http://localhost/api/admin/services/00000000-0000-4000-8000-000000000101/moderate',
				{
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ action: 'delete', reason: 'Reason has enough length' })
				}
			)
		);

		expect(response.status).toBe(422);
	});
});
