import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ url }) => {
	const error = url.searchParams.get('error');
	const message = url.searchParams.get('message');
	const provider = url.searchParams.get('provider');

	if (provider === 'google') {
		// Will be handled by the action below
		return { error, message, provider };
	}

	return { error, message, provider: null };
};

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		const formData = await request.formData();
		const provider = formData.get('provider') as string | null;

		// Google OAuth
		if (provider === 'google') {
			const { data, error } = await locals.supabase.auth.signInWithOAuth({
				provider: 'google',
				options: {
					redirectTo: `${url.origin}/auth/callback`
				}
			});

			if (error) {
				return fail(400, { error: error.message });
			}

			if (data.url) {
				throw redirect(302, data.url);
			}
		}

		// Email + password login
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required' });
		}

		const { error } = await locals.supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			return fail(400, { error: error.message });
		}

		throw redirect(302, '/app');
	}
};