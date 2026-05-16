import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	const error = url.searchParams.get('error');
	const errorDescription = url.searchParams.get('error_description');

	if (error) {
		throw redirect(302, `/auth/login?error=${encodeURIComponent(errorDescription || error)}`);
	}

	if (code) {
		const { error: exchangeError } = await locals.supabase.auth.exchangeCodeForSession(code);

		if (exchangeError) {
			throw redirect(302, `/auth/login?error=${encodeURIComponent(exchangeError.message)}`);
		}
	}

	throw redirect(302, '/app');
};