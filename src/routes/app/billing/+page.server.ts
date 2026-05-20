import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { getBalance, getPurchases } from '$lib/db/queries.js';

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
			purchases: [],
			topupSuccess: url.searchParams.get('topup') === 'success',
			topupCancel: url.searchParams.get('topup') === 'cancel'
		};
	}

	const userId = locals.user.id;

	// Get balance
	const balance = await getBalance(db, userId);

	// Get purchase history
	const purchases = await getPurchases(db, userId);

	return {
		balance,
		purchases,
		topupSuccess: url.searchParams.get('topup') === 'success',
		topupCancel: url.searchParams.get('topup') === 'cancel'
	};
};