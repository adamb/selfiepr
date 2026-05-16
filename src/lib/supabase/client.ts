import { createBrowserClient } from '@supabase/ssr';

// Public env vars are available in the browser via Vite's import.meta.env
// They must be prefixed with PUBLIC_ in SvelteKit
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string;

export function getSupabaseBrowserClient() {
	return createBrowserClient(supabaseUrl, supabaseAnonKey);
}