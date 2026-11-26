import { describe, expect, test } from 'bun:test';

import { createApp } from './app';

describe('notifications API without a database', () => {
	const app = createApp();
	const notificationId = '00000000-0000-4000-8000-000000000101';

	test('returns explicit unavailable responses for notification endpoints', async () => {
		const list = await app.handle(new Request('http://localhost/api/notifications'));
		const markRead = await app.handle(
			new Request(`http://localhost/api/notifications/${notificationId}/read`, {
				method: 'POST'
			})
		);
		const markAllRead = await app.handle(
			new Request('http://localhost/api/notifications/read-all', {
				method: 'POST'
			})
		);
		const events = await app.handle(new Request('http://localhost/api/notifications/events'));
		expect(list.status).toBe(503);
		expect(markRead.status).toBe(503);
		expect(markAllRead.status).toBe(503);
		expect(events.status).toBe(503);
		expect(await list.json()).toMatchObject({
			error: { code: 'DATABASE_UNAVAILABLE' }
		});
	});

	test('rejects invalid notification identifiers before database access', async () => {
		const response = await app.handle(
			new Request('http://localhost/api/notifications/not-a-uuid/read', {
				method: 'POST'
			})
		);
		expect(response.status).toBe(422);
	});
});
