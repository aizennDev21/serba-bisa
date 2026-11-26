import { and, count, desc, eq, isNull } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

import { getAuthenticatedUser } from './auth';
import type { createDatabase } from './db/client';
import { notifications } from './db/schema';

type Database = ReturnType<typeof createDatabase>['db'];
type NotificationSubscriber = { send: (message: string) => void; close: () => void };

const subscribersByUser = new Map<string, Set<NotificationSubscriber>>();
const notificationParams = t.Object({ notificationId: t.String({ format: 'uuid' }) });

export function publishNotification(userId: string, notification: {
	id: string;
	type: string;
	createdAt: Date;
}): void {
	const subscribers = subscribersByUser.get(userId);
	if (!subscribers) return;
	const payload = JSON.stringify({ type: 'notification_created', notification });
	for (const subscriber of subscribers) {
		try {
			subscriber.send(payload);
		} catch {
			subscriber.close();
			subscribers.delete(subscriber);
		}
	}
	if (!subscribers.size) subscribersByUser.delete(userId);
}

export function createNotificationsRouter(
	database?: Database,
	frontendOrigin = 'http://localhost:5173'
) {
	return new Elysia({ prefix: '/api/notifications' })
		.get('/', async ({ request, set }) => {
			if (!database) {
				set.status = 503;
				return {
					error: {
						code: 'DATABASE_UNAVAILABLE',
						message: 'Notifikasi belum tersedia karena koneksi database belum dikonfigurasi.'
					}
				};
			}
			const actor = await getAuthenticatedUser(database, request.headers.get('cookie'));
			if (!actor) {
				set.status = 401;
				return { error: { code: 'UNAUTHENTICATED', message: 'Silakan masuk terlebih dahulu.' } };
			}

			const [rows, unreadRows] = await Promise.all([
				database
					.select({
						id: notifications.id,
						bookingId: notifications.bookingId,
						type: notifications.type,
						title: notifications.title,
						message: notifications.message,
						readAt: notifications.readAt,
						createdAt: notifications.createdAt
					})
					.from(notifications)
					.where(eq(notifications.userId, actor.id))
					.orderBy(desc(notifications.createdAt))
					.limit(100),
				database
					.select({ unreadCount: count() })
					.from(notifications)
					.where(and(eq(notifications.userId, actor.id), isNull(notifications.readAt)))
			]);
			return {
				data: rows,
				unreadCount: Number(unreadRows[0]?.unreadCount ?? 0)
			};
		})
		.post('/read-all', async ({ request, set }) => {
			if (!database) {
				set.status = 503;
				return {
					error: {
						code: 'DATABASE_UNAVAILABLE',
						message: 'Notifikasi belum tersedia karena koneksi database belum dikonfigurasi.'
					}
				};
			}
			const actor = await getAuthenticatedUser(database, request.headers.get('cookie'));
			if (!actor) {
				set.status = 401;
				return { error: { code: 'UNAUTHENTICATED', message: 'Silakan masuk terlebih dahulu.' } };
			}
			await database
				.update(notifications)
				.set({ readAt: new Date() })
				.where(and(eq(notifications.userId, actor.id), isNull(notifications.readAt)));
			return { data: { updated: true } };
		})
		.post(
			'/:notificationId/read',
			async ({ params, request, set }) => {
				if (!database) {
					set.status = 503;
					return {
						error: {
							code: 'DATABASE_UNAVAILABLE',
							message: 'Notifikasi belum tersedia karena koneksi database belum dikonfigurasi.'
						}
					};
				}
				const actor = await getAuthenticatedUser(database, request.headers.get('cookie'));
				if (!actor) {
					set.status = 401;
					return { error: { code: 'UNAUTHENTICATED', message: 'Silakan masuk terlebih dahulu.' } };
				}
				const [updated] = await database
					.update(notifications)
					.set({ readAt: new Date() })
					.where(
						and(
							eq(notifications.id, params.notificationId),
							eq(notifications.userId, actor.id),
							isNull(notifications.readAt)
						)
					)
					.returning({ id: notifications.id });
				if (!updated) {
					const [existing] = await database
						.select({ id: notifications.id })
						.from(notifications)
						.where(and(eq(notifications.id, params.notificationId), eq(notifications.userId, actor.id)))
						.limit(1);
					if (!existing) {
						set.status = 404;
						return { error: { code: 'NOTIFICATION_NOT_FOUND', message: 'Notifikasi tidak ditemukan.' } };
					}
				}
				return { data: { id: params.notificationId, read: true } };
			},
			{ params: notificationParams }
		)
		.get('/events', async ({ request, set }) => {
			if (!database) {
				set.status = 503;
				return {
					error: {
						code: 'DATABASE_UNAVAILABLE',
						message: 'Notifikasi realtime belum tersedia karena koneksi database belum dikonfigurasi.'
					}
				};
			}
			if (request.headers.get('origin') !== frontendOrigin) {
				set.status = 403;
				return { error: { code: 'INVALID_ORIGIN', message: 'Origin koneksi notifikasi tidak diizinkan.' } };
			}
			const actor = await getAuthenticatedUser(database, request.headers.get('cookie'));
			if (!actor) {
				set.status = 401;
				return { error: { code: 'UNAUTHENTICATED', message: 'Silakan masuk terlebih dahulu.' } };
			}

			let subscriber: NotificationSubscriber | undefined;
			let heartbeat: ReturnType<typeof setInterval> | undefined;
			let closed = false;
			const stream = new ReadableStream<Uint8Array>({
				start(controller) {
					const encoder = new TextEncoder();
					subscriber = {
						send: (message) => {
							if (!closed) controller.enqueue(encoder.encode(`data: ${message}\n\n`));
						},
						close: () => {
							if (closed) return;
							closed = true;
							if (heartbeat) clearInterval(heartbeat);
							controller.close();
						}
					};
					const subscribers = subscribersByUser.get(actor.id) ?? new Set();
					subscribers.add(subscriber);
					subscribersByUser.set(actor.id, subscribers);
					subscriber.send(JSON.stringify({ type: 'connected' }));
					heartbeat = setInterval(() => {
						try {
							controller.enqueue(encoder.encode(': keep-alive\n\n'));
						} catch {
							if (heartbeat) clearInterval(heartbeat);
						}
					}, 25_000);
				},
				cancel() {
					closed = true;
					if (heartbeat) clearInterval(heartbeat);
					const subscribers = subscribersByUser.get(actor.id);
					if (subscriber && subscribers) {
						subscribers.delete(subscriber);
						if (!subscribers.size) subscribersByUser.delete(actor.id);
					}
				}
			});
			set.headers['Cache-Control'] = 'no-cache, no-transform';
			set.headers['X-Accel-Buffering'] = 'no';
			return new Response(stream, {
				headers: { 'Content-Type': 'text/event-stream; charset=utf-8' }
			});
		});
}
