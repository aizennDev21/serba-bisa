import {
	check,
	pgEnum,
	pgTable,
	index,
	uniqueIndex,
	boolean,
	primaryKey,
	date,
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
export const bookingStatus = pgEnum('booking_status', [
	'requested',
	'accepted',
	'declined',
	'cancelled',
	'completed'
]);
export const notificationType = pgEnum('notification_type', [
	'booking_requested',
	'booking_status_changed'
]);

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
		uniqueIndex('reviews_service_author_unique_idx').on(table.serviceId, table.authorId),
		check('reviews_rating_range_check', sql`${table.rating} between 1 and 5`)
	]
);

export const reviewReplies = pgTable(
	'review_replies',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		reviewId: uuid('review_id')
			.notNull()
			.references(() => reviews.id, { onDelete: 'cascade' }),
		authorId: uuid('author_id')
			.notNull()
			.references(() => users.id, { onDelete: 'restrict' }),
		comment: text('comment').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		uniqueIndex('review_replies_review_id_unique_idx').on(table.reviewId),
		index('review_replies_author_created_at_idx').on(table.authorId, table.createdAt)
	]
);

export const conversations = pgTable(
	'conversations',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		serviceId: uuid('service_id')
			.notNull()
			.references(() => services.id, { onDelete: 'restrict' }),
		seekerId: uuid('seeker_id')
			.notNull()
			.references(() => users.id, { onDelete: 'restrict' }),
		ownerId: uuid('owner_id')
			.notNull()
			.references(() => users.id, { onDelete: 'restrict' }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		uniqueIndex('conversations_service_seeker_unique_idx').on(table.serviceId, table.seekerId),
		index('conversations_seeker_updated_at_idx').on(table.seekerId, table.updatedAt),
		index('conversations_owner_updated_at_idx').on(table.ownerId, table.updatedAt)
	]
);

export const chatMessages = pgTable(
	'chat_messages',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		conversationId: uuid('conversation_id')
			.notNull()
			.references(() => conversations.id, { onDelete: 'cascade' }),
		senderId: uuid('sender_id')
			.notNull()
			.references(() => users.id, { onDelete: 'restrict' }),
		content: text('content').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		index('chat_messages_conversation_created_at_idx').on(table.conversationId, table.createdAt),
		index('chat_messages_sender_created_at_idx').on(table.senderId, table.createdAt)
	]
);

export const bookings = pgTable(
	'bookings',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		serviceId: uuid('service_id')
			.notNull()
			.references(() => services.id, { onDelete: 'restrict' }),
		seekerId: uuid('seeker_id')
			.notNull()
			.references(() => users.id, { onDelete: 'restrict' }),
		ownerId: uuid('owner_id')
			.notNull()
			.references(() => users.id, { onDelete: 'restrict' }),
		serviceTitle: text('service_title').notNull(),
		price: integer('price').notNull(),
		priceUnit: servicePriceUnit('price_unit').notNull(),
		requestMessage: text('request_message').notNull(),
		requestedAt: timestamp('requested_at', { withTimezone: true }),
		requestedLocation: text('requested_location'),
		status: bookingStatus('status').notNull().default('requested'),
		statusReason: text('status_reason'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		index('bookings_seeker_created_at_idx').on(table.seekerId, table.createdAt),
		index('bookings_owner_created_at_idx').on(table.ownerId, table.createdAt),
		index('bookings_service_status_idx').on(table.serviceId, table.status),
		uniqueIndex('bookings_owner_accepted_slot_unique_idx')
			.on(table.ownerId, table.requestedAt)
			.where(sql`${table.status} = 'accepted' and ${table.requestedAt} is not null`),
		check('bookings_price_nonnegative_check', sql`${table.price} >= 0`)
	]
);

export const bookingStatusAuditLogs = pgTable(
	'booking_status_audit_logs',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		bookingId: uuid('booking_id')
			.notNull()
			.references(() => bookings.id, { onDelete: 'cascade' }),
		actorId: uuid('actor_id')
			.notNull()
			.references(() => users.id, { onDelete: 'restrict' }),
		previousStatus: bookingStatus('previous_status').notNull(),
		newStatus: bookingStatus('new_status').notNull(),
		reason: text('reason'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [index('booking_status_audit_logs_booking_created_at_idx').on(table.bookingId, table.createdAt)]
);

export const notifications = pgTable(
	'notifications',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		bookingId: uuid('booking_id')
			.notNull()
			.references(() => bookings.id, { onDelete: 'cascade' }),
		type: notificationType('type').notNull(),
		title: text('title').notNull(),
		message: text('message').notNull(),
		readAt: timestamp('read_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		index('notifications_user_created_at_idx').on(table.userId, table.createdAt),
		index('notifications_user_read_at_idx').on(table.userId, table.readAt)
	]
);

export const ownerWeeklyAvailability = pgTable(
	'owner_weekly_availability',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		ownerId: uuid('owner_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		dayOfWeek: integer('day_of_week').notNull(),
		startMinute: integer('start_minute').notNull().default(480),
		endMinute: integer('end_minute').notNull().default(1020),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		uniqueIndex('owner_weekly_availability_owner_day_start_unique_idx').on(
			table.ownerId,
			table.dayOfWeek,
			table.startMinute
		),
		check('owner_weekly_availability_day_range_check', sql`${table.dayOfWeek} between 0 and 6`),
		check(
			'owner_weekly_availability_start_minute_check',
			sql`${table.startMinute} between 0 and 1380 and ${table.startMinute} % 60 = 0`
		),
		check(
			'owner_weekly_availability_end_minute_check',
			sql`${table.endMinute} between 60 and 1440 and ${table.endMinute} % 60 = 0`
		),
		check(
			'owner_weekly_availability_interval_check',
			sql`${table.endMinute} > ${table.startMinute}`
		)
	]
);

export const ownerAvailabilityExceptions = pgTable(
	'owner_availability_exceptions',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		ownerId: uuid('owner_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		serviceDate: date('service_date').notNull(),
		isAvailable: boolean('is_available').notNull(),
		startMinute: integer('start_minute').notNull().default(480),
		endMinute: integer('end_minute').notNull().default(1020),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		uniqueIndex('owner_availability_exceptions_owner_date_unique_idx').on(
			table.ownerId,
			table.serviceDate,
			table.startMinute
		),
		index('owner_availability_exceptions_date_idx').on(table.serviceDate),
		check(
			'owner_availability_exceptions_start_minute_check',
			sql`${table.startMinute} between 0 and 1380 and ${table.startMinute} % 60 = 0`
		),
		check(
			'owner_availability_exceptions_end_minute_check',
			sql`${table.endMinute} between 60 and 1440 and ${table.endMinute} % 60 = 0`
		),
		check(
			'owner_availability_exceptions_interval_check',
			sql`not ${table.isAvailable} or ${table.endMinute} > ${table.startMinute}`
		)
	]
);
