import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { getBalance } from '$lib/db/queries.js';

export const load: PageServerLoad = async ({ locals, platform, url }) => {
	// Must be authenticated
	if (!locals.session || !locals.user) {
		throw redirect(302, '/auth/login');
	}

	const db = platform?.env?.DB;

	// If no DB binding (static preview), return empty data
	if (!db) {
		return {
			balance: null,
			isRetry: url.searchParams.get('retry') === '1'
		};
	}

	const userId = locals.user.id;
	const balance = await getBalance(db, userId);

	return {
		balance,
		isRetry: url.searchParams.get('retry') === '1'
	};
};