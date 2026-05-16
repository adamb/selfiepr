import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ url }) => {
	const error = url.searchParams.get('error');
	const message = url.searchParams.get('message');
	return { error, message };
};

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required' });
		}

		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters' });
		}

		const { error } = await locals.supabase.auth.signUp({
			email,
			password
		});

		if (error) {
			return fail(400, { error: error.message });
		}

		// Auto-login after signup
		const { error: loginError } = await locals.supabase.auth.signInWithPassword({
			email,
			password
		});

		if (loginError) {
			// If auto-login fails, redirect to login page
			throw redirect(302, '/auth/login?message=Account created. Please log in.');
		}

		throw redirect(302, '/app');
	}
};