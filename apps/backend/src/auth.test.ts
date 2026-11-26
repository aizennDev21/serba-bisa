import { describe, expect, test } from 'bun:test';

import { createApp } from './app';

describe('account API without a database', () => {
	const app = createApp();

	test('returns an explicit unavailable response for registration', async () => {
		const response = await app.handle(
			new Request('http://localhost/api/auth/register', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					email: 'new.user@example.invalid',
					displayName: 'New User',
					password: 'correct horse battery staple'
				})
			})
		);

		expect(response.status).toBe(503);
		expect(await response.json()).toMatchObject({
			error: { code: 'DATABASE_UNAVAILABLE' }
		});
	});

	test('rejects short passwords before handling registration', async () => {
		const response = await app.handle(
			new Request('http://localhost/api/auth/register', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					email: 'new.user@example.invalid',
					displayName: 'New User',
					password: 'short'
				})
			})
		);

		expect(response.status).toBe(422);
	});

	test('returns an explicit unavailable response for account lookup', async () => {
		const response = await app.handle(new Request('http://localhost/api/auth/me'));

		expect(response.status).toBe(503);
		expect(await response.json()).toMatchObject({
			error: { code: 'DATABASE_UNAVAILABLE' }
		});
	});

	test('clears the session cookie when logging out', async () => {
		const response = await app.handle(
			new Request('http://localhost/api/auth/logout', { method: 'POST' })
		);

		expect(response.status).toBe(204);
		expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
	});
});
