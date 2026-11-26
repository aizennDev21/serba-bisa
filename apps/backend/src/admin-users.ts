import { and, count, desc, eq, ilike, notExists, or } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

import { getAuthenticatedUser } from './auth';
import type { createDatabase } from './db/client';
import {
	authSessions,
	userAdminAuditLogs,
	userRoles,
	users
} from './db/schema';

type Database = ReturnType<typeof createDatabase>['db'];

const userQuery = t.Object({
	q: t.Optional(t.String({ maxLength: 100 })),
	page: t.Optional(t.Numeric({ minimum: 1, maximum: 10000 })),
	limit: t.Optional(t.Numeric({ minimum: 1, maximum: 50 }))
});
const uuidParams = t.Object({ id: t.String({ format: 'uuid' }) });
const userActionBody = t.Object({
	action: t.Union([
		t.Literal('suspend'),
		t.Literal('restore'),
		t.Literal('grant_admin'),
		t.Literal('revoke_admin')
	]),
	reason: t.String({ minLength: 8, maxLength: 500 })
});

type UserAction = 'suspend' | 'restore' | 'grant_admin' | 'revoke_admin';

function isSuperAdmin(roles: string[]): boolean {
	return roles.includes('super_admin');
}

function isAdmin(roles: string[]): boolean {
	return roles.includes('admin') || isSuperAdmin(roles);
}

function isRoleAction(action: UserAction): boolean {
	return action === 'grant_admin' || action === 'revoke_admin';
}

export function createAdminUsersRouter(database?: Database) {
	return new Elysia({ prefix: '/api/admin/users' })
		.get(
			'/',
			async ({ query, request, set }) => {
				if (!database) {
					set.status = 503;
					return {
						error: {
							code: 'DATABASE_UNAVAILABLE',
							message: 'Manajemen akun belum tersedia karena koneksi database belum dikonfigurasi.'
						}
					};
				}

				const actor = await getAuthenticatedUser(database, request.headers.get('cookie'));
				if (!actor) {
					set.status = 401;
					return { error: { code: 'UNAUTHENTICATED', message: 'Silakan masuk terlebih dahulu.' } };
				}
				if (!isAdmin(actor.roles)) {
					set.status = 403;
					return { error: { code: 'ADMIN_REQUIRED', message: 'Akses khusus admin.' } };
				}

				const page = query.page ?? 1;
				const limit = query.limit ?? 25;
				const search = query.q?.trim();
				const filters = [];
				if (search) {
					const pattern = `%${search}%`;
					const searchFilter = or(ilike(users.displayName, pattern), ilike(users.email, pattern));
					if (searchFilter) filters.push(searchFilter);
				}

				if (!isSuperAdmin(actor.roles)) {
					filters.push(
						notExists(
							database
								.select({ userId: userRoles.userId })
								.from(userRoles)
								.where(
									and(
										eq(userRoles.userId, users.id),
										eq(userRoles.role, 'super_admin')
									)
								)
						)
					);
				}

				const where = filters.length ? and(...filters) : undefined;
				const [rows, totals] = await Promise.all([
					database
						.select({
							id: users.id,
							email: users.email,
							displayName: users.displayName,
							status: users.status,
							createdAt: users.createdAt,
							updatedAt: users.updatedAt
						})
						.from(users)
						.where(where)
						.orderBy(desc(users.createdAt), desc(users.id))
						.limit(limit)
						.offset((page - 1) * limit),
					database.select({ total: count() }).from(users).where(where)
				]);

				const data = await Promise.all(
					rows.map(async (user) => {
						const roles = await database
							.select({ role: userRoles.role })
							.from(userRoles)
							.where(eq(userRoles.userId, user.id));
						return { ...user, roles: roles.map(({ role }) => role) };
					})
				);
				const total = totals[0]?.total ?? 0;

				return {
					data,
					pagination: {
						page,
						limit,
						total,
						totalPages: Math.ceil(total / limit)
					},
					permissions: {
						canManageRoles: isSuperAdmin(actor.roles),
						scope: isSuperAdmin(actor.roles) ? 'all' : 'regular_users',
						actorId: actor.id
					}
				};
			},
			{ query: userQuery }
		)
		.post(
			'/:id/manage',
			async ({ body, params, request, set }) => {
				if (!database) {
					set.status = 503;
					return {
						error: {
							code: 'DATABASE_UNAVAILABLE',
							message: 'Manajemen akun belum tersedia karena koneksi database belum dikonfigurasi.'
						}
					};
				}

				const actor = await getAuthenticatedUser(database, request.headers.get('cookie'));
				if (!actor) {
					set.status = 401;
					return { error: { code: 'UNAUTHENTICATED', message: 'Silakan masuk terlebih dahulu.' } };
				}
				if (!isAdmin(actor.roles)) {
					set.status = 403;
					return { error: { code: 'ADMIN_REQUIRED', message: 'Akses khusus admin.' } };
				}

				const reason = body.reason.trim();
				if (reason.length < 8) {
					set.status = 422;
					return { error: { code: 'MANAGEMENT_REASON_REQUIRED', message: 'Alasan tindakan minimal 8 karakter.' } };
				}

				if (isRoleAction(body.action) && !isSuperAdmin(actor.roles)) {
					set.status = 403;
					return { error: { code: 'SUPER_ADMIN_REQUIRED', message: 'Hanya super admin yang dapat mengubah role admin.' } };
				}
				if (params.id === actor.id) {
					set.status = 409;
					return { error: { code: 'SELF_MANAGEMENT_BLOCKED', message: 'Tindakan manajemen pada akun sendiri tidak diizinkan.' } };
				}

				const result = await database.transaction(async (tx) => {
					const [target] = await tx
						.select({
							id: users.id,
							status: users.status
						})
						.from(users)
						.where(eq(users.id, params.id))
						.limit(1);
					if (!target) return { kind: 'not-found' as const };

					const targetRoles = await tx
						.select({ role: userRoles.role })
						.from(userRoles)
						.where(eq(userRoles.userId, target.id));
					const roles = targetRoles.map(({ role }) => role);

					if (!isSuperAdmin(actor.roles) && isSuperAdmin(roles)) {
						return { kind: 'not-found' as const };
					}
					if (isRoleAction(body.action) && isSuperAdmin(roles)) {
						return { kind: 'conflict' as const, message: 'Role super admin tidak dapat diubah dari pengelolaan role admin.' };
					}

					if (body.action === 'suspend' || body.action === 'restore') {
						const nextStatus = body.action === 'suspend' ? 'suspended' : 'active';
						if (target.status === nextStatus) {
							return { kind: 'conflict' as const, message: 'Status akun sudah sesuai dengan tindakan yang diminta.' };
						}

						if (body.action === 'suspend' && isSuperAdmin(roles)) {
							const activeSuperAdmins = await tx
								.select({ id: users.id })
								.from(users)
								.innerJoin(userRoles, eq(userRoles.userId, users.id))
								.where(
									and(
										eq(users.status, 'active'),
										eq(userRoles.role, 'super_admin')
									)
								)
								.orderBy(users.id)
								.for('update');
							if (activeSuperAdmins.length <= 1) {
								return {
									kind: 'conflict' as const,
									message: 'Tidak dapat menonaktifkan super admin aktif terakhir.'
								};
							}
						}

						const [updatedUser] = await tx
							.update(users)
							.set({ status: nextStatus, updatedAt: new Date() })
							.where(and(eq(users.id, target.id), eq(users.status, target.status)))
							.returning({ id: users.id });
						if (!updatedUser) {
							return { kind: 'conflict' as const, message: 'Status akun baru saja berubah.' };
						}
						if (body.action === 'suspend') {
							await tx.delete(authSessions).where(eq(authSessions.userId, target.id));
						}
						await tx.insert(userAdminAuditLogs).values({
							targetUserId: target.id,
							actorId: actor.id,
							action: body.action,
							reason,
							previousStatus: target.status,
							newStatus: nextStatus
						});

						return { kind: 'success' as const, status: nextStatus };
					}

					if (body.action === 'grant_admin') {
						if (roles.includes('admin')) {
							return { kind: 'conflict' as const, message: 'Akun ini sudah memiliki role admin.' };
						}
						await tx.insert(userRoles).values({ userId: target.id, role: 'admin' });
					} else {
						if (!roles.includes('admin')) {
							return { kind: 'conflict' as const, message: 'Akun ini tidak memiliki role admin.' };
						}
						await tx
							.delete(userRoles)
							.where(and(eq(userRoles.userId, target.id), eq(userRoles.role, 'admin')));
					}

					await tx.insert(userAdminAuditLogs).values({
						targetUserId: target.id,
						actorId: actor.id,
						action: body.action,
						reason,
						previousStatus: target.status,
						newStatus: target.status,
						role: 'admin'
					});

					return { kind: 'success' as const, status: target.status };
				});

				if (result.kind === 'not-found') {
					set.status = 404;
					return { error: { code: 'USER_NOT_FOUND', message: 'Akun tidak ditemukan.' } };
				}
				if (result.kind === 'conflict') {
					set.status = 409;
					return {
						error: {
							code: 'INVALID_USER_TRANSITION',
							message: result.message
						}
					};
				}

				return { data: { id: params.id, status: result.status } };
			},
			{ params: uuidParams, body: userActionBody }
		)
		.get(
			'/:id/audit',
			async ({ params, request, set }) => {
				if (!database) {
					set.status = 503;
					return {
						error: {
							code: 'DATABASE_UNAVAILABLE',
							message: 'Audit akun belum tersedia karena koneksi database belum dikonfigurasi.'
						}
					};
				}
				const actor = await getAuthenticatedUser(database, request.headers.get('cookie'));
				if (!actor) {
					set.status = 401;
					return { error: { code: 'UNAUTHENTICATED', message: 'Silakan masuk terlebih dahulu.' } };
				}
				if (!isSuperAdmin(actor.roles)) {
					set.status = 403;
					return { error: { code: 'SUPER_ADMIN_REQUIRED', message: 'Audit manajemen akun hanya untuk super admin.' } };
				}

				const rows = await database
					.select({
						id: userAdminAuditLogs.id,
						action: userAdminAuditLogs.action,
						reason: userAdminAuditLogs.reason,
						previousStatus: userAdminAuditLogs.previousStatus,
						newStatus: userAdminAuditLogs.newStatus,
						role: userAdminAuditLogs.role,
						createdAt: userAdminAuditLogs.createdAt,
						actorName: users.displayName
					})
					.from(userAdminAuditLogs)
					.innerJoin(users, eq(userAdminAuditLogs.actorId, users.id))
					.where(eq(userAdminAuditLogs.targetUserId, params.id))
					.orderBy(desc(userAdminAuditLogs.createdAt))
					.limit(100);

				return { data: rows };
			},
			{ params: uuidParams }
		);
}
