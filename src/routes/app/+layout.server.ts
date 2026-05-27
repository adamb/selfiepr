import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types.js';
import { getBalance, getActiveModel } from '$lib/db/queries.js';

export const load: LayoutServerLoad = async ({ locals, platform, url }) => {
	// Not authenticated → redirect to login
	if (!locals.session || !locals.user) {
		throw redirect(302, '/auth/login');
	}

	const userId = locals.user.id;
	const db = platform?.env?.DB;

	if (!db) {
		// No DB binding in dev without wrangler
		// Return default state for static preview
		return {
			user: locals.user,
			balance: null,
			model: null,
			state: 'needs_billing' as const
		};
	}

	// Check balance
	const balance = await getBalance(db, userId);

	// No balance record or zero balance → redirect to billing (unless already there)
	if (!balance || balance.balance_cents === 0) {
		if (url.pathname !== '/app/billing') {
			throw redirect(302, '/app/billing');
		}
		return {
			user: locals.user,
			balance,
			model: null,
			state: 'needs_billing' as const
		};
	}

	// Check for active model
	const model = await getActiveModel(db, userId);

	// No model → redirect to onboarding (unless already there)
	if (!model) {
		if (url.pathname !== '/app/onboarding') {
			throw redirect(302, '/app/onboarding');
		}
		return {
			user: locals.user,
			balance,
			model: null,
			state: 'needs_onboarding' as const
		};
	}

	// Model is uploading or training → redirect to training wait (unless already there)
	if (model.status === 'uploading' || model.status === 'training') {
		if (url.pathname !== '/app/training') {
			throw redirect(302, '/app/training');
		}
	}

	// Model failed → redirect to onboarding (unless already there)
	if (model.status === 'failed') {
		if (url.pathname !== '/app/onboarding') {
			throw redirect(302, '/app/onboarding?retry=1');
		}
	}

	// Model succeeded → allow access to generate/gallery
	return {
		user: locals.user,
		balance,
		model,
		state: 'ready' as const
	};
};