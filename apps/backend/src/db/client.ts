import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

export function createDatabase(databaseUrl: string) {
	const client = postgres(databaseUrl);

	return {
		db: drizzle({ client, schema }),
		client
	};
}
