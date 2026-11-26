import { and, desc, eq, inArray, lt, or } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

import { getAuthenticatedUser } from './auth';
import type { createDatabase } from './db/client';
import { chatMessages, conversations, services, userRoles, users } from './db/schema';

type Database = ReturnType<typeof createDatabase>['db'];
type ChatSubscriber = { send: (message: string) => void; close: () => void };

const subscribersByConversation = new Map<string, Set<ChatSubscriber>>();
const serviceParams = t.Object({ serviceId: t.String({ format: 'uuid' }) });
const conversationParams = t.Object({ conversationId: t.String({ format: 'uuid' }) });
const messageBody = t.Object({ content: t.String({ minLength: 1, maxLength: 4000, pattern: '\\S' }) });

function isParticipant(
	conversation: { seekerId: string; ownerId: string },
	userId: string
): boolean {
	return conversation.seekerId === userId || conversation.ownerId === userId;
}

function broadcastMessageAvailable(conversationId: string): void {
	const subscribers = subscribersByConversation.get(conversationId);
	if (!subscribers) return;
	const payload = JSON.stringify({ type: 'new_message' });
	for (const subscriber of subscribers) {
		try {
			subscriber.send(payload);
		} catch {
			subscriber.close();
			subscribers.delete(subscriber);
		}
	}
	if (!subscribers.size) subscribersByConversation.delete(conversationId);
}

