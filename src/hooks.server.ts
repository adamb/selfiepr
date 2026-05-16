import { supabaseHandle } from '$lib/supabase/server.js';
import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';

const handle: Handle = sequence(supabaseHandle);

export { handle };