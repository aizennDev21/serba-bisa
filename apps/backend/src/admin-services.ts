import { and, desc, eq, ne } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

import { getAuthenticatedUser } from './auth';
import type { createDatabase } from './db/client';
import { moderationAuditLogs, services, users } from './db/schema';

type Database = ReturnType<typeof createDatabase>['db'];

const uuidParams = t.Object({ id: t.String({ format: 'uuid' }) });
const moderationBody = t.Object({
	action: t.Union([t.Literal('approve'), t.Literal('suspend'), t.Literal('restore')]),
	reason: t.String({ minLength: 8, maxLength: 500 })
});

export function createAdminServicesRouter(database?: Database) {
	return new Elysia({ prefix: '/api/admin/services' })
		.get('/', async ({ request, set }) => {
			if (!database) {
				set.status = 503;
				return {
					error: {
						code: 'DATABASE_UNAVAILABLE',
						message: 'Moderasi belum tersedia karena koneksi database belum dikonfigurasi.'
					}
				};
			}

			const account = await getAuthenticatedUser(database, request.headers.get('cookie'));
			if (!account) {
				set.status = 401;
				return { error: { code: 'UNAUTHENTICATED', message: 'Silakan masuk terlebih dahulu.' } };
			}
			if (!account.roles.includes('admin') && !account.roles.includes('super_admin')) {
				set.status = 403;
				return { error: { code: 'ADMIN_REQUIRED', message: 'Akses khusus admin.' } };
			}

			const rows = await database
				.select({
					id: services.id,
					title: services.title,
					description: services.description,
					category: services.category,
					price: services.price,
					priceUnit: services.priceUnit,
					status: services.status,
					statusBeforeSuspension: services.statusBeforeSuspension,
					location: services.location,
					updatedAt: services.updatedAt,
					ownerId: users.id,
					ownerName: users.displayName,
					ownerEmail: users.email
				})
				.from(services)
				.innerJoin(users, eq(services.ownerId, users.id))
				.where(ne(services.status, 'archived'))
				.orderBy(desc(services.updatedAt), desc(services.id));

			return { data: rows };
		})
		.post(
			'/:id/moderate',
			async ({ body, params, request, set }) => {
				if (!database) {
					set.status = 503;
					return {
						error: {
							code: 'DATABASE_UNAVAILABLE',
							message: 'Moderasi belum tersedia karena koneksi database belum dikonfigurasi.'
						}
					};
				}

				const account = await getAuthenticatedUser(database, request.headers.get('cookie'));
				if (!account) {
					set.status = 401;
					return { error: { code: 'UNAUTHENTICATED', message: 'Silakan masuk terlebih dahulu.' } };
				}
				if (!account.roles.includes('admin') && !account.roles.includes('super_admin')) {
					set.status = 403;
					return { error: { code: 'ADMIN_REQUIRED', message: 'Akses khusus admin.' } };
				}

				const reason = body.reason.trim();
				if (reason.length < 8) {
					set.status = 422;
					return {
						error: { code: 'MODERATION_REASON_REQUIRED', message: 'Alasan moderasi minimal 8 karakter.' }
					};
				}

				const outcome = await database.transaction(async (tx) => {
					const [service] = await tx
						.select({
							id: services.id,
							status: services.status,
							statusBeforeSuspension: services.statusBeforeSuspension
						})
						.from(services)
						.where(eq(services.id, params.id))
						.limit(1);

					if (!service || service.status === 'archived') return { kind: 'not-found' as const };

					let nextStatus: 'active' | 'suspended' | 'draft' | 'unavailable';
					let previousStatus: typeof service.status | null = service.status;

					if (body.action === 'suspend') {
						if (service.status === 'suspended') return { kind: 'conflict' as const };
						nextStatus = 'suspended';
					} else if (body.action === 'restore') {
						if (service.status !== 'suspended') return { kind: 'conflict' as const };
						nextStatus =
							service.statusBeforeSuspension === 'active' ||
							service.statusBeforeSuspension === 'unavailable'
								? service.statusBeforeSuspension
								: 'draft';
						previousStatus = 'suspended';
					} else {
						if (service.status !== 'draft') return { kind: 'conflict' as const };
						nextStatus = 'active';
					}

					const [updated] = await tx
						.update(services)
						.set({
							status: nextStatus,
							statusBeforeSuspension: body.action === 'suspend' ? service.status : null,
							updatedAt: new Date()
						})
						.where(and(eq(services.id, service.id), eq(services.status, service.status)))
						.returning({ id: services.id, status: services.status });

					if (!updated) return { kind: 'conflict' as const };

					await tx.insert(moderationAuditLogs).values({
						serviceId: service.id,
						actorId: account.id,
						action: body.action,
						reason,
						previousStatus,
						newStatus: updated.status
					});

					return { kind: 'success' as const, service: updated };
				});

				if (outcome.kind === 'not-found') {
					set.status = 404;
					return { error: { code: 'SERVICE_NOT_FOUND', message: 'Jasa tidak ditemukan.' } };
				}
				if (outcome.kind === 'conflict') {
					set.status = 409;
					return {
						error: {
							code: 'INVALID_MODERATION_TRANSITION',
							message: 'Status jasa telah berubah atau tindakan ini tidak sesuai dengan status saat ini.'
						}
					};
				}

				return { data: outcome.service };
			},
			{ params: uuidParams, body: moderationBody }
		)
		.get(
			'/:id/audit',
			async ({ params, request, set }) => {
				if (!database) {
					set.status = 503;
					return {
						error: {
							code: 'DATABASE_UNAVAILABLE',
							message: 'Riwayat moderasi belum tersedia karena koneksi database belum dikonfigurasi.'
						}
					};
				}

				const account = await getAuthenticatedUser(database, request.headers.get('cookie'));
				if (!account) {
					set.status = 401;
					return { error: { code: 'UNAUTHENTICATED', message: 'Silakan masuk terlebih dahulu.' } };
				}
				if (!account.roles.includes('admin') && !account.roles.includes('super_admin')) {
					set.status = 403;
					return { error: { code: 'ADMIN_REQUIRED', message: 'Akses khusus admin.' } };
				}

				const rows = await database
					.select({
						id: moderationAuditLogs.id,
						action: moderationAuditLogs.action,
						reason: moderationAuditLogs.reason,
						previousStatus: moderationAuditLogs.previousStatus,
						newStatus: moderationAuditLogs.newStatus,
						createdAt: moderationAuditLogs.createdAt,
						moderatorName: users.displayName
					})
					.from(moderationAuditLogs)
					.innerJoin(users, eq(moderationAuditLogs.actorId, users.id))
					.where(eq(moderationAuditLogs.serviceId, params.id))
					.orderBy(desc(moderationAuditLogs.createdAt))
					.limit(50);

				return { data: rows };
			},
			{ params: uuidParams }
		);
}