export function createChatRouter(
	database?: Database,
	frontendOrigin = 'http://localhost:5173'
) {
	return new Elysia({ prefix: '/api/chat' })
		.post(
			'/services/:serviceId/conversations',
			async ({ params, request, set }) => {
				if (!database) {
					set.status = 503;
					return { error: { code: 'DATABASE_UNAVAILABLE', message: 'Chat belum tersedia karena database belum dikonfigurasi.' } };
				}
				const actor = await getAuthenticatedUser(database, request.headers.get('cookie'));
				if (!actor) {
					set.status = 401;
					return { error: { code: 'UNAUTHENTICATED', message: 'Silakan masuk terlebih dahulu.' } };
				}
				if (!actor.roles.includes('seeker')) {
					set.status = 403;
					return { error: { code: 'SEEKER_REQUIRED', message: 'Hanya penyewa jasa yang dapat memulai percakapan.' } };
				}

				const [service] = await database
					.select({ id: services.id, ownerId: services.ownerId })
					.from(services)
					.innerJoin(users, eq(users.id, services.ownerId))
					.innerJoin(userRoles, eq(userRoles.userId, users.id))
					.where(and(
						eq(services.id, params.serviceId),
						eq(services.status, 'active'),
						eq(users.status, 'active'),
						eq(userRoles.role, 'provider')
					))
					.limit(1);
				if (!service) {
					set.status = 404;
					return { error: { code: 'SERVICE_NOT_FOUND', message: 'Jasa ini tidak tersedia untuk chat.' } };
				}
				if (service.ownerId === actor.id) {
					set.status = 403;
					return { error: { code: 'OWNER_CANNOT_CONTACT_SELF', message: 'Kamu tidak dapat memulai chat dengan dirimu sendiri.' } };
				}

				const [conversation] = await database
					.insert(conversations)
					.values({ serviceId: service.id, seekerId: actor.id, ownerId: service.ownerId })
					.onConflictDoUpdate({
						target: [conversations.serviceId, conversations.seekerId],
						set: { ownerId: service.ownerId, updatedAt: new Date() }
					})
					.returning({ id: conversations.id });
				if (!conversation) throw new Error('Conversation creation did not return a record.');
				set.status = 201;
				return { data: { id: conversation.id } };
			},
			{ params: serviceParams }
		)
		.get('/', async ({ request, set }) => {
			if (!database) {
				set.status = 503;
				return { error: { code: 'DATABASE_UNAVAILABLE', message: 'Daftar percakapan belum tersedia.' } };
			}
			const actor = await getAuthenticatedUser(database, request.headers.get('cookie'));
			if (!actor) {
				set.status = 401;
				return { error: { code: 'UNAUTHENTICATED', message: 'Silakan masuk terlebih dahulu.' } };
			}

			const rows = await database
				.select({
					id: conversations.id,
					serviceId: conversations.serviceId,
					serviceTitle: services.title,
					seekerId: conversations.seekerId,
					ownerId: conversations.ownerId,
					createdAt: conversations.createdAt,
					updatedAt: conversations.updatedAt
				})
				.from(conversations)
				.innerJoin(services, eq(services.id, conversations.serviceId))
				.where(or(eq(conversations.seekerId, actor.id), eq(conversations.ownerId, actor.id)))
				.orderBy(desc(conversations.updatedAt))
				.limit(100);
			const otherUserIds = [...new Set(rows.map((row) =>
				row.seekerId === actor.id ? row.ownerId : row.seekerId
			))];
			const [otherUsers, recentMessages] = rows.length
				? await Promise.all([
						database
							.select({ id: users.id, displayName: users.displayName })
							.from(users)
							.where(inArray(users.id, otherUserIds)),
						database
							.selectDistinctOn([chatMessages.conversationId], {
								conversationId: chatMessages.conversationId,
								content: chatMessages.content,
								createdAt: chatMessages.createdAt
							})
							.from(chatMessages)
							.where(inArray(chatMessages.conversationId, rows.map((row) => row.id)))
							.orderBy(chatMessages.conversationId, desc(chatMessages.createdAt), desc(chatMessages.id))
					])
				: [[], []];
			const userNames = new Map(otherUsers.map(({ id, displayName }) => [id, displayName]));
			const latestMessageByConversation = new Map(
				recentMessages.map((message) => [message.conversationId, message])
			);
			const data = rows.map((row) => {
				const otherUserId = row.seekerId === actor.id ? row.ownerId : row.seekerId;
				const lastMessage = latestMessageByConversation.get(row.id);
				return {
					id: row.id,
					serviceId: row.serviceId,
					serviceTitle: row.serviceTitle,
					otherUserName: userNames.get(otherUserId) ?? 'Pengguna',
					lastMessage: lastMessage?.content ?? 'Belum ada pesan',
					updatedAt: lastMessage?.createdAt ?? row.updatedAt
				};
			});
			return { data };
		})
		.get('/:conversationId', async ({ params, request, set }) => {
			if (!database) {
				set.status = 503;
				return { error: { code: 'DATABASE_UNAVAILABLE', message: 'Percakapan belum tersedia.' } };
			}
			const actor = await getAuthenticatedUser(database, request.headers.get('cookie'));
			if (!actor) {
				set.status = 401;
				return { error: { code: 'UNAUTHENTICATED', message: 'Silakan masuk terlebih dahulu.' } };
			}
			const [row] = await database
				.select({
					id: conversations.id,
					serviceTitle: services.title,
					serviceId: conversations.serviceId,
					seekerId: conversations.seekerId,
					ownerId: conversations.ownerId
				})
				.from(conversations)
				.innerJoin(services, eq(services.id, conversations.serviceId))
				.where(eq(conversations.id, params.conversationId))
				.limit(1);
			if (!row || !isParticipant(row, actor.id)) {
				set.status = 404;
				return { error: { code: 'CONVERSATION_NOT_FOUND', message: 'Percakapan tidak ditemukan.' } };
			}
			const otherUserId = row.seekerId === actor.id ? row.ownerId : row.seekerId;
			const [other] = await database
				.select({ displayName: users.displayName })
				.from(users)
				.where(eq(users.id, otherUserId))
				.limit(1);
			return {
				data: {
					id: row.id,
					serviceId: row.serviceId,
					serviceTitle: row.serviceTitle,
					otherUserName: other?.displayName ?? 'Pengguna'
				}
			};
		}, { params: conversationParams })
		.get('/:conversationId/messages', async ({ params, request, query, set }) => {
			if (!database) {
				set.status = 503;
				return { error: { code: 'DATABASE_UNAVAILABLE', message: 'Pesan belum tersedia.' } };
			}
			const actor = await getAuthenticatedUser(database, request.headers.get('cookie'));
			if (!actor) {
				set.status = 401;
				return { error: { code: 'UNAUTHENTICATED', message: 'Silakan masuk terlebih dahulu.' } };
			}
			const [conversation] = await database
				.select({ seekerId: conversations.seekerId, ownerId: conversations.ownerId })
				.from(conversations)
				.where(eq(conversations.id, params.conversationId))
				.limit(1);
			if (!conversation || !isParticipant(conversation, actor.id)) {
				set.status = 404;
				return { error: { code: 'CONVERSATION_NOT_FOUND', message: 'Percakapan tidak ditemukan.' } };
			}

			const before = query.before ? new Date(query.before) : undefined;
			const rows = await database
				.select({
					id: chatMessages.id,
					senderId: chatMessages.senderId,
					senderName: users.displayName,
					content: chatMessages.content,
					createdAt: chatMessages.createdAt
				})
				.from(chatMessages)
				.innerJoin(users, eq(users.id, chatMessages.senderId))
				.where(and(
					eq(chatMessages.conversationId, params.conversationId),
					before ? lt(chatMessages.createdAt, before) : undefined
				))
				.orderBy(desc(chatMessages.createdAt), desc(chatMessages.id))
				.limit(50);
			return { data: rows.reverse() };
		}, {
			params: conversationParams,
			query: t.Object({ before: t.Optional(t.String({ format: 'date-time' })) })
		})
		.post('/:conversationId/messages', async ({ body, params, request, set }) => {
			if (!database) {
				set.status = 503;
				return { error: { code: 'DATABASE_UNAVAILABLE', message: 'Pesan belum tersedia.' } };
			}
			const actor = await getAuthenticatedUser(database, request.headers.get('cookie'));
			if (!actor) {
				set.status = 401;
				return { error: { code: 'UNAUTHENTICATED', message: 'Silakan masuk terlebih dahulu.' } };
			}
			const [conversation] = await database
				.select({ seekerId: conversations.seekerId, ownerId: conversations.ownerId })
				.from(conversations)
				.where(eq(conversations.id, params.conversationId))
				.limit(1);
			if (!conversation || !isParticipant(conversation, actor.id)) {
				set.status = 404;
				return { error: { code: 'CONVERSATION_NOT_FOUND', message: 'Percakapan tidak ditemukan.' } };
			}
			if (!body.content.trim()) {
				set.status = 422;
				return { error: { code: 'EMPTY_MESSAGE', message: 'Pesan tidak boleh kosong.' } };
			}
			const [message] = await database.transaction(async (tx) => {
				const [created] = await tx.insert(chatMessages).values({
					conversationId: params.conversationId,
					senderId: actor.id,
					content: body.content.trim()
				}).returning({
					id: chatMessages.id,
					senderId: chatMessages.senderId,
					content: chatMessages.content,
					createdAt: chatMessages.createdAt
				});
				await tx.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, params.conversationId));
				return [created];
			});
			if (!message) throw new Error('Message creation did not return a record.');
			broadcastMessageAvailable(params.conversationId);
			set.status = 201;
			return { data: { ...message, senderName: actor.displayName } };
		}, { params: conversationParams, body: messageBody 		})
		.get('/:conversationId/events', async ({ params, request, set }) => {
			if (!database) {
				set.status = 503;
				return { error: { code: 'DATABASE_UNAVAILABLE', message: 'Notifikasi chat belum tersedia.' } };
			}
			if (request.headers.get('origin') !== frontendOrigin) {
				set.status = 403;
				return { error: { code: 'INVALID_ORIGIN', message: 'Origin koneksi chat tidak diizinkan.' } };
			}
			const actor = await getAuthenticatedUser(database, request.headers.get('cookie'));
			if (!actor) {
				set.status = 401;
				return { error: { code: 'UNAUTHENTICATED', message: 'Silakan masuk terlebih dahulu.' } };
			}
			const [conversation] = await database
				.select({ seekerId: conversations.seekerId, ownerId: conversations.ownerId })
				.from(conversations)
				.where(eq(conversations.id, params.conversationId))
				.limit(1);
			if (!conversation || !isParticipant(conversation, actor.id)) {
				set.status = 404;
				return { error: { code: 'CONVERSATION_NOT_FOUND', message: 'Percakapan tidak ditemukan.' } };
			}

			let subscriber: ChatSubscriber | undefined;
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
					const subscribers = subscribersByConversation.get(params.conversationId) ?? new Set();
					subscribers.add(subscriber);
					subscribersByConversation.set(params.conversationId, subscribers);
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
					const subscribers = subscribersByConversation.get(params.conversationId);
					if (subscriber) subscribers?.delete(subscriber);
					if (subscribers && !subscribers.size) {
						subscribersByConversation.delete(params.conversationId);
					}
				}
			});
			return new Response(stream, {
				headers: {
					'content-type': 'text/event-stream; charset=utf-8',
					'cache-control': 'no-cache, no-transform',
					connection: 'keep-alive',
					'x-accel-buffering': 'no'
				}
			});
		}, { params: conversationParams });
}
