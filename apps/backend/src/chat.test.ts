import { describe, expect, test } from 'bun:test';

import { createApp } from './app';

describe('private chat API without a database', () => {
	const app = createApp();
	const serviceId = '00000000-0000-4000-8000-000000000101';
	const conversationId = '00000000-0000-4000-8000-000000000201';

	test('returns an explicit unavailable response when starting a conversation', async () => {
		const response = await app.handle(
			new Request(`http://localhost/api/chat/services/${serviceId}/conversations`, {
				method: 'POST'
			})
		);
		expect(response.status).toBe(503);
		expect(await response.json()).toMatchObject({
			error: { code: 'DATABASE_UNAVAILABLE' }
		});
	});

	test('rejects invalid service and conversation identifiers', async () => {
		const serviceResponse = await app.handle(
			new Request('http://localhost/api/chat/services/not-a-uuid/conversations', {
				method: 'POST'
			})
		);
		const conversationResponse = await app.handle(
			new Request('http://localhost/api/chat/not-a-uuid/messages')
		);
		expect(serviceResponse.status).toBe(422);
		expect(conversationResponse.status).toBe(422);
	});

	test('validates message length and empty content before database access', async () => {
		const response = await app.handle(
			new Request(`http://localhost/api/chat/${conversationId}/messages`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ content: '   ' })
			})
		);
		expect(response.status).toBe(422);
	});

	test('returns an explicit unavailable response for inbox and messages', async () => {
		const inbox = await app.handle(new Request('http://localhost/api/chat'));
		const messages = await app.handle(
			new Request(`http://localhost/api/chat/${conversationId}/messages`)
		);
		expect(inbox.status).toBe(503);
		expect(messages.status).toBe(503);
	});
});
