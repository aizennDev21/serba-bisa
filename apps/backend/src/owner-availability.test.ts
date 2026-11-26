import { describe, expect, test } from 'bun:test';

import { createApp } from './app';

describe('owner availability API without a database', () => {
	const app = createApp();

	test('returns an explicit unavailable response for availability reads and writes', async () => {
		const read = await app.handle(new Request('http://localhost/api/owner/availability'));
		const write = await app.handle(
			new Request('http://localhost/api/owner/availability', {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					days: Array.from({ length: 7 }, (_, dayOfWeek) => ({
						dayOfWeek,
						isAvailable: false,
						startMinute: 480,
						endMinute: 1020
					}))
				})
			})
		);
		expect(read.status).toBe(503);
		expect(write.status).toBe(503);
		expect(await read.json()).toMatchObject({
			error: { code: 'DATABASE_UNAVAILABLE' }
		});
	});

	test('rejects incomplete weekday schedules before database access', async () => {
		const response = await app.handle(
			new Request('http://localhost/api/owner/availability', {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					days: Array.from({ length: 6 }, (_, dayOfWeek) => ({
						dayOfWeek,
						isAvailable: true,
						startMinute: 480,
						endMinute: 1020
					}))
				})
			})
		);
		expect(response.status).toBe(422);
	});

	test('validates exception dates and reports unavailable storage', async () => {
		const invalidDate = await app.handle(
			new Request('http://localhost/api/owner/availability/exceptions/not-a-date', {
				method: 'DELETE'
			})
		);
		const read = await app.handle(
			new Request('http://localhost/api/owner/availability/exceptions')
		);
		const write = await app.handle(
			new Request('http://localhost/api/owner/availability/exceptions', {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					date: '2030-01-03',
					isAvailable: false,
					startMinute: 480,
					endMinute: 1020
				})
			})
		);
		expect(invalidDate.status).toBe(422);
		expect(read.status).toBe(503);
		expect(write.status).toBe(503);
	});

	test('validates exception time bounds before database access', async () => {
		const response = await app.handle(
			new Request('http://localhost/api/owner/availability/exceptions', {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					date: '2030-01-03',
					isAvailable: true,
					startMinute: 1500,
					endMinute: 1020
				})
			})
		);
		expect(response.status).toBe(422);
	});
});
