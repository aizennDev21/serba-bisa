import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

import type { createDatabase } from './db/client';
import { authSessions, userCredentials, userRoles, users } from './db/schema';

type Database = ReturnType<typeof createDatabase>['db'];

const sessionCookieName = 'serba_bisa_session';
const sessionDurationSeconds = 60 * 60 * 24 * 14;
const registerBody = t.Object({
	email: t.String({ format: 'email', maxLength: 254 }),
	displayName: t.String({ minLength: 2, maxLength: 80 }),
	password: t.String({ minLength: 12, maxLength: 128 })
});
const loginBody = t.Object({
	email: t.String({ format: 'email', maxLength: 254 }),
	password: t.String({ minLength: 1, maxLength: 128 })
});

function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

function getSessionToken(cookieHeader: string | null): string | null {
	const entry = cookieHeader
		?.split(';')
		.map((part) => part.trim())
		.find((part) => part.startsWith(`${sessionCookieName}=`));
	const token = entry?.slice(sessionCookieName.length + 1);

	return token && /^[A-Za-z0-9_-]{40,100}$/.test(token) ? token : null;
}

function createSessionCookie(token: string, secure: boolean): string {
	return [
		`${sessionCookieName}=${token}`,
		'Path=/',
		'HttpOnly',
		'SameSite=Lax',
		`Max-Age=${sessionDurationSeconds}`,
		...(secure ? ['Secure'] : [])
	].join('; ');
}

function createClearedSessionCookie(secure: boolean): string {
	return [
		`${sessionCookieName}=`,
		'Path=/',
		'HttpOnly',
		'SameSite=Lax',
		'Max-Age=0',
		...(secure ? ['Secure'] : [])
	].join('; ');
}

function isUniqueViolation(error: unknown): boolean {
	if (typeof error !== 'object' || error === null) return false;
	if ('code' in error && error.code === '23505') return true;
	return 'cause' in error && isUniqueViolation(error.cause);
}

