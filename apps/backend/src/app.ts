import cors from '@elysiajs/cors';
import { Elysia } from 'elysia';

import type { createDatabase } from './db/client';
import { createAuthRouter } from './auth';
import { createAdminServicesRouter } from './admin-services';
import { createAdminUsersRouter } from './admin-users';
import { createBookingsRouter } from './bookings';
import { createChatRouter } from './chat';
import { createNotificationsRouter } from './notifications';
import { createOwnerAvailabilityRouter } from './owner-availability';
import { createOwnerServicesRouter } from './owner-services';
import { createReviewsRouter } from './reviews';
import { createServicesRouter } from './services';

type Database = ReturnType<typeof createDatabase>['db'];

export function createApp(
	database?: Database,
	frontendOrigin = 'http://localhost:5173',
	secureCookies = false
) {
	return new Elysia()
		.use(cors({ origin: frontendOrigin, credentials: true }))
		.get('/api/health', () => ({
			status: 'ok',
			service: 'serba-bisa-api'
		}))
		.use(createAuthRouter(database, secureCookies))
		.use(createAdminServicesRouter(database))
		.use(createAdminUsersRouter(database))
		.use(createBookingsRouter(database))
		.use(createChatRouter(database, frontendOrigin))
		.use(createNotificationsRouter(database, frontendOrigin))
		.use(createOwnerServicesRouter(database))
		.use(createOwnerAvailabilityRouter(database))
		.use(createReviewsRouter(database))
		.use(createServicesRouter(database));
}
