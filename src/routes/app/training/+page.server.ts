import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { getActiveModel } from '$lib/db/queries.js';

export const load: PageServerLoad = async ({ locals, platform }) => {
	// Must be authenticated
	if (!locals.session || !locals.user) {
		throw redirect(302, '/auth/login');
	}

	const db = platform?.env?.DB;

	// If no DB binding (static preview), return empty data
	if (!db) {
		return {
			model: null,
			elapsedSeconds: 0
		};
	}

	const userId = locals.user.id;
	const model = await getActiveModel(db, userId);

	// If no model or not training, redirect based on state
	if (!model) {
		throw redirect(302, '/app/onboarding');
	}

	if (model.status === 'succeeded') {
		throw redirect(302, '/app/generate');
	}

	if (model.status === 'failed') {
		throw redirect(302, '/app/onboarding?retry=1');
	}

	// Calculate elapsed time
	const createdAt = new Date(model.created_at);
	const elapsedMs = Date.now() - createdAt.getTime();
	const elapsedSeconds = Math.floor(elapsedMs / 1000);

	return {
		model,
		elapsedSeconds
	};
};