import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	BACKEND_URL: {
		schema: (value) => value ?? 'http://localhost:3001',
		description: 'Private base URL used by server-side pages to reach the Elysia API.'
	}
});
