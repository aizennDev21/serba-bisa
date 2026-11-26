import cors from '@elysiajs/cors';
import { Elysia } from 'elysia';

const port = Number(process.env.PORT ?? 3001);
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173';

if (!Number.isInteger(port) || port < 1 || port > 65535) {
	throw new Error(`PORT must be a valid TCP port; received "${process.env.PORT}".`);
}

const app = new Elysia()
	.use(cors({ origin: frontendOrigin }))
	.get('/api/health', () => ({
		status: 'ok',
		service: 'serba-bisa-api'
	}))
	.listen(port);

console.info(`Serba Bisa API listening at ${app.server?.url}`);
