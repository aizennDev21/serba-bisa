import { describe, expect, test } from 'bun:test';

import { createApp } from './app';

describe('admin user API without a database', () => {
	const app = createApp();

	test('returns an explicit unavailable response for user listings', async () => {
		const response = await app.handle(new Request('http://localhost/api/admin/users'));

		expect(response.status).toBe(503);
		expect(await response.json()).toMatchObject({
			error: { code: 'DATABASE_UNAVAILABLE' }
		});
	});

	test('rejects invalid management actions before accessing the database', async () => {
		const response = await app.handle(
			new Request(
				'http://localhost/api/admin/users/00000000-0000-4000-8000-000000000101/manage',
				{
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ action: 'delete', reason: 'Reason with enough length' })
				}
			)
		);

		expect(response.status).toBe(422);
	});

	test('rejects short audit reasons before accessing the database', async () => {
		const response = await app.handle(
			new Request(
				'http://localhost/api/admin/users/00000000-0000-4000-8000-000000000101/manage',
				{
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ action: 'suspend', reason: 'short' })
				}
			)
		);

		expect(response.status).toBe(422);
	});
});
