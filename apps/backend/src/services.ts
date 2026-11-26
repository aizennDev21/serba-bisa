import { and, asc, avg, count, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

import type { createDatabase } from './db/client';
import { reviews, services, userRoles, users } from './db/schema';

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
						message: 'Service categories are temporarily unavailable because the database is not configured.'
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
							message: 'Service listings are temporarily unavailable because the database is not configured.'
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
			async ({ params, set }) => {
				if (!database) {
					set.status = 503;
					return {
						error: {
							code: 'DATABASE_UNAVAILABLE',
							message: 'Service details are temporarily unavailable because the database is not configured.'
						}
					};
				}

				const [service] = await database
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
							message: 'Service listing was not found.'
						}
					};
				}

				const serviceReviews = await database
					.select({
						id: reviews.id,
						rating: reviews.rating,
						comment: reviews.comment,
						createdAt: reviews.createdAt,
						authorName: users.displayName
					})
					.from(reviews)
					.innerJoin(users, eq(reviews.authorId, users.id))
					.where(and(eq(reviews.serviceId, params.id), eq(reviews.status, 'published')))
					.orderBy(desc(reviews.createdAt))
					.limit(20);

				return {
					data: {
						...service,
						rating: Number(service.rating),
						reviewCount: Number(service.reviewCount),
						reviews: serviceReviews
					}
				};
			},
			{ params: uuidParams }
		);
}
