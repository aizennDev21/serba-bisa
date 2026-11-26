import cors from '@elysiajs/cors';
import { Elysia } from 'elysia';

import type { createDatabase } from './db/client';
import { createServicesRouter } from './services';

type Database = ReturnType<typeof createDatabase>['db'];

export function createApp(database?: Database, frontendOrigin = 'http://localhost:5173') {
	return new Elysia()
		.use(cors({ origin: frontendOrigin }))
		.get('/api/health', () => ({
			status: 'ok',
			service: 'serba-bisa-api'
		}))
		.use(createServicesRouter(database));
}
