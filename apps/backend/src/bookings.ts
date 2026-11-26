import { and, desc, eq, gte, lt, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { Elysia, t } from 'elysia';

import { getAuthenticatedUser } from './auth';
import type { createDatabase } from './db/client';
import {
	bookingStatusAuditLogs,
	bookings,
	notifications,
	ownerAvailabilityExceptions,
	ownerWeeklyAvailability,
	services,
	userRoles,
	users
} from './db/schema';
import { publishNotification } from './notifications';

type Database = ReturnType<typeof createDatabase>['db'];

const jakartaTimeFormatter = new Intl.DateTimeFormat('en-US', {
	timeZone: 'Asia/Jakarta',
	weekday: 'short',
	hour: '2-digit',
	minute: '2-digit',
	hourCycle: 'h23'
});
const jakartaDateFormatter = new Intl.DateTimeFormat('en-CA', {
	timeZone: 'Asia/Jakarta',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit'
});
const weekdayNumbers: Record<string, number> = {
	Sun: 0,
	Mon: 1,
	Tue: 2,
	Wed: 3,
	Thu: 4,
	Fri: 5,
	Sat: 6
};

function getJakartaSlot(date: Date): { dayOfWeek: number; startMinute: number; endMinute: number } | null {
	if (!Number.isFinite(date.getTime()) || date.getTime() % 60_000 !== 0) return null;
	const parts = Object.fromEntries(
		jakartaTimeFormatter.formatToParts(date).map(({ type, value }) => [type, value])
	);
	const dayOfWeek = weekdayNumbers[parts.weekday ?? ''];
	const hour = Number(parts.hour);
	const minute = Number(parts.minute);
	if (dayOfWeek === undefined || !Number.isInteger(hour) || minute !== 0) return null;
	const startMinute = hour * 60;
	return { dayOfWeek, startMinute, endMinute: startMinute + 60 };
}

function getJakartaDate(date: Date): string {
	return jakartaDateFormatter.format(date);
}

function isAcceptedSlotConflict(error: unknown): boolean {
	if (typeof error !== 'object' || error === null) return false;
	if (
		'code' in error &&
		error.code === '23505' &&
		'constraint' in error &&
		error.constraint === 'bookings_owner_accepted_slot_unique_idx'
	) {
		return true;
	}
	return 'cause' in error && isAcceptedSlotConflict(error.cause);
}

async function updateBookingStatus(
	database: Database,
	booking: {
		id: string;
		seekerId: string;
		ownerId: string;
		status: typeof bookings.$inferSelect.status;
		requestedAt: Date | null;
	},
	actor: NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>>,
	isSeeker: boolean,
	newStatus: 'accepted' | 'declined' | 'cancelled' | 'completed',
	reason: string | null
) {
	return database.transaction(async (tx) => {
		if (newStatus === 'accepted' && booking.requestedAt) {
			await tx.select({ id: users.id }).from(users).where(eq(users.id, booking.ownerId)).for('update');
			const slot = getJakartaSlot(booking.requestedAt);
			if (!slot || booking.requestedAt.getTime() <= Date.now()) {
				return { error: 'invalid-slot' as const };
			}
			const [exception] = await tx
				.select({
					isAvailable: ownerAvailabilityExceptions.isAvailable,
					startMinute: ownerAvailabilityExceptions.startMinute,
					endMinute: ownerAvailabilityExceptions.endMinute
				})
				.from(ownerAvailabilityExceptions)
				.where(
					and(
						eq(ownerAvailabilityExceptions.ownerId, booking.ownerId),
						eq(ownerAvailabilityExceptions.serviceDate, getJakartaDate(booking.requestedAt))
					)
				)
				.limit(1);
			const [weeklyAvailability] = exception
				? []
				: await tx
						.select({
							isAvailable: ownerWeeklyAvailability.isAvailable,
							startMinute: ownerWeeklyAvailability.startMinute,
							endMinute: ownerWeeklyAvailability.endMinute
						})
						.from(ownerWeeklyAvailability)
						.where(
							and(
								eq(ownerWeeklyAvailability.ownerId, booking.ownerId),
								eq(ownerWeeklyAvailability.dayOfWeek, slot.dayOfWeek)
							)
						)
						.limit(1);
			const availability = exception ?? weeklyAvailability;
			if (
				!availability?.isAvailable ||
				slot.startMinute < availability.startMinute ||
				slot.endMinute > availability.endMinute
			) {
				return { error: 'outside-availability' as const };
			}
			const [acceptedBooking] = await tx
				.select({ id: bookings.id })
				.from(bookings)
				.where(
					and(
						eq(bookings.ownerId, booking.ownerId),
						eq(bookings.requestedAt, booking.requestedAt),
						eq(bookings.status, 'accepted')
					)
				)
				.limit(1);
			if (acceptedBooking) return { error: 'slot-taken' as const };
		}
		const [changed] = await tx
			.update(bookings)
			.set({ status: newStatus, statusReason: reason, updatedAt: new Date() })
			.where(and(eq(bookings.id, booking.id), eq(bookings.status, booking.status)))
			.returning({ id: bookings.id, status: bookings.status, updatedAt: bookings.updatedAt });
		if (!changed) return null;
		await tx.insert(bookingStatusAuditLogs).values({
			bookingId: booking.id,
			actorId: actor.id,
			previousStatus: booking.status,
			newStatus,
			reason
		});
		const recipientId = isSeeker ? booking.ownerId : booking.seekerId;
		const statusLabels: Record<typeof newStatus, string> = {
			accepted: 'diterima',
			declined: 'ditolak',
			cancelled: 'dibatalkan',
			completed: 'ditandai selesai'
		};
		const [notification] = await tx
			.insert(notifications)
			.values({
				userId: recipientId,
				bookingId: booking.id,
				type: 'booking_status_changed',
				title: 'Status pesanan diperbarui',
				message: `${actor.displayName} ${statusLabels[newStatus]} pesanan.${reason ? ` Alasan: ${reason}` : ''}`
			})
			.returning({
				id: notifications.id,
				type: notifications.type,
				createdAt: notifications.createdAt
			});
		return { changed, notification, recipientId };
	});
}

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
const availabilityQuery = t.Object({
	serviceId: t.String({ format: 'uuid' }),
	date: t.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' })
});

export function createBookingsRouter(database?: Database) {
	return new Elysia({ prefix: '/api/bookings' })
		.get(
			'/availability',
			async ({ query, set }) => {
				if (!database) {
					set.status = 503;
					return {
						error: {
							code: 'DATABASE_UNAVAILABLE',
							message: 'Jadwal pesanan belum tersedia karena koneksi database belum dikonfigurasi.'
						}
					};
				}
				const dayStart = new Date(`${query.date}T00:00:00+07:00`);
				if (
					!Number.isFinite(dayStart.getTime()) ||
					jakartaDateFormatter.format(dayStart) !== query.date
				) {
					set.status = 422;
					return {
						error: { code: 'INVALID_AVAILABILITY_DATE', message: 'Tanggal jadwal tidak valid.' }
					};
				}
				const slotDay = getJakartaSlot(dayStart);
				if (!slotDay) {
					set.status = 422;
					return {
						error: { code: 'INVALID_AVAILABILITY_DATE', message: 'Tanggal jadwal tidak valid.' }
					};
				}

				const [service] = await database
					.select({ id: services.id, ownerId: services.ownerId })
					.from(services)
					.innerJoin(users, eq(users.id, services.ownerId))
					.innerJoin(userRoles, eq(userRoles.userId, users.id))
					.where(
						and(
							eq(services.id, query.serviceId),
							eq(services.status, 'active'),
							eq(users.status, 'active'),
							eq(userRoles.role, 'provider')
						)
					)
					.limit(1);
				if (!service) {
					set.status = 404;
					return { error: { code: 'SERVICE_NOT_FOUND', message: 'Jasa yang dipilih tidak tersedia.' } };
				}

				const [exception] = await database
					.select({
						isAvailable: ownerAvailabilityExceptions.isAvailable,
						startMinute: ownerAvailabilityExceptions.startMinute,
						endMinute: ownerAvailabilityExceptions.endMinute
					})
					.from(ownerAvailabilityExceptions)
					.where(
						and(
							eq(ownerAvailabilityExceptions.ownerId, service.ownerId),
							eq(ownerAvailabilityExceptions.serviceDate, query.date)
						)
					)
					.limit(1);
				const [weeklyAvailability] = exception
					? []
					: await database
							.select({
								isAvailable: ownerWeeklyAvailability.isAvailable,
								startMinute: ownerWeeklyAvailability.startMinute,
								endMinute: ownerWeeklyAvailability.endMinute
							})
							.from(ownerWeeklyAvailability)
							.where(
								and(
									eq(ownerWeeklyAvailability.ownerId, service.ownerId),
									eq(ownerWeeklyAvailability.dayOfWeek, slotDay.dayOfWeek)
								)
							)
							.limit(1);
				const availability = exception ?? weeklyAvailability;
				const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
				const occupiedRows = await database
					.select({ requestedAt: bookings.requestedAt })
					.from(bookings)
					.where(
						and(
							eq(bookings.ownerId, service.ownerId),
							eq(bookings.status, 'accepted'),
							gte(bookings.requestedAt, dayStart),
							lt(bookings.requestedAt, dayEnd)
						)
					);
				const occupied = new Set(
					occupiedRows.flatMap(({ requestedAt }) =>
						requestedAt ? [requestedAt.toISOString()] : []
					)
				);
				const currentTime = Date.now();
				const slots =
					availability?.isAvailable
						? Array.from(
								{
									length:
										(availability.endMinute - availability.startMinute) / 60
								},
								(_, index) => {
									const startMinute = availability.startMinute + index * 60;
									const startAt = new Date(
										dayStart.getTime() + startMinute * 60_000
									);
									return {
										startAt,
										startMinute,
										endMinute: startMinute + 60
									};
								}
							)
								.filter(
									(slot) =>
										slot.startAt.getTime() > currentTime &&
										!occupied.has(slot.startAt.toISOString())
								)
								.map((slot) => ({
									startAt: slot.startAt.toISOString(),
									label: `${String(Math.floor(slot.startMinute / 60)).padStart(2, '0')}:00–${String(Math.floor(slot.endMinute / 60)).padStart(2, '0')}:00 WIB`
								}))
						: [];

				return {
					data: {
						date: query.date,
						timezone: 'Asia/Jakarta',
						schedule: exception ? 'exception' : 'weekly',
						slots
					}
				};
			},
			{ query: availabilityQuery }
		)
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
				const requestedAt = body.requestedAt ? new Date(body.requestedAt) : null;
				if (requestedAt && requestedAt.getTime() <= Date.now()) {
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
				if (requestedAt) {
					const slot = getJakartaSlot(requestedAt);
					if (!slot) {
						set.status = 422;
						return {
							error: {
								code: 'INVALID_BOOKING_SLOT',
								message: 'Jadwal harus dimulai tepat pada pergantian jam penuh.'
							}
						};
					}
					const [exception] = await database
						.select({
							isAvailable: ownerAvailabilityExceptions.isAvailable,
							startMinute: ownerAvailabilityExceptions.startMinute,
							endMinute: ownerAvailabilityExceptions.endMinute
						})
						.from(ownerAvailabilityExceptions)
						.where(
							and(
								eq(ownerAvailabilityExceptions.ownerId, service.ownerId),
								eq(
									ownerAvailabilityExceptions.serviceDate,
									getJakartaDate(requestedAt)
								)
							)
						)
						.limit(1);
					const [weeklyAvailability] = exception
						? []
						: await database
								.select({
									isAvailable: ownerWeeklyAvailability.isAvailable,
									startMinute: ownerWeeklyAvailability.startMinute,
									endMinute: ownerWeeklyAvailability.endMinute
								})
								.from(ownerWeeklyAvailability)
								.where(
									and(
										eq(ownerWeeklyAvailability.ownerId, service.ownerId),
										eq(ownerWeeklyAvailability.dayOfWeek, slot.dayOfWeek)
									)
								)
								.limit(1);
					const availability = exception ?? weeklyAvailability;
					if (
						!availability?.isAvailable ||
						slot.startMinute < availability.startMinute ||
						slot.endMinute > availability.endMinute
					) {
						set.status = 409;
						return {
							error: {
								code: 'OUTSIDE_OWNER_AVAILABILITY',
								message: 'Waktu yang dipilih berada di luar jadwal ketersediaan penyedia.'
							}
						};
					}
					const [acceptedBooking] = await database
						.select({ id: bookings.id })
						.from(bookings)
						.where(
							and(
								eq(bookings.ownerId, service.ownerId),
								eq(bookings.requestedAt, requestedAt),
								eq(bookings.status, 'accepted')
							)
						)
						.limit(1);
					if (acceptedBooking) {
						set.status = 409;
						return {
							error: {
								code: 'BOOKING_SLOT_TAKEN',
								message: 'Jadwal tersebut sudah dipesan. Pilih waktu yang berbeda.'
							}
						};
					}
				}

				const booking = await database.transaction(async (tx) => {
					await tx.select({ id: users.id }).from(users).where(eq(users.id, service.ownerId)).for('update');
					if (requestedAt) {
						const slot = getJakartaSlot(requestedAt);
						if (!slot) return { error: 'invalid-slot' as const };
						const [exception] = await tx
							.select({
								isAvailable: ownerAvailabilityExceptions.isAvailable,
								startMinute: ownerAvailabilityExceptions.startMinute,
								endMinute: ownerAvailabilityExceptions.endMinute
							})
							.from(ownerAvailabilityExceptions)
							.where(
								and(
									eq(ownerAvailabilityExceptions.ownerId, service.ownerId),
									eq(
										ownerAvailabilityExceptions.serviceDate,
										getJakartaDate(requestedAt)
									)
								)
							)
							.limit(1);
						const [weeklyAvailability] = exception
							? []
							: await tx
									.select({
										isAvailable: ownerWeeklyAvailability.isAvailable,
										startMinute: ownerWeeklyAvailability.startMinute,
										endMinute: ownerWeeklyAvailability.endMinute
									})
									.from(ownerWeeklyAvailability)
									.where(
										and(
											eq(ownerWeeklyAvailability.ownerId, service.ownerId),
											eq(ownerWeeklyAvailability.dayOfWeek, slot.dayOfWeek)
										)
									)
									.limit(1);
						const availability = exception ?? weeklyAvailability;
						if (
							!availability?.isAvailable ||
							slot.startMinute < availability.startMinute ||
							slot.endMinute > availability.endMinute
						) {
							return { error: 'outside-availability' as const };
						}
						const [acceptedBooking] = await tx
							.select({ id: bookings.id })
							.from(bookings)
							.where(
								and(
									eq(bookings.ownerId, service.ownerId),
									eq(bookings.requestedAt, requestedAt),
									eq(bookings.status, 'accepted')
								)
							)
							.limit(1);
						if (acceptedBooking) return { error: 'slot-taken' as const };
					}
					const [created] = await tx
						.insert(bookings)
						.values({
							serviceId: service.id,
							seekerId: actor.id,
							ownerId: service.ownerId,
							serviceTitle: service.title,
							price: service.price,
							priceUnit: service.priceUnit,
							requestMessage,
							requestedAt,
							requestedLocation
						})
						.returning({
							id: bookings.id,
							serviceId: bookings.serviceId,
							status: bookings.status,
							createdAt: bookings.createdAt
						});
					if (!created) return null;
					const [notification] = await tx
						.insert(notifications)
						.values({
							userId: service.ownerId,
							bookingId: created.id,
							type: 'booking_requested',
							title: 'Permintaan pesanan baru',
							message: `${actor.displayName} mengajukan pesanan untuk jasa “${service.title}”.`
						})
						.returning({
							id: notifications.id,
							type: notifications.type,
							createdAt: notifications.createdAt
						});
					return { booking: created, notification };
				});
				if (booking && 'error' in booking) {
					set.status = booking.error === 'invalid-slot' ? 422 : 409;
					return {
						error: {
							code: booking.error === 'invalid-slot'
								? 'INVALID_BOOKING_SLOT'
								: booking.error === 'slot-taken'
									? 'BOOKING_SLOT_TAKEN'
									: 'OUTSIDE_OWNER_AVAILABILITY',
							message: booking.error === 'invalid-slot'
								? 'Jadwal harus dimulai tepat pada pergantian jam penuh.'
								: booking.error === 'slot-taken'
									? 'Jadwal tersebut sudah dipesan. Pilih waktu yang berbeda.'
									: 'Waktu yang dipilih berada di luar jadwal ketersediaan penyedia.'
						}
					};
				}
				if (!booking?.booking || !booking.notification) {
					set.status = 500;
					return { error: { code: 'BOOKING_CREATE_FAILED', message: 'Permintaan pesanan tidak dapat disimpan.' } };
				}
				publishNotification(service.ownerId, booking.notification);
				set.status = 201;
				return { data: booking.booking };
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
						status: bookings.status,
						requestedAt: bookings.requestedAt
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

				let updated: Awaited<ReturnType<typeof updateBookingStatus>> | null = null;
				try {
					updated = await updateBookingStatus(database, booking, actor, isSeeker, body.status, reason);
				} catch (cause) {
					if (!isAcceptedSlotConflict(cause)) throw cause;
					set.status = 409;
					return {
						error: {
							code: 'BOOKING_SLOT_TAKEN',
							message: 'Jadwal tersebut baru saja diterima untuk pesanan lain. Pilih waktu yang berbeda.'
						}
					};
				}
				if (updated && 'error' in updated && updated.error) {
					set.status = 409;
					const errors = {
						'invalid-slot': {
							code: 'INVALID_BOOKING_SLOT',
							message: 'Jadwal pesanan sudah lewat atau tidak valid.'
						},
						'outside-availability': {
							code: 'OUTSIDE_OWNER_AVAILABILITY',
							message: 'Jadwal sudah tidak tersedia. Minta penyewa memilih waktu lain.'
						},
						'slot-taken': {
							code: 'BOOKING_SLOT_TAKEN',
							message: 'Jadwal tersebut sudah diterima untuk pesanan lain.'
						}
					};
					return { error: errors[updated.error] };
				}
				if (!updated?.changed || !updated.notification) {
					set.status = 409;
					return { error: { code: 'BOOKING_ALREADY_CHANGED', message: 'Status pesanan baru saja berubah. Muat ulang halaman.' } };
				}
				publishNotification(updated.recipientId, updated.notification);
				return { data: updated.changed };
			},
			{ params: bookingParams, body: changeStatusBody }
		);
}

const seeker = alias(users, 'booking_seeker');
const owner = alias(users, 'booking_owner');
