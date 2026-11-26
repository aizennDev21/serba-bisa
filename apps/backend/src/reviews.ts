import { and, desc, eq, inArray } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

import { getAuthenticatedUser } from './auth';
import type { createDatabase } from './db/client';
import { reviewReplies, reviews, services, userRoles, users } from './db/schema';

type Database = ReturnType<typeof createDatabase>['db'];

const serviceParams = t.Object({ serviceId: t.String({ format: 'uuid' }) });
const reviewParams = t.Object({ reviewId: t.String({ format: 'uuid' }) });
const createReviewBody = t.Object({
	rating: t.Integer({ minimum: 1, maximum: 5 }),
	comment: t.String({ minLength: 3, maxLength: 2000, pattern: '\\S' })
});
const replyBody = t.Object({
	comment: t.String({ minLength: 2, maxLength: 2000, pattern: '\\S' })
});

export function createReviewsRouter(database?: Database) {
	return new Elysia({ prefix: '/api/reviews' })
		.post(
			'/services/:serviceId',
			async ({ body, params, request, set }) => {
				if (!database) {
					set.status = 503;
					return {
						error: {
							code: 'DATABASE_UNAVAILABLE',
							message: 'Ulasan belum tersedia karena koneksi database belum dikonfigurasi.'
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
					return { error: { code: 'SEEKER_REQUIRED', message: 'Hanya akun penyewa jasa yang dapat memberi ulasan.' } };
				}
				const comment = body.comment.trim();
				if (comment.length < 3) {
					set.status = 422;
					return { error: { code: 'INVALID_REVIEW_COMMENT', message: 'Komentar ulasan minimal 3 karakter setelah spasi dihapus.' } };
				}

				const [service] = await database
					.select({ id: services.id, ownerId: services.ownerId })
					.from(services)
					.innerJoin(users, eq(users.id, services.ownerId))
					.innerJoin(userRoles, eq(userRoles.userId, users.id))
					.where(
						and(
							eq(services.id, params.serviceId),
							eq(services.status, 'active'),
							eq(users.status, 'active'),
							eq(userRoles.role, 'provider')
						)
					)
					.limit(1);

				if (!service) {
					set.status = 404;
					return { error: { code: 'SERVICE_NOT_FOUND', message: 'Jasa yang diulas tidak tersedia.' } };
				}
				if (service.ownerId === actor.id) {
					set.status = 403;
					return { error: { code: 'OWNER_CANNOT_REVIEW', message: 'Penyedia tidak dapat mengulas jasanya sendiri.' } };
				}

				const [review] = await database
					.insert(reviews)
					.values({
						serviceId: service.id,
						authorId: actor.id,
						rating: body.rating,
						comment
					})
					.onConflictDoNothing({ target: [reviews.serviceId, reviews.authorId] })
					.returning({
						id: reviews.id,
						rating: reviews.rating,
						comment: reviews.comment,
						createdAt: reviews.createdAt
					});

				if (!review) {
					set.status = 409;
					return {
						error: {
							code: 'REVIEW_ALREADY_EXISTS',
							message: 'Kamu sudah mengirim ulasan untuk jasa ini.'
						}
					};
				}

				set.status = 201;
				return { data: review };
			},
			{ params: serviceParams, body: createReviewBody }
		)
		.post(
			'/:reviewId/reply',
			async ({ body, params, request, set }) => {
				if (!database) {
					set.status = 503;
					return {
						error: {
							code: 'DATABASE_UNAVAILABLE',
							message: 'Balasan ulasan belum tersedia karena koneksi database belum dikonfigurasi.'
						}
					};
				}

				const actor = await getAuthenticatedUser(database, request.headers.get('cookie'));
				if (!actor) {
					set.status = 401;
					return { error: { code: 'UNAUTHENTICATED', message: 'Silakan masuk terlebih dahulu.' } };
				}
				if (!actor.roles.includes('provider')) {
					set.status = 403;
					return { error: { code: 'PROVIDER_REQUIRED', message: 'Hanya penyedia jasa yang dapat membalas ulasan.' } };
				}
				const comment = body.comment.trim();
				if (comment.length < 2) {
					set.status = 422;
					return { error: { code: 'INVALID_REPLY_COMMENT', message: 'Balasan minimal 2 karakter setelah spasi dihapus.' } };
				}

				const [review] = await database
					.select({ id: reviews.id, ownerId: services.ownerId })
					.from(reviews)
					.innerJoin(services, eq(services.id, reviews.serviceId))
					.innerJoin(users, eq(users.id, services.ownerId))
					.innerJoin(userRoles, eq(userRoles.userId, users.id))
					.where(
						and(
							eq(reviews.id, params.reviewId),
							eq(reviews.status, 'published'),
							eq(services.status, 'active'),
							eq(users.status, 'active'),
							eq(userRoles.role, 'provider')
						)
					)
					.limit(1);

				if (!review) {
					set.status = 404;
					return { error: { code: 'REVIEW_NOT_FOUND', message: 'Ulasan yang ingin dibalas tidak tersedia.' } };
				}
				if (review.ownerId !== actor.id) {
					set.status = 403;
					return { error: { code: 'SERVICE_OWNER_REQUIRED', message: 'Hanya penyedia jasa terkait yang dapat membalas ulasan ini.' } };
				}

				const [reply] = await database
					.insert(reviewReplies)
					.values({
						reviewId: review.id,
						authorId: actor.id,
						comment
					})
					.onConflictDoNothing({ target: reviewReplies.reviewId })
					.returning({
						id: reviewReplies.id,
						comment: reviewReplies.comment,
						createdAt: reviewReplies.createdAt
					});

				if (!reply) {
					set.status = 409;
					return {
						error: {
							code: 'REPLY_ALREADY_EXISTS',
							message: 'Ulasan ini sudah memiliki balasan dari penyedia.'
						}
					};
				}

				set.status = 201;
				return { data: reply };
			},
			{ params: reviewParams, body: replyBody }
		);
}

export async function getPublishedServiceReviews(
	database: Database,
	serviceId: string
) {
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
		.where(and(eq(reviews.serviceId, serviceId), eq(reviews.status, 'published')))
		.orderBy(desc(reviews.createdAt))
		.limit(20);

	if (!serviceReviews.length) return [];

	const replies = await database
		.select({
			reviewId: reviewReplies.reviewId,
			comment: reviewReplies.comment,
			createdAt: reviewReplies.createdAt,
			authorName: users.displayName
		})
		.from(reviewReplies)
		.innerJoin(users, eq(reviewReplies.authorId, users.id))
		.where(inArray(reviewReplies.reviewId, serviceReviews.map(({ id }) => id)));
	const repliesByReviewId = new Map(replies.map((reply) => [reply.reviewId, reply]));

	return serviceReviews.map((review) => ({
		...review,
		reply: repliesByReviewId.get(review.id) ?? null
	}));
}
