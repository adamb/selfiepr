import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { getBalance, getActiveModel } from '$lib/db/queries.js';
import { estimateGenerationCost } from '$lib/replicate/pricing.js';

export const load: PageServerLoad = async ({ locals, platform }) => {
	// Must be authenticated
	if (!locals.session || !locals.user) {
		throw redirect(302, '/auth/login');
	}

	const db = platform?.env?.DB;

	// If no DB binding (static preview), return empty data
	if (!db) {
		return {
			balance: null,
			model: null,
			estimate: estimateGenerationCost()
		};
	}

	const userId = locals.user.id;
	const balance = await getBalance(db, userId);
	const model = await getActiveModel(db, userId);

	return {
		balance,
		model,
		estimate: estimateGenerationCost()
	};
};