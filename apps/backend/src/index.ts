import { createApp } from './app';
import { createDatabase } from './db/client';

const port = Number(process.env.PORT ?? 3001);
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173';

if (!Number.isInteger(port) || port < 1 || port > 65535) {
	throw new Error(`PORT must be a valid TCP port; received "${process.env.PORT}".`);
}

const databaseUrl = process.env.DATABASE_URL;
const database = databaseUrl ? createDatabase(databaseUrl) : undefined;
const app = createApp(database?.db, frontendOrigin).listen(port);

console.info(`Serba Bisa API listening at ${app.server?.url}`);
if (!database) {
	console.warn('DATABASE_URL is not configured; service listing endpoints will return HTTP 503.');
}
