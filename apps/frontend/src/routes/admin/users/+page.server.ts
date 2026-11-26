import { BACKEND_URL } from '$app/env/private';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const apiBaseUrl = BACKEND_URL.replace(/\/+$/, '');

type UserAudit = {
	id: string;
	action: string;
	reason: string;
	previousStatus: string | null;
	newStatus: string | null;
	role: string | null;
	createdAt: string;
	actorName: string;
};

type ManagedUser = {
	id: string;
	email: string;
	displayName: string;
	status: 'active' | 'suspended';
	createdAt: string;
	roles: string[];
	audit: UserAudit[];
};

type ListResponse = {
	data?: ManagedUser[];
	pagination?: { page: number; limit: number; total: number; totalPages: number };
	permissions?: { canManageRoles: boolean; actorId: string };
	error?: { message?: string };
};

type AuditResponse = {
	data?: UserAudit[];
	error?: { message?: string };
};

function cookieHeaders(cookie: string | null): Record<string, string> {
	return cookie ? { cookie } : {};
}

function errorMessage(message: string | undefined, status: number): string {
	return message ?? `Permintaan manajemen akun gagal (HTTP ${status}).`;
}

export const load: PageServerLoad = async ({ fetch, request, url }) => {
	const headers = cookieHeaders(request.headers.get('cookie'));
	try {
		const accountResponse = await fetch(`${apiBaseUrl}/api/auth/me`, { headers });
		if (accountResponse.status === 401) throw redirect(303, '/akun');
		if (!accountResponse.ok) {
			return { users: [], apiError: 'Status akun belum dapat diverifikasi.', canManageRoles: false };
		}

		const account = (await accountResponse.json()) as {
			data?: { user?: { roles: string[] } };
		};
		const roles = account.data?.user?.roles ?? [];
		if (!roles.includes('admin') && !roles.includes('super_admin')) {
			return {
				users: [],
				apiError: 'Halaman ini hanya untuk admin dan super admin.',
				canManageRoles: false,
				forbidden: true
			};
		}

		const query = new URLSearchParams();
		const search = url.searchParams.get('q')?.trim() ?? '';
		const requestedPage = Number(url.searchParams.get('page') ?? '1');
		const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
		if (search) query.set('q', search);
		query.set('page', String(page));
		query.set('limit', '25');

		const response = await fetch(`${apiBaseUrl}/api/admin/users?${query}`, { headers });
		const body = (await response.json()) as ListResponse;
		if (!response.ok) {
			return {
				users: [],
				apiError: errorMessage(body.error?.message, response.status),
				canManageRoles: false,
				forbidden: response.status === 403
			};
		}

		const canManageRoles = body.permissions?.canManageRoles ?? roles.includes('super_admin');
		const actorId = body.permissions?.actorId ?? '';
		const managedUsers = body.data ?? [];
		const usersWithAudit = canManageRoles
			? await Promise.all(
					managedUsers.map(async (user) => {
						const auditResponse = await fetch(`${apiBaseUrl}/api/admin/users/${user.id}/audit`, {
							headers
						});
						if (!auditResponse.ok) {
							const auditError = (await auditResponse.json()) as AuditResponse;
							throw new Error(
								errorMessage(auditError.error?.message, auditResponse.status)
							);
						}
						const audit = (await auditResponse.json()) as AuditResponse;
						return { ...user, audit: audit.data ?? [] };
					})
				)
			: managedUsers.map((user) => ({ ...user, audit: [] }));

		return {
			users: usersWithAudit,
			pagination: body.pagination ?? null,
			search,
			apiError: null,
			canManageRoles,
			actorId,
			forbidden: false
		};
	} catch (error) {
		if (error && typeof error === 'object' && 'status' in error) throw error;
		if (!(error instanceof TypeError)) throw error;
		return {
			users: [],
			apiError: 'Tidak dapat terhubung ke layanan manajemen akun. Pastikan backend sedang berjalan.',
			canManageRoles: false,
			forbidden: false
		};
	}
};

export const actions: Actions = {
	manage: async ({ fetch, request }) => {
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const action = String(form.get('action') ?? '');
		const reason = String(form.get('reason') ?? '').trim();
		if (
			!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ||
			!['suspend', 'restore', 'grant_admin', 'revoke_admin'].includes(action) ||
			reason.length < 8 ||
			reason.length > 500
		) {
			return fail(422, { error: 'Akun, tindakan, atau alasan tidak valid.' });
		}

		try {
			const response = await fetch(`${apiBaseUrl}/api/admin/users/${id}/manage`, {
				method: 'POST',
				headers: {
					...cookieHeaders(request.headers.get('cookie')),
					'content-type': 'application/json'
				},
				body: JSON.stringify({ action, reason })
			});
			const body = (await response.json()) as ListResponse;
			if (!response.ok) {
				return fail(response.status, {
					error: errorMessage(body.error?.message, response.status)
				});
			}
		} catch (error) {
			if (!(error instanceof TypeError)) throw error;
			return fail(503, {
				error: 'Tidak dapat menghubungi backend manajemen akun. Silakan coba lagi.'
			});
		}

		const referer = request.headers.get('referer');
		throw redirect(303, referer ? new URL(referer).pathname + new URL(referer).search : '/admin/users');
	}
};
