import { and, desc, eq, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { Elysia, t } from 'elysia';

import { getAuthenticatedUser } from './auth';
import type { createDatabase } from './db/client';
import {
	bookingStatusAuditLogs,
	bookings,
	services,
	userRoles,
	users
} from './db/schema';

type Database = ReturnType<typeof createDatabase>['db'];

const bookingParams = t.Object({ bookingId: t.String({ format: 'uuid' }) });
const createBookingBody = t.Object({
	serviceId: t.String({ format: 'uuid' }),
	requestMessage: t.String({ minLength: 20, maxLength: 2000, pattern: '\\S' }),
	requestedAt: t.Optional(t.String({ format: 'date-time' })),
	requestedLocation: t.Optional(t.String({ minLength: 2, maxLength: 200, pattern: '\\S' }))
});
const changeStatusBody = t.Object({
	status: t.Union([
		t.Literal('accepted'),
		t.Literal('declined'),
		t.Literal('cancelled'),
		t.Literal('completed')
	]),
	reason: t.Optional(t.String({ minLength: 8, maxLength: 500, pattern: '\\S' }))
});

export function createBookingsRouter(database?: Database) {
	return new Elysia({ prefix: '/api/bookings' })
		.get('/', async ({ request, set }) => {
			if (!database) {
				set.status = 503;
				return {
					error: {
						code: 'DATABASE_UNAVAILABLE',
						message: 'Daftar pesanan belum tersedia karena koneksi database belum dikonfigurasi.'
					}
				};
			}
			const actor = await getAuthenticatedUser(database, request.headers.get('cookie'));
			if (!actor) {
				set.status = 401;
				return { error: { code: 'UNAUTHENTICATED', message: 'Silakan masuk terlebih dahulu.' } };
			}

			const rows = await database
				.select({
					id: bookings.id,
					serviceId: bookings.serviceId,
					serviceTitle: bookings.serviceTitle,
					price: bookings.price,
					priceUnit: bookings.priceUnit,
					requestMessage: bookings.requestMessage,
					requestedAt: bookings.requestedAt,
					requestedLocation: bookings.requestedLocation,
					status: bookings.status,
					statusReason: bookings.statusReason,
					createdAt: bookings.createdAt,
					updatedAt: bookings.updatedAt,
					seekerId: bookings.seekerId,
					ownerId: bookings.ownerId,
					seekerName: seeker.displayName,
					ownerName: owner.displayName
				})
				.from(bookings)
				.innerJoin(seeker, eq(seeker.id, bookings.seekerId))
				.innerJoin(owner, eq(owner.id, bookings.ownerId))
				.where(or(eq(bookings.seekerId, actor.id), eq(bookings.ownerId, actor.id)))
				.orderBy(desc(bookings.createdAt))
				.limit(100);

			return { data: rows.map(({ seekerId, ownerId, ...booking }) => ({
				...booking,
				viewerRole: seekerId === actor.id ? 'seeker' : ownerId === actor.id ? 'provider' : 'participant'
			})) };
		})
		.post(
			'/',
			async ({ body, request, set }) => {
				if (!database) {
					set.status = 503;
					return {
						error: {
							code: 'DATABASE_UNAVAILABLE',
							message: 'Pemesanan belum tersedia karena koneksi database belum dikonfigurasi.'
						}
					};
				}
				const actor = await getAuthenticatedUser(database, request.headers.get('cookie'));
				if (!actor) {
					set.status = 401;
					return { error: { code: 'UNAUTHENTICATED', message: 'Silakan masuk terlebih dahulu.' } };
				}
				if (!actor.roles.includes('seeker')) {
					set.status = 403;
					return { error: { code: 'SEEKER_REQUIRED', message: 'Hanya penyewa jasa yang dapat membuat permintaan.' } };
				}

				const requestMessage = body.requestMessage.trim();
				const requestedLocation = body.requestedLocation?.trim() || null;
				if (requestMessage.length < 20) {
					set.status = 422;
					return { error: { code: 'INVALID_REQUEST_MESSAGE', message: 'Detail permintaan minimal 20 karakter.' } };
				}
				if (body.requestedAt && new Date(body.requestedAt).getTime() <= Date.now()) {
					set.status = 422;
					return { error: { code: 'INVALID_REQUESTED_AT', message: 'Jadwal yang diminta harus berada di masa depan.' } };
				}

				const [service] = await database
					.select({
						id: services.id,
						ownerId: services.ownerId,
						title: services.title,
						price: services.price,
						priceUnit: services.priceUnit
					})
					.from(services)
					.innerJoin(users, eq(users.id, services.ownerId))
					.innerJoin(userRoles, eq(userRoles.userId, users.id))
					.where(
						and(
							eq(services.id, body.serviceId),
							eq(services.status, 'active'),
							eq(users.status, 'active'),
							eq(userRoles.role, 'provider')
						)
					)
					.limit(1);
				if (!service) {
					set.status = 404;
					return { error: { code: 'SERVICE_NOT_FOUND', message: 'Jasa yang dipesan tidak tersedia.' } };
				}
				if (service.ownerId === actor.id) {
					set.status = 403;
					return { error: { code: 'OWNER_CANNOT_BOOK', message: 'Penyedia tidak dapat memesan jasanya sendiri.' } };
				}

				const [booking] = await database
					.insert(bookings)
					.values({
						serviceId: service.id,
						seekerId: actor.id,
						ownerId: service.ownerId,
						serviceTitle: service.title,
						price: service.price,
						priceUnit: service.priceUnit,
						requestMessage,
						requestedAt: body.requestedAt ? new Date(body.requestedAt) : null,
						requestedLocation
					})
					.returning({
						id: bookings.id,
						serviceId: bookings.serviceId,
						status: bookings.status,
						createdAt: bookings.createdAt
					});
				if (!booking) {
					set.status = 500;
					return { error: { code: 'BOOKING_CREATE_FAILED', message: 'Permintaan pesanan tidak dapat disimpan.' } };
				}
				set.status = 201;
				return { data: booking };
			},
			{ body: createBookingBody }
		)
		.patch(
			'/:bookingId/status',
			async ({ body, params, request, set }) => {
				if (!database) {
					set.status = 503;
					return {
						error: {
							code: 'DATABASE_UNAVAILABLE',
							message: 'Pembaruan pesanan belum tersedia karena koneksi database belum dikonfigurasi.'
						}
					};
				}
				const actor = await getAuthenticatedUser(database, request.headers.get('cookie'));
				if (!actor) {
					set.status = 401;
					return { error: { code: 'UNAUTHENTICATED', message: 'Silakan masuk terlebih dahulu.' } };
				}

				const [booking] = await database
					.select({
						id: bookings.id,
						seekerId: bookings.seekerId,
						ownerId: bookings.ownerId,
						status: bookings.status
					})
					.from(bookings)
					.where(eq(bookings.id, params.bookingId))
					.limit(1);
				if (!booking) {
					set.status = 404;
					return { error: { code: 'BOOKING_NOT_FOUND', message: 'Pesanan tidak ditemukan.' } };
				}

				const isSeeker = booking.seekerId === actor.id && actor.roles.includes('seeker');
				const isOwner = booking.ownerId === actor.id && actor.roles.includes('provider');
				if (!isSeeker && !isOwner) {
					set.status = 403;
					return { error: { code: 'BOOKING_PARTICIPANT_REQUIRED', message: 'Kamu tidak memiliki akses ke pesanan ini.' } };
				}
				const allowed =
					(booking.status === 'requested' &&
						((isOwner && (body.status === 'accepted' || body.status === 'declined')) ||
							(isSeeker && body.status === 'cancelled'))) ||
					(booking.status === 'accepted' &&
						((isOwner && body.status === 'completed') || body.status === 'cancelled'));
				if (!allowed) {
					set.status = 409;
					return { error: { code: 'INVALID_BOOKING_TRANSITION', message: 'Perubahan status pesanan ini tidak diizinkan.' } };
				}

				const reason = body.reason?.trim() || null;
				if ((body.status === 'declined' || body.status === 'cancelled') && (!reason || reason.length < 8)) {
					set.status = 422;
					return {
						error: {
							code: 'BOOKING_REASON_REQUIRED',
							message: 'Alasan penolakan atau pembatalan minimal 8 karakter.'
						}
					};
				}

				const updated = await database.transaction(async (tx) => {
					const [changed] = await tx
						.update(bookings)
						.set({ status: body.status, statusReason: reason, updatedAt: new Date() })
						.where(and(eq(bookings.id, booking.id), eq(bookings.status, booking.status)))
						.returning({ id: bookings.id, status: bookings.status, updatedAt: bookings.updatedAt });
					if (!changed) return null;
					await tx.insert(bookingStatusAuditLogs).values({
						bookingId: booking.id,
						actorId: actor.id,
						previousStatus: booking.status,
						newStatus: body.status,
						reason
					});
					return changed;
				});
				if (!updated) {
					set.status = 409;
					return { error: { code: 'BOOKING_ALREADY_CHANGED', message: 'Status pesanan baru saja berubah. Muat ulang halaman.' } };
				}
				return { data: updated };
			},
			{ params: bookingParams, body: changeStatusBody }
		);
}

const seeker = alias(users, 'booking_seeker');
const owner = alias(users, 'booking_owner');
