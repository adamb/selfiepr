import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getModelById } from '$lib/db/queries.js';

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
	const model = await getModelById(db, id);

	if (!model) {
		throw error(404, 'Model not found');
	}

	// Verify ownership
	if (model.user_id !== locals.user.id) {
		throw error(403, 'Forbidden');
	}

	// Calculate elapsed time
	const createdAt = new Date(model.created_at);
	const elapsedMs = Date.now() - createdAt.getTime();
	const elapsedSeconds = Math.floor(elapsedMs / 1000);

	return json({
		status: model.status,
		elapsedSeconds,
		error: model.error_message
	});
};