export function createAuthRouter(database?: Database, secureCookies = false) {
	return new Elysia({ prefix: '/api/auth' })
		.post(
			'/register',
			async ({ body, set }) => {
				if (!database) {
					set.status = 503;
					return {
						error: {
							code: 'DATABASE_UNAVAILABLE',
							message: 'Pendaftaran belum tersedia karena koneksi database belum dikonfigurasi.'
						}
					};
				}

				const email = body.email.trim().toLowerCase();
				const displayName = body.displayName.trim();
				if (displayName.length < 2) {
					set.status = 422;
					return {
						error: {
							code: 'INVALID_DISPLAY_NAME',
							message: 'Nama tampilan harus terdiri dari minimal 2 karakter.'
						}
					};
				}

				const passwordHash = await Bun.password.hash(body.password, {
					algorithm: 'argon2id'
				});
				const token = randomBytes(32).toString('base64url');
				const expiresAt = new Date(Date.now() + sessionDurationSeconds * 1000);

				try {
					const user = await database.transaction(async (tx) => {
						const [createdUser] = await tx
							.insert(users)
							.values({ email, displayName })
							.returning({
								id: users.id,
								email: users.email,
								displayName: users.displayName
							});
						if (!createdUser) {
							throw new Error('User creation did not return a record.');
						}

						await tx.insert(userCredentials).values({
							userId: createdUser.id,
							passwordHash
						});
						await tx.insert(userRoles).values([
							{ userId: createdUser.id, role: 'seeker' },
							{ userId: createdUser.id, role: 'provider' }
						]);
						await tx.insert(authSessions).values({
							userId: createdUser.id,
							tokenHash: hashToken(token),
							expiresAt
						});

						return createdUser;
					});

					set.headers['Set-Cookie'] = createSessionCookie(token, secureCookies);
					set.status = 201;
					return {
						data: {
							user: { ...user, roles: ['seeker', 'provider'] }
						}
					};
				} catch (error) {
					if (isUniqueViolation(error)) {
						set.status = 409;
						return {
							error: {
								code: 'ACCOUNT_ALREADY_EXISTS',
								message: 'Tidak dapat membuat akun dengan data tersebut.'
							}
						};
					}

					throw error;
				}
			},
			{ body: registerBody }
		)
		.post(
			'/login',
			async ({ body, set }) => {
				if (!database) {
					set.status = 503;
					return {
						error: {
							code: 'DATABASE_UNAVAILABLE',
							message: 'Login belum tersedia karena koneksi database belum dikonfigurasi.'
						}
					};
				}

				const email = body.email.trim().toLowerCase();
				const [account] = await database
					.select({
						id: users.id,
						email: users.email,
						displayName: users.displayName,
						status: users.status,
						passwordHash: userCredentials.passwordHash
					})
					.from(users)
					.innerJoin(userCredentials, eq(userCredentials.userId, users.id))
					.where(eq(users.email, email))
					.limit(1);

				if (
					!account ||
					!(await Bun.password.verify(body.password, account.passwordHash))
				) {
					set.status = 401;
					return {
						error: {
							code: 'INVALID_CREDENTIALS',
							message: 'Email atau kata sandi tidak sesuai.'
						}
					};
				}

				if (account.status !== 'active') {
					set.status = 403;
					return {
						error: {
							code: 'ACCOUNT_UNAVAILABLE',
							message: 'Akun ini sedang dinonaktifkan.'
						}
					};
				}

				const roles = await database
					.select({ role: userRoles.role })
					.from(userRoles)
					.where(eq(userRoles.userId, account.id));
				const token = randomBytes(32).toString('base64url');

				await database.insert(authSessions).values({
					userId: account.id,
					tokenHash: hashToken(token),
					expiresAt: new Date(Date.now() + sessionDurationSeconds * 1000)
				});

				set.headers['Set-Cookie'] = createSessionCookie(token, secureCookies);
				return {
					data: {
						user: {
							id: account.id,
							email: account.email,
							displayName: account.displayName,
							roles: roles.map(({ role }) => role)
						}
					}
				};
			},
			{ body: loginBody }
		)
		.get('/me', async ({ request, set }) => {
			if (!database) {
				set.status = 503;
				return {
					error: {
						code: 'DATABASE_UNAVAILABLE',
						message: 'Sesi akun belum tersedia karena koneksi database belum dikonfigurasi.'
					}
				};
			}

			const token = getSessionToken(request.headers.get('cookie'));
			if (!token) {
				set.status = 401;
				return {
					error: { code: 'UNAUTHENTICATED', message: 'Silakan masuk ke akunmu.' }
				};
			}

			const [account] = await database
				.select({
					id: users.id,
					email: users.email,
					displayName: users.displayName,
					status: users.status
				})
				.from(authSessions)
				.innerJoin(users, eq(authSessions.userId, users.id))
				.where(
					and(
						eq(authSessions.tokenHash, hashToken(token)),
						gt(authSessions.expiresAt, new Date()),
						eq(users.status, 'active')
					)
				)
				.limit(1);

			if (!account) {
				set.status = 401;
				return {
					error: { code: 'UNAUTHENTICATED', message: 'Sesi tidak valid atau sudah berakhir.' }
				};
			}

			const roles = await database
				.select({ role: userRoles.role })
				.from(userRoles)
				.where(eq(userRoles.userId, account.id));

			return {
				data: {
					user: {
						id: account.id,
						email: account.email,
						displayName: account.displayName,
						roles: roles.map(({ role }) => role)
					}
				}
			};
		})
		.post('/logout', async ({ request, set }) => {
			const token = getSessionToken(request.headers.get('cookie'));
			if (database && token) {
				await database
					.delete(authSessions)
					.where(eq(authSessions.tokenHash, hashToken(token)));
			}

			set.headers['Set-Cookie'] = createClearedSessionCookie(secureCookies);
			set.status = 204;
			return;
		});
}
