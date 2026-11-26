import { and, desc, eq } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

import { getAuthenticatedUser } from './auth';
import type { createDatabase } from './db/client';
import { services, userRoles } from './db/schema';

type Database = ReturnType<typeof createDatabase>['db'];

const serviceFields = {
	title: t.String({ minLength: 3, maxLength: 120 }),
	description: t.String({ minLength: 20, maxLength: 5000 }),
	category: t.String({ minLength: 2, maxLength: 80 }),
	price: t.Integer({ minimum: 0, maximum: 100_000_000 }),
	priceUnit: t.Union([
		t.Literal('hour'),
		t.Literal('visit'),
		t.Literal('project'),
		t.Literal('session'),
		t.Literal('fixed')
	]),
	location: t.String({ minLength: 2, maxLength: 160 })
};

const createBody = t.Object(serviceFields);
const updateBody = t.Object({
	...serviceFields,
	status: t.Union([
		t.Literal('draft'),
		t.Literal('active'),
		t.Literal('unavailable'),
		t.Literal('archived')
	])
});
const uuidParams = t.Object({ id: t.String({ format: 'uuid' }) });

function normalizedFields(body: {
	title: string;
	description: string;
	category: string;
	price: number;
	priceUnit: 'hour' | 'visit' | 'project' | 'session' | 'fixed';
	location: string;
}) {
	return {
		title: body.title.trim(),
		description: body.description.trim(),
		category: body.category.trim(),
		price: body.price,
		priceUnit: body.priceUnit,
		location: body.location.trim()
	};
}

export function createOwnerServicesRouter(database?: Database) {
	return new Elysia({ prefix: '/api/owner/services' })
		.get('/', async ({ request, set }) => {
			if (!database) {
				set.status = 503;
				return {
					error: {
						code: 'DATABASE_UNAVAILABLE',
						message: 'Pengelolaan jasa belum tersedia karena koneksi database belum dikonfigurasi.'
					}
				};
			}

			const account = await getAuthenticatedUser(database, request.headers.get('cookie'));
			if (!account) {
				set.status = 401;
				return { error: { code: 'UNAUTHENTICATED', message: 'Silakan masuk terlebih dahulu.' } };
			}

			const [providerRole] = await database
				.select({ userId: userRoles.userId })
				.from(userRoles)
				.where(and(eq(userRoles.userId, account.id), eq(userRoles.role, 'provider')))
				.limit(1);
			if (!providerRole) {
				set.status = 403;
				return { error: { code: 'PROVIDER_REQUIRED', message: 'Akun ini belum memiliki akses penyedia jasa.' } };
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
					location: services.location,
					createdAt: services.createdAt,
					updatedAt: services.updatedAt
				})
				.from(services)
				.where(eq(services.ownerId, account.id))
				.orderBy(desc(services.updatedAt), desc(services.id));

			return { data: rows };
		})
		.post(
			'/',
			async ({ body, request, set }) => {
				if (!database) {
					set.status = 503;
					return {
						error: {
							code: 'DATABASE_UNAVAILABLE',
							message: 'Pengelolaan jasa belum tersedia karena koneksi database belum dikonfigurasi.'
						}
					};
				}

				const account = await getAuthenticatedUser(database, request.headers.get('cookie'));
				if (!account) {
					set.status = 401;
					return { error: { code: 'UNAUTHENTICATED', message: 'Silakan masuk terlebih dahulu.' } };
				}

				const [providerRole] = await database
					.select({ userId: userRoles.userId })
					.from(userRoles)
					.where(and(eq(userRoles.userId, account.id), eq(userRoles.role, 'provider')))
					.limit(1);
				if (!providerRole) {
					set.status = 403;
					return { error: { code: 'PROVIDER_REQUIRED', message: 'Akun ini belum memiliki akses penyedia jasa.' } };
				}

				const fields = normalizedFields(body);
				if (fields.title.length < 3 || fields.description.length < 20 || fields.category.length < 2 || fields.location.length < 2) {
					set.status = 422;
					return {
						error: {
							code: 'INVALID_SERVICE_FIELDS',
							message: 'Periksa kembali nama, deskripsi, kategori, dan lokasi jasa.'
						}
					};
				}

				const [created] = await database
					.insert(services)
					.values({ ...fields, ownerId: account.id, status: 'draft' })
					.returning();

				if (!created) throw new Error('Service creation did not return a record.');
				set.status = 201;
				return { data: created };
			},
			{ body: createBody }
		)
		.patch(
			'/:id',
			async ({ body, params, request, set }) => {
				if (!database) {
					set.status = 503;
					return {
						error: {
							code: 'DATABASE_UNAVAILABLE',
							message: 'Pengelolaan jasa belum tersedia karena koneksi database belum dikonfigurasi.'
						}
					};
				}

				const account = await getAuthenticatedUser(database, request.headers.get('cookie'));
				if (!account) {
					set.status = 401;
					return { error: { code: 'UNAUTHENTICATED', message: 'Silakan masuk terlebih dahulu.' } };
				}

				const [providerRole] = await database
					.select({ userId: userRoles.userId })
					.from(userRoles)
					.where(and(eq(userRoles.userId, account.id), eq(userRoles.role, 'provider')))
					.limit(1);
				if (!providerRole) {
					set.status = 403;
					return { error: { code: 'PROVIDER_REQUIRED', message: 'Akun ini belum memiliki akses penyedia jasa.' } };
				}

				const fields = normalizedFields(body);
				if (fields.title.length < 3 || fields.description.length < 20 || fields.category.length < 2 || fields.location.length < 2) {
					set.status = 422;
					return {
						error: {
							code: 'INVALID_SERVICE_FIELDS',
							message: 'Periksa kembali nama, deskripsi, kategori, dan lokasi jasa.'
						}
					};
				}

				const [existing] = await database
					.select({ status: services.status })
					.from(services)
					.where(and(eq(services.id, params.id), eq(services.ownerId, account.id)))
					.limit(1);
				if (!existing) {
					set.status = 404;
					return { error: { code: 'SERVICE_NOT_FOUND', message: 'Jasa tidak ditemukan pada akun ini.' } };
				}
				if (existing.status === 'suspended') {
					set.status = 403;
					return {
						error: {
							code: 'SERVICE_SUSPENDED',
							message: 'Jasa yang ditangguhkan hanya dapat diaktifkan kembali oleh admin.'
						}
					};
				}

				const [updated] = await database
					.update(services)
					.set({ ...fields, status: body.status, updatedAt: new Date() })
					.where(and(eq(services.id, params.id), eq(services.ownerId, account.id)))
					.returning();

				if (!updated) {
					set.status = 404;
					return { error: { code: 'SERVICE_NOT_FOUND', message: 'Jasa tidak ditemukan pada akun ini.' } };
				}

				return { data: updated };
			},
			{ params: uuidParams, body: updateBody }
		)
		.delete(
			'/:id',
			async ({ params, request, set }) => {
				if (!database) {
					set.status = 503;
					return {
						error: {
							code: 'DATABASE_UNAVAILABLE',
							message: 'Pengelolaan jasa belum tersedia karena koneksi database belum dikonfigurasi.'
						}
					};
				}

				const account = await getAuthenticatedUser(database, request.headers.get('cookie'));
				if (!account) {
					set.status = 401;
					return { error: { code: 'UNAUTHENTICATED', message: 'Silakan masuk terlebih dahulu.' } };
				}

				const [providerRole] = await database
					.select({ userId: userRoles.userId })
					.from(userRoles)
					.where(and(eq(userRoles.userId, account.id), eq(userRoles.role, 'provider')))
					.limit(1);
				if (!providerRole) {
					set.status = 403;
					return { error: { code: 'PROVIDER_REQUIRED', message: 'Akun ini belum memiliki akses penyedia jasa.' } };
				}

				const [archived] = await database
					.update(services)
					.set({ status: 'archived', updatedAt: new Date() })
					.where(and(eq(services.id, params.id), eq(services.ownerId, account.id)))
					.returning({ id: services.id });

				if (!archived) {
					set.status = 404;
					return { error: { code: 'SERVICE_NOT_FOUND', message: 'Jasa tidak ditemukan pada akun ini.' } };
				}

				set.status = 204;
				return;
			},
			{ params: uuidParams }
		);
}
