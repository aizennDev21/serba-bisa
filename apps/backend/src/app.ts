import cors from '@elysiajs/cors';
import { Elysia } from 'elysia';

import type { createDatabase } from './db/client';
import { createAuthRouter } from './auth';
import { createOwnerServicesRouter } from './owner-services';
import { createServicesRouter } from './services';

type Database = ReturnType<typeof createDatabase>['db'];

export function createApp(
	database?: Database,
	frontendOrigin = 'http://localhost:5173',
	secureCookies = false
) {
	return new Elysia()
		.use(cors({ origin: frontendOrigin }))
		.get('/api/health', () => ({
			status: 'ok',
			service: 'serba-bisa-api'
		}))
		.use(createAuthRouter(database, secureCookies))
		.use(createOwnerServicesRouter(database))
		.use(createServicesRouter(database));
}
