import { and, asc, eq, gte, gt, lt } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

import { getAuthenticatedUser } from './auth';
import type { createDatabase } from './db/client';
import {
	bookings,
	ownerAvailabilityExceptions,
	ownerWeeklyAvailability,
	userRoles,
	users
} from './db/schema';

type Database = ReturnType<typeof createDatabase>['db'];

const jakartaDateFormatter = new Intl.DateTimeFormat('en-CA', {
	timeZone: 'Asia/Jakarta',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit'
});
const jakartaTimeFormatter = new Intl.DateTimeFormat('en-US', {
	timeZone: 'Asia/Jakarta',
	weekday: 'short',
	hour: '2-digit',
	minute: '2-digit',
	hourCycle: 'h23'
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

const availabilityInterval = t.Object({
	startMinute: t.Integer({ minimum: 0, maximum: 1380 }),
	endMinute: t.Integer({ minimum: 60, maximum: 1440 })
});
const dayAvailability = t.Object({
	dayOfWeek: t.Integer({ minimum: 0, maximum: 6 }),
	intervals: t.Array(availabilityInterval, { maxItems: 24 })
});
const availabilityBody = t.Object({
	days: t.Array(dayAvailability, { minItems: 7, maxItems: 7 })
});
const exceptionBody = t.Object({
	date: t.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' }),
	isAvailable: t.Boolean(),
	intervals: t.Array(availabilityInterval, { maxItems: 24 })
});
const exceptionParams = t.Object({
	date: t.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' })
});

function getJakartaSlot(date: Date): { dayOfWeek: number; startMinute: number } | null {
	if (!Number.isFinite(date.getTime())) return null;
	const parts = Object.fromEntries(
		jakartaTimeFormatter.formatToParts(date).map(({ type, value }) => [type, value])
	);
	const dayOfWeek = weekdayNumbers[parts.weekday ?? ''];
	const hour = Number(parts.hour);
	const minute = Number(parts.minute);
	if (dayOfWeek === undefined || !Number.isInteger(hour) || minute !== 0) return null;
	return { dayOfWeek, startMinute: hour * 60 };
}

function getValidExceptionDate(date: string): Date | null {
	const dayStart = new Date(`${date}T00:00:00+07:00`);
	if (!Number.isFinite(dayStart.getTime()) || jakartaDateFormatter.format(dayStart) !== date) {
		return null;
	}
	const today = jakartaDateFormatter.format(new Date());
	const lastAllowed = new Date(`${today}T00:00:00+07:00`);
	lastAllowed.setUTCDate(lastAllowed.getUTCDate() + 365);
	const maxDate = jakartaDateFormatter.format(lastAllowed);
	return date >= today && date <= maxDate ? dayStart : null;
}

function slotFitsAvailability(
	requestedAt: Date,
		intervals: { startMinute: number; endMinute: number }[]
): boolean {
	const slot = getJakartaSlot(requestedAt);
	return Boolean(
		slot &&
				intervals.some(
					({ startMinute, endMinute }) =>
						slot.startMinute >= startMinute && slot.startMinute + 60 <= endMinute
				)
		);
}

export async function getWeeklyAvailability(database: Database, ownerId: string) {
		const rows = await database
		.select({
			dayOfWeek: ownerWeeklyAvailability.dayOfWeek,
			startMinute: ownerWeeklyAvailability.startMinute,
			endMinute: ownerWeeklyAvailability.endMinute
		})
		.from(ownerWeeklyAvailability)
		.where(eq(ownerWeeklyAvailability.ownerId, ownerId))
		.orderBy(asc(ownerWeeklyAvailability.dayOfWeek), asc(ownerWeeklyAvailability.startMinute));
		const byDay = new Map<number, { startMinute: number; endMinute: number }[]>();
		for (const { dayOfWeek, startMinute, endMinute } of rows) {
			const intervals = byDay.get(dayOfWeek) ?? [];
			intervals.push({ startMinute, endMinute });
			byDay.set(dayOfWeek, intervals);
		}
		return Array.from({ length: 7 }, (_, dayOfWeek) => ({
			dayOfWeek,
			intervals: byDay.get(dayOfWeek) ?? []
		}));
}

function isValidIntervals(intervals: { startMinute: number; endMinute: number }[]): boolean {
		const sorted = [...intervals].sort((a, b) => a.startMinute - b.startMinute);
		return (
			sorted.every(
				({ startMinute, endMinute }) =>
					startMinute % 60 === 0 &&
					endMinute % 60 === 0 &&
					endMinute > startMinute
			) &&
			sorted.every((interval, index) => index === 0 || interval.startMinute >= sorted[index - 1]!.endMinute)
		);
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
					body.days.some(({ intervals }) => !isValidIntervals(intervals))
				) {
					set.status = 422;
					return {
						error: {
							code: 'INVALID_AVAILABILITY',
							message: 'Setiap hari harus unik. Rentang jam harus berupa slot satu jam dan tidak boleh saling bertumpuk.'
						}
					};
				}
				const proposedByDay = new Map(
					body.days.map(({ dayOfWeek, intervals }) => [dayOfWeek, intervals])
				);
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
					const exceptions = await tx
						.select({
							date: ownerAvailabilityExceptions.serviceDate,
							isAvailable: ownerAvailabilityExceptions.isAvailable,
							startMinute: ownerAvailabilityExceptions.startMinute,
							endMinute: ownerAvailabilityExceptions.endMinute
						})
						.from(ownerAvailabilityExceptions)
						.where(
							and(
								eq(ownerAvailabilityExceptions.ownerId, actor.id),
								gte(
									ownerAvailabilityExceptions.serviceDate,
									jakartaDateFormatter.format(new Date())
								)
							)
						);
					const exceptionsByDate = new Map<string, { isAvailable: boolean; startMinute: number; endMinute: number }[]>();
					for (const exception of exceptions) {
						const dateRows = exceptionsByDate.get(exception.date) ?? [];
						dateRows.push(exception);
						exceptionsByDate.set(exception.date, dateRows);
					}
					const conflictsWithAcceptedBooking = acceptedBookings.some(({ requestedAt }) => {
						if (!requestedAt) return false;
						const slot = getJakartaSlot(requestedAt);
						if (!slot) return true;
						const exception = exceptionsByDate.get(jakartaDateFormatter.format(requestedAt));
						const intervals = exception
							? exception.filter((item) => item.isAvailable)
							: proposedByDay.get(slot.dayOfWeek) ?? [];
						return !slotFitsAvailability(requestedAt, intervals);
					});
					if (conflictsWithAcceptedBooking) return false;
					for (const day of body.days) {
						await tx
							.delete(ownerWeeklyAvailability)
							.where(
								and(
									eq(ownerWeeklyAvailability.ownerId, actor.id),
									eq(ownerWeeklyAvailability.dayOfWeek, day.dayOfWeek)
								)
							);
						if (day.intervals.length) {
							await tx.insert(ownerWeeklyAvailability).values(
								day.intervals.map((interval) => ({
									ownerId: actor.id,
									dayOfWeek: day.dayOfWeek,
									...interval,
									updatedAt: new Date()
								}))
							);
						}
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
		)
		.get('/exceptions', async ({ request, set }) => {
			if (!database) {
				set.status = 503;
				return {
					error: {
						code: 'DATABASE_UNAVAILABLE',
						message: 'Pengecualian jadwal belum tersedia karena koneksi database belum dikonfigurasi.'
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
			const exceptions = await database
				.select({
					date: ownerAvailabilityExceptions.serviceDate,
					isAvailable: ownerAvailabilityExceptions.isAvailable,
					startMinute: ownerAvailabilityExceptions.startMinute,
					endMinute: ownerAvailabilityExceptions.endMinute
				})
				.from(ownerAvailabilityExceptions)
				.where(
					and(
						eq(ownerAvailabilityExceptions.ownerId, actor.id),
						gte(ownerAvailabilityExceptions.serviceDate, jakartaDateFormatter.format(new Date()))
					)
				)
				.orderBy(
					asc(ownerAvailabilityExceptions.serviceDate),
					asc(ownerAvailabilityExceptions.startMinute)
				)
				.limit(8784);
			const byDate = new Map<string, { isAvailable: boolean; startMinute: number; endMinute: number }[]>();
			for (const { date, ...interval } of exceptions) {
				const intervals = byDate.get(date) ?? [];
				intervals.push(interval);
				byDate.set(date, intervals);
			}
			return {
				data: Array.from(byDate, ([date, rows]) => ({
					date,
					isAvailable: rows.some((row) => row.isAvailable),
					intervals: rows.filter(({ isAvailable }) => isAvailable).map(({ startMinute, endMinute }) => ({
						startMinute,
						endMinute
					}))
				}))
			};
		})
		.put(
			'/exceptions',
			async ({ body, request, set }) => {
				if (!database) {
					set.status = 503;
					return {
						error: {
							code: 'DATABASE_UNAVAILABLE',
							message: 'Pengecualian jadwal belum tersedia karena koneksi database belum dikonfigurasi.'
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
				const dayStart = getValidExceptionDate(body.date);
				if (
					!dayStart ||
					!isValidIntervals(body.intervals) ||
					(body.isAvailable !== (body.intervals.length > 0))
				) {
					set.status = 422;
					return {
						error: {
							code: 'INVALID_AVAILABILITY_EXCEPTION',
							message: 'Tanggal harus dalam 365 hari ke depan. Jadwal harus memiliki rentang yang valid atau berstatus libur.'
						}
					};
				}
				const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
				const dayOfWeek = getJakartaSlot(dayStart)?.dayOfWeek;
				if (dayOfWeek === undefined) {
					set.status = 422;
					return {
						error: {
							code: 'INVALID_AVAILABILITY_EXCEPTION',
							message: 'Tanggal pengecualian tidak valid.'
						}
					};
				}
				const saved = await database.transaction(async (tx) => {
					await tx.select({ id: users.id }).from(users).where(eq(users.id, actor.id)).for('update');
					const acceptedBookings = await tx
						.select({ requestedAt: bookings.requestedAt })
						.from(bookings)
						.where(
							and(
								eq(bookings.ownerId, actor.id),
								eq(bookings.status, 'accepted'),
								gt(bookings.requestedAt, new Date()),
								gte(bookings.requestedAt, dayStart),
								lt(bookings.requestedAt, dayEnd)
							)
						);
					const conflicts = acceptedBookings.some(({ requestedAt }) => {
						if (!requestedAt) return false;
						return (
							!body.isAvailable ||
							!slotFitsAvailability(requestedAt, body.intervals)
						);
					});
					if (conflicts) return false;
					await tx
						.delete(ownerAvailabilityExceptions)
						.where(
							and(
								eq(ownerAvailabilityExceptions.ownerId, actor.id),
								eq(ownerAvailabilityExceptions.serviceDate, body.date)
							)
						);
					await tx.insert(ownerAvailabilityExceptions).values(
						(body.isAvailable
							? body.intervals.map((interval) => ({ ...interval, isAvailable: true }))
							: [{ startMinute: 480, endMinute: 1020, isAvailable: false }]
						).map((interval) => ({
							ownerId: actor.id,
							serviceDate: body.date,
							...interval,
							updatedAt: new Date()
						}))
					);
					return true;
				});
				if (!saved) {
					set.status = 409;
					return {
						error: {
							code: 'AVAILABILITY_CONFLICTS_WITH_BOOKING',
							message: 'Pengecualian tidak dapat disimpan karena bertabrakan dengan pesanan yang sudah diterima.'
						}
					};
				}
				return {
					data: {
						date: body.date,
						isAvailable: body.isAvailable,
						intervals: body.intervals
					}
				};
			},
			{ body: exceptionBody }
		)
		.delete(
			'/exceptions/:date',
			async ({ params, request, set }) => {
				if (!database) {
					set.status = 503;
					return {
						error: {
							code: 'DATABASE_UNAVAILABLE',
							message: 'Pengecualian jadwal belum tersedia karena koneksi database belum dikonfigurasi.'
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
				const dayStart = getValidExceptionDate(params.date);
				const dayOfWeek = dayStart ? getJakartaSlot(dayStart)?.dayOfWeek : undefined;
				if (!dayStart || dayOfWeek === undefined) {
					set.status = 422;
					return {
						error: {
							code: 'INVALID_AVAILABILITY_EXCEPTION',
							message: 'Tanggal harus dalam 365 hari ke depan.'
						}
					};
				}
				const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
				const deleted = await database.transaction(async (tx) => {
					await tx.select({ id: users.id }).from(users).where(eq(users.id, actor.id)).for('update');
					const weekly = await tx
						.select({
							startMinute: ownerWeeklyAvailability.startMinute,
							endMinute: ownerWeeklyAvailability.endMinute
						})
						.from(ownerWeeklyAvailability)
						.where(
							and(
								eq(ownerWeeklyAvailability.ownerId, actor.id),
								eq(ownerWeeklyAvailability.dayOfWeek, dayOfWeek)
							)
						);
					const acceptedBookings = await tx
						.select({ requestedAt: bookings.requestedAt })
						.from(bookings)
						.where(
							and(
								eq(bookings.ownerId, actor.id),
								eq(bookings.status, 'accepted'),
								gt(bookings.requestedAt, new Date()),
								gte(bookings.requestedAt, dayStart),
								lt(bookings.requestedAt, dayEnd)
							)
						);
					if (
						acceptedBookings.some(({ requestedAt }) => requestedAt && !slotFitsAvailability(requestedAt, weekly))
					) {
						return false;
					}
					await tx
						.delete(ownerAvailabilityExceptions)
						.where(
							and(
								eq(ownerAvailabilityExceptions.ownerId, actor.id),
								eq(ownerAvailabilityExceptions.serviceDate, params.date)
							)
						);
					return true;
				});
				if (!deleted) {
					set.status = 409;
					return {
						error: {
							code: 'AVAILABILITY_CONFLICTS_WITH_BOOKING',
							message: 'Pengecualian tidak dapat dihapus karena akan mengganggu pesanan yang sudah diterima.'
						}
					};
				}
				return { data: { date: params.date, deleted: true } };
			},
			{ params: exceptionParams }
		);
}
