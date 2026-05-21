import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getGenerationById } from '$lib/db/queries.js';

export const GET: RequestHandler = async ({ params, locals, platform }) => {
	// Validate session
	if (!locals.session || !locals.user) {
		throw error(401, 'Unauthorized');
	}

	const db = platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database not available');
	}

	const { id } = params;
	const generation = await getGenerationById(db, id, locals.user.id);

	if (!generation) {
		throw error(404, 'Generation not found');
	}

	return json({
		status: generation.status,
		output_image_url: generation.output_image_url,
		deducted_cents: generation.deducted_cents,
		error_message: generation.error_message
	});
};