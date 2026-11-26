import {
	check,
	pgEnum,
	pgTable,
	index,
	primaryKey,
	integer,
	numeric,
	text,
	timestamp,
	uuid
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const userStatus = pgEnum('user_status', ['active', 'suspended']);
export const userRole = pgEnum('user_role', ['seeker', 'provider', 'admin', 'super_admin']);
export const serviceStatus = pgEnum('service_status', [
	'draft',
	'active',
	'unavailable',
	'suspended',
	'archived'
]);
export const servicePriceUnit = pgEnum('service_price_unit', [
	'hour',
	'visit',
	'project',
	'session',
	'fixed'
]);
export const reviewStatus = pgEnum('review_status', ['published', 'hidden', 'removed']);

export const users = pgTable('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	email: text('email').notNull().unique(),
	displayName: text('display_name').notNull(),
	status: userStatus('status').notNull().default('active'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const userCredentials = pgTable('user_credentials', {
	userId: uuid('user_id')
		.primaryKey()
		.references(() => users.id, { onDelete: 'cascade' }),
	passwordHash: text('password_hash').notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const authSessions = pgTable(
	'auth_sessions',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		tokenHash: text('token_hash').notNull().unique(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [index('auth_sessions_user_id_idx').on(table.userId)]
);

export const userRoles = pgTable(
	'user_roles',
	{
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		role: userRole('role').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [primaryKey({ columns: [table.userId, table.role] })]
);

export const services = pgTable(
	'services',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		ownerId: uuid('owner_id')
			.notNull()
			.references(() => users.id, { onDelete: 'restrict' }),
		title: text('title').notNull(),
		description: text('description').notNull(),
		category: text('category').notNull(),
		price: integer('price').notNull(),
		priceUnit: servicePriceUnit('price_unit').notNull(),
		status: serviceStatus('status').notNull().default('draft'),
		statusBeforeSuspension: serviceStatus('status_before_suspension'),
		location: text('location').notNull(),
		latitude: numeric('latitude', { precision: 9, scale: 6 }),
		longitude: numeric('longitude', { precision: 9, scale: 6 }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		index('services_status_created_at_idx').on(table.status, table.createdAt),
		index('services_category_idx').on(table.category),
		index('services_owner_id_idx').on(table.ownerId),
		check(
			'services_coordinates_pair_check',
			sql`(${table.latitude} is null) = (${table.longitude} is null)`
		),
		check(
			'services_latitude_range_check',
			sql`${table.latitude} is null or ${table.latitude} between -90 and 90`
		),
		check(
			'services_longitude_range_check',
			sql`${table.longitude} is null or ${table.longitude} between -180 and 180`
		),
		check('services_price_nonnegative_check', sql`${table.price} >= 0`)
	]
);

export const moderationAuditLogs = pgTable(
	'moderation_audit_logs',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		serviceId: uuid('service_id')
			.notNull()
			.references(() => services.id, { onDelete: 'restrict' }),
		actorId: uuid('actor_id')
			.notNull()
			.references(() => users.id, { onDelete: 'restrict' }),
		action: text('action').notNull(),
		reason: text('reason').notNull(),
		previousStatus: serviceStatus('previous_status'),
		newStatus: serviceStatus('new_status').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		index('moderation_audit_logs_service_created_at_idx').on(table.serviceId, table.createdAt),
		index('moderation_audit_logs_actor_created_at_idx').on(table.actorId, table.createdAt)
	]
);

export const userAdminAuditLogs = pgTable(
	'user_admin_audit_logs',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		targetUserId: uuid('target_user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'restrict' }),
		actorId: uuid('actor_id')
			.notNull()
			.references(() => users.id, { onDelete: 'restrict' }),
		action: text('action').notNull(),
		reason: text('reason').notNull(),
		previousStatus: userStatus('previous_status'),
		newStatus: userStatus('new_status'),
		role: userRole('role'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		index('user_admin_audit_logs_target_created_at_idx').on(table.targetUserId, table.createdAt),
		index('user_admin_audit_logs_actor_created_at_idx').on(table.actorId, table.createdAt)
	]
);

export const reviews = pgTable(
	'reviews',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		serviceId: uuid('service_id')
			.notNull()
			.references(() => services.id, { onDelete: 'cascade' }),
		authorId: uuid('author_id')
			.notNull()
			.references(() => users.id, { onDelete: 'restrict' }),
		rating: integer('rating').notNull(),
		comment: text('comment').notNull(),
		status: reviewStatus('status').notNull().default('published'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		index('reviews_service_status_created_at_idx').on(
			table.serviceId,
			table.status,
			table.createdAt
		),
		check('reviews_rating_range_check', sql`${table.rating} between 1 and 5`)
	]
);
