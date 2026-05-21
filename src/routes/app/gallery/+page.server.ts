import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { getGenerations } from '$lib/db/queries.js';

export const load: PageServerLoad = async ({ locals, platform, url }) => {
	// Must be authenticated
	if (!locals.session || !locals.user) {
		throw redirect(302, '/auth/login');
	}

	const db = platform?.env?.DB;

	// If no DB binding (static preview), return empty data
	if (!db) {
		return {
			generations: [],
			newGenerationId: url.searchParams.get('new')
		};
	}

	const userId = locals.user.id;
	const page = parseInt(url.searchParams.get('page') ?? '1');
	const generations = await getGenerations(db, userId, page, 20);

	return {
		generations,
		newGenerationId: url.searchParams.get('new')
	};
};