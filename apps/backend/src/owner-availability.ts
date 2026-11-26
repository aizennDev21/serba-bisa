import { and, asc, eq, gt } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

import { getAuthenticatedUser } from './auth';
import type { createDatabase } from './db/client';
import { bookings, ownerWeeklyAvailability, userRoles, users } from './db/schema';

type Database = ReturnType<typeof createDatabase>['db'];

const dayAvailability = t.Object({
	dayOfWeek: t.Integer({ minimum: 0, maximum: 6 }),
	isAvailable: t.Boolean(),
	startMinute: t.Integer({ minimum: 0, maximum: 1380 }),
	endMinute: t.Integer({ minimum: 60, maximum: 1440 })
});
const availabilityBody = t.Object({
	days: t.Array(dayAvailability, { minItems: 7, maxItems: 7 })
});

export async function getWeeklyAvailability(database: Database, ownerId: string) {
	const rows = await database
		.select({
			dayOfWeek: ownerWeeklyAvailability.dayOfWeek,
			isAvailable: ownerWeeklyAvailability.isAvailable,
			startMinute: ownerWeeklyAvailability.startMinute,
			endMinute: ownerWeeklyAvailability.endMinute
		})
		.from(ownerWeeklyAvailability)
		.where(eq(ownerWeeklyAvailability.ownerId, ownerId))
		.orderBy(asc(ownerWeeklyAvailability.dayOfWeek));
	const byDay = new Map(rows.map((row) => [row.dayOfWeek, row]));
	return Array.from({ length: 7 }, (_, dayOfWeek) => byDay.get(dayOfWeek) ?? {
		dayOfWeek,
		isAvailable: false,
		startMinute: 480,
		endMinute: 1020
	});
}

export function createOwnerAvailabilityRouter(database?: Database) {
	return new Elysia({ prefix: '/api/owner/availability' })
		.get('/', async ({ request, set }) => {
			if (!database) {
				set.status = 503;
				return {
					error: {
						code: 'DATABASE_UNAVAILABLE',
						message: 'Jadwal belum tersedia karena koneksi database belum dikonfigurasi.'
					}
				};
			}
			const actor = await getAuthenticatedUser(database, request.headers.get('cookie'));
			if (!actor) {
				set.status = 401;
				return { error: { code: 'UNAUTHENTICATED', message: 'Silakan masuk terlebih dahulu.' } };
			}
			const [providerRole] = await database
				.select({ userId: userRoles.userId })
				.from(userRoles)
				.where(and(eq(userRoles.userId, actor.id), eq(userRoles.role, 'provider')))
				.limit(1);
			if (!providerRole) {
				set.status = 403;
				return { error: { code: 'PROVIDER_REQUIRED', message: 'Hanya penyedia jasa yang dapat mengatur jadwal.' } };
			}
			return { data: await getWeeklyAvailability(database, actor.id) };
		})
		.put(
			'/',
			async ({ body, request, set }) => {
				if (!database) {
					set.status = 503;
					return {
						error: {
							code: 'DATABASE_UNAVAILABLE',
							message: 'Jadwal belum tersedia karena koneksi database belum dikonfigurasi.'
						}
					};
				}
				const actor = await getAuthenticatedUser(database, request.headers.get('cookie'));
				if (!actor) {
					set.status = 401;
					return { error: { code: 'UNAUTHENTICATED', message: 'Silakan masuk terlebih dahulu.' } };
				}
				const [providerRole] = await database
					.select({ userId: userRoles.userId })
					.from(userRoles)
					.where(and(eq(userRoles.userId, actor.id), eq(userRoles.role, 'provider')))
					.limit(1);
				if (!providerRole) {
					set.status = 403;
					return { error: { code: 'PROVIDER_REQUIRED', message: 'Hanya penyedia jasa yang dapat mengatur jadwal.' } };
				}
				if (
					new Set(body.days.map(({ dayOfWeek }) => dayOfWeek)).size !== 7 ||
					body.days.some(
						({ isAvailable, startMinute, endMinute }) =>
							startMinute % 60 !== 0 ||
							endMinute % 60 !== 0 ||
							(isAvailable && endMinute <= startMinute)
					)
				) {
					set.status = 422;
					return {
						error: {
							code: 'INVALID_AVAILABILITY',
							message: 'Setiap hari harus unik dan waktu tersedia harus memakai slot satu jam yang valid.'
						}
					};
				}
				const proposedByDay = new Map(body.days.map((day) => [day.dayOfWeek, day]));
				const saved = await database.transaction(async (tx) => {
					await tx.select({ id: users.id }).from(users).where(eq(users.id, actor.id)).for('update');
					const acceptedBookings = await tx
						.select({ requestedAt: bookings.requestedAt })
						.from(bookings)
						.where(
							and(
								eq(bookings.ownerId, actor.id),
								eq(bookings.status, 'accepted'),
								gt(bookings.requestedAt, new Date())
							)
						);
					const conflictsWithAcceptedBooking = acceptedBookings.some(({ requestedAt }) => {
						if (!requestedAt) return false;
						const parts = Object.fromEntries(
							new Intl.DateTimeFormat('en-US', {
								timeZone: 'Asia/Jakarta',
								weekday: 'short',
								hour: '2-digit',
								minute: '2-digit',
								hourCycle: 'h23'
							})
								.formatToParts(requestedAt)
								.map(({ type, value }) => [type, value])
						);
						const weekday: Record<string, number> = {
							Sun: 0,
							Mon: 1,
							Tue: 2,
							Wed: 3,
							Thu: 4,
							Fri: 5,
							Sat: 6
						};
						const day = proposedByDay.get(weekday[parts.weekday ?? '']);
						const startMinute = Number(parts.hour) * 60;
						return (
							!day?.isAvailable ||
							startMinute < day.startMinute ||
							startMinute + 60 > day.endMinute
						);
					});
					if (conflictsWithAcceptedBooking) return false;
					for (const day of body.days) {
						await tx
							.insert(ownerWeeklyAvailability)
							.values({ ownerId: actor.id, ...day, updatedAt: new Date() })
							.onConflictDoUpdate({
								target: [ownerWeeklyAvailability.ownerId, ownerWeeklyAvailability.dayOfWeek],
								set: {
									isAvailable: day.isAvailable,
									startMinute: day.startMinute,
									endMinute: day.endMinute,
									updatedAt: new Date()
								}
							});
					}
					return true;
				});
				if (!saved) {
					set.status = 409;
					return {
						error: {
							code: 'AVAILABILITY_CONFLICTS_WITH_BOOKING',
							message: 'Jadwal tidak dapat diubah karena bertabrakan dengan pesanan yang sudah diterima.'
						}
					};
				}
				return { data: await getWeeklyAvailability(database, actor.id) };
			},
			{ body: availabilityBody }
		);
}
