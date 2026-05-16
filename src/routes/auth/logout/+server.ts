import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ locals }) => {
	await locals.supabase.auth.signOut();
	throw redirect(302, '/auth/login');
};