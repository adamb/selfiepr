import { createServerClient } from '@supabase/ssr';
import type { Handle, RequestEvent } from '@sveltejs/kit';

function getSupabaseClient(event: RequestEvent) {
	// Env vars are set via wrangler.toml [vars] and accessed via platform.env
	const supabaseUrl = event.platform?.env?.SUPABASE_URL ?? '';
	const supabaseAnonKey = event.platform?.env?.SUPABASE_ANON_KEY ?? '';

	if (!supabaseUrl || !supabaseAnonKey) {
		console.error('Missing Supabase config. Available env vars:', Object.keys(event.platform?.env ?? {}));
		throw new Error(
			`SUPABASE_URL and SUPABASE_ANON_KEY must be set. Got URL: ${supabaseUrl ? 'set' : 'missing'}, Key: ${supabaseAnonKey ? 'set' : 'missing'}`
		);
	}

	return createServerClient(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll() {
				return event.cookies.getAll();
			},
			setAll(cookiesToSet) {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});
}

export const supabaseHandle: Handle = async ({ event, resolve }) => {
	const supabase = getSupabaseClient(event);

	event.locals.supabase = supabase;

	const {
		data: { session }
	} = await supabase.auth.getSession();

	event.locals.session = session;
	event.locals.user = session?.user ?? null;

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range';
		}
	});
};