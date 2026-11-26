import { and, asc, avg, count, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

import { getAuthenticatedUser } from './auth';
import type { createDatabase } from './db/client';
import { bookings, ownerWeeklyAvailability, reviews, services, userRoles, users } from './db/schema';
import { getPublishedServiceReviews } from './reviews';

type Database = ReturnType<typeof createDatabase>['db'];

const serviceQuery = t.Object({
	q: t.Optional(t.String({ maxLength: 100 })),
	category: t.Optional(t.String({ maxLength: 80 })),
	location: t.Optional(t.String({ maxLength: 100 })),
	page: t.Optional(t.Numeric({ minimum: 1, maximum: 10000 })),
	limit: t.Optional(t.Numeric({ minimum: 1, maximum: 50 }))
});

const uuidParams = t.Object({
	id: t.String({ format: 'uuid' })
});

function publicServiceFilter(query: {
	q?: string;
	category?: string;
	location?: string;
}) {
	const filters = [eq(services.status, 'active' as const)];

	if (query.category) {
		filters.push(eq(services.category, query.category));
	}

	if (query.location) {
		filters.push(ilike(services.location, `%${query.location}%`));
	}

	if (query.q) {
		const pattern = `%${query.q}%`;
		const searchFilter = or(
			ilike(services.title, pattern),
			ilike(services.description, pattern),
			ilike(services.category, pattern),
			ilike(services.location, pattern)
		);

		if (searchFilter) {
			filters.push(searchFilter);
		}
	}

	return and(...filters);
}

export function createServicesRouter(database?: Database) {
	return new Elysia({ prefix: '/api/services' })
		.get('/categories', async ({ set }) => {
			if (!database) {
				set.status = 503;
				return {
					error: {
						code: 'DATABASE_UNAVAILABLE',
						message: 'Kategori jasa belum tersedia karena koneksi database belum dikonfigurasi.'
					}
				};
			}

			const rows = await database
				.selectDistinct({ category: services.category })
				.from(services)
				.innerJoin(users, eq(services.ownerId, users.id))
				.innerJoin(userRoles, eq(userRoles.userId, users.id))
				.where(
					and(
						eq(services.status, 'active'),
						eq(users.status, 'active'),
						eq(userRoles.role, 'provider')
					)
				)
				.orderBy(asc(services.category));

			return { data: rows.map((row) => row.category) };
		})
		.get(
			'/',
			async ({ query, set }) => {
				if (!database) {
					set.status = 503;
					return {
						error: {
							code: 'DATABASE_UNAVAILABLE',
							message: 'Daftar jasa belum tersedia karena koneksi database belum dikonfigurasi.'
						}
					};
				}

				const page = query.page ?? 1;
				const limit = query.limit ?? 12;
				const filter = publicServiceFilter(query);
				const visibleOwnerFilter = and(
					filter,
					eq(users.status, 'active'),
					eq(userRoles.role, 'provider')
				);
				const [rows, totals] = await Promise.all([
					database
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
							ownerName: users.displayName,
							rating: sql<number>`coalesce(avg(${reviews.rating}), 0)::float`,
							reviewCount: count(reviews.id)
						})
						.from(services)
						.innerJoin(users, eq(services.ownerId, users.id))
						.innerJoin(userRoles, eq(userRoles.userId, users.id))
						.leftJoin(
							reviews,
							and(eq(reviews.serviceId, services.id), eq(reviews.status, 'published'))
						)
						.where(visibleOwnerFilter)
						.groupBy(services.id, users.displayName)
						.orderBy(desc(services.createdAt), asc(services.id))
						.limit(limit)
						.offset((page - 1) * limit),
					database
						.select({ total: count() })
						.from(services)
						.innerJoin(users, eq(services.ownerId, users.id))
						.innerJoin(userRoles, eq(userRoles.userId, users.id))
						.where(visibleOwnerFilter)
				]);

				const total = totals[0]?.total ?? 0;

				return {
					data: rows.map((row) => ({
						...row,
						rating: Number(row.rating),
						reviewCount: Number(row.reviewCount)
					})),
					pagination: {
						page,
						limit,
						total,
						totalPages: Math.ceil(total / limit)
					}
				};
			},
			{ query: serviceQuery }
		)
		.get(
			'/:id',
			async ({ params, request, set }) => {
				if (!database) {
					set.status = 503;
					return {
						error: {
							code: 'DATABASE_UNAVAILABLE',
							message: 'Detail jasa belum tersedia karena koneksi database belum dikonfigurasi.'
						}
					};
				}

				const [service] = await database
					.select({
						id: services.id,
						ownerId: services.ownerId,
						title: services.title,
						description: services.description,
						category: services.category,
						price: services.price,
						priceUnit: services.priceUnit,
						status: services.status,
						location: services.location,
						createdAt: services.createdAt,
						ownerName: users.displayName,
						rating: sql<number>`coalesce(avg(${reviews.rating}), 0)::float`,
						reviewCount: count(reviews.id)
					})
					.from(services)
					.innerJoin(users, eq(services.ownerId, users.id))
					.innerJoin(userRoles, eq(userRoles.userId, users.id))
					.leftJoin(
						reviews,
						and(eq(reviews.serviceId, services.id), eq(reviews.status, 'published'))
					)
					.where(
						and(
							eq(services.id, params.id),
							eq(services.status, 'active'),
							eq(users.status, 'active'),
							eq(userRoles.role, 'provider')
						)
					)
					.groupBy(services.id, users.displayName)
					.limit(1);

				if (!service) {
					set.status = 404;
					return {
						error: {
							code: 'SERVICE_NOT_FOUND',
							message: 'Jasa yang kamu cari tidak ditemukan.'
						}
					};
				}

				const [serviceReviews, viewer] = await Promise.all([
					getPublishedServiceReviews(database, params.id),
					getAuthenticatedUser(database, request.headers.get('cookie'))
				]);
				const availabilityRows = await database
					.select({
						dayOfWeek: ownerWeeklyAvailability.dayOfWeek,
						startMinute: ownerWeeklyAvailability.startMinute,
						endMinute: ownerWeeklyAvailability.endMinute
					})
					.from(ownerWeeklyAvailability)
					.where(eq(ownerWeeklyAvailability.ownerId, service.ownerId))
					.orderBy(asc(ownerWeeklyAvailability.dayOfWeek), asc(ownerWeeklyAvailability.startMinute));
				const availabilityByDay = new Map<number, { startMinute: number; endMinute: number }[]>();
				for (const { dayOfWeek, startMinute, endMinute } of availabilityRows) {
					const intervals = availabilityByDay.get(dayOfWeek) ?? [];
					intervals.push({ startMinute, endMinute });
					availabilityByDay.set(dayOfWeek, intervals);
				}
				const weeklyAvailability = Array.from({ length: 7 }, (_, dayOfWeek) => ({
					dayOfWeek,
					intervals: availabilityByDay.get(dayOfWeek) ?? []
				}));
				const viewerHasReview =
					viewer &&
					(
						await database
							.select({ id: reviews.id })
							.from(reviews)
							.where(
								and(
									eq(reviews.serviceId, params.id),
									eq(reviews.authorId, viewer.id)
								)
							)
							.limit(1)
					).length > 0;
				const viewerHasCompletedBooking =
					viewer &&
					(
						await database
							.select({ id: bookings.id })
							.from(bookings)
							.where(
								and(
									eq(bookings.serviceId, params.id),
									eq(bookings.seekerId, viewer.id),
									eq(bookings.status, 'completed')
								)
							)
							.limit(1)
					).length > 0;
				const { ownerId, ...publicService } = service;

				return {
					data: {
						...publicService,
						rating: Number(service.rating),
						reviewCount: Number(service.reviewCount),
						reviews: serviceReviews,
						weeklyAvailability,
						viewer: {
							isAuthenticated: Boolean(viewer),
							canReview:
								Boolean(viewer?.roles.includes('seeker')) &&
								viewer?.id !== ownerId &&
								Boolean(viewerHasCompletedBooking) &&
								!viewerHasReview,
							canReply:
								Boolean(viewer?.roles.includes('provider')) &&
								viewer?.id === ownerId,
							canStartChat:
								Boolean(viewer?.roles.includes('seeker')) &&
								viewer?.id !== ownerId
						}
					}
				};
			},
			{ params: uuidParams }
		);
}
