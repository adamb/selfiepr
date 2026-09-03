import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getBalance, getActiveModel, createGeneration, deductBalance, createReplicateCost } from '$lib/db/queries.js';
import { getReplicateClient } from '$lib/replicate/client.js';
import { calculateCostCents, calculateDeductionCents, estimateGenerationCost } from '$lib/replicate/pricing.js';

const MIN_BALANCE_CENTS = 15; // $0.15 minimum for generation

// Style presets - all include TOK trigger word
const STYLE_PRESETS: Record<string, string> = {
	cinematic: 'TOK, close-up portrait, face clearly visible, looking at camera, cinematic lighting, dramatic lighting, film grain',
	anime: 'TOK, anime style portrait, vibrant colors, detailed illustration',
	oil_painting: 'TOK, oil painting portrait, classical art style, brushstrokes visible',
	neon_noir: 'TOK, neon noir portrait, cyberpunk lighting, moody atmosphere',
	professional: 'TOK, professional headshot, studio lighting, clean background',
	fantasy: 'TOK, fantasy portrait, magical atmosphere, ethereal lighting'
};

export const POST: RequestHandler = async ({ request, locals, platform, url }) => {
	// Validate session
	if (!locals.session || !locals.user) {
		throw error(401, 'Unauthorized');
	}

	const db = platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database not available');
	}

	const userId = locals.user.id;

	// Check balance
	const balance = await getBalance(db, userId);
	if (!balance || balance.balance_cents < MIN_BALANCE_CENTS) {
		throw error(402, `Insufficient balance. Minimum $${(MIN_BALANCE_CENTS / 100).toFixed(2)} required.`);
	}

	// Get active model
	const model = await getActiveModel(db, userId);
	if (!model || model.status !== 'succeeded') {
		throw error(400, 'No trained model found. Please train a model first.');
	}

	// Prefer full "owner/name:hash" from training; fall back to lora_weights_url if it looks like a version
	const modelVersion =
		model.replicate_model_name?.includes(':')
			? model.replicate_model_name
			: model.lora_weights_url?.includes(':')
				? model.lora_weights_url
				: null;
	if (!modelVersion) {
		throw error(500, 'Model version not found. Retrain or backfill replicate_model_name with owner/name:hash.');
	}

	// Parse request body
	const body = await request.json() as { prompt?: string; stylePreset?: string };
	let prompt = body.prompt?.trim();
	const stylePreset = body.stylePreset;

	// Validate prompt
	if (!prompt && !stylePreset) {
		throw error(400, 'Either prompt or stylePreset is required.');
	}

	// Use style preset or validate custom prompt
	if (stylePreset && STYLE_PRESETS[stylePreset]) {
		prompt = STYLE_PRESETS[stylePreset];
	} else if (prompt && !prompt.includes('TOK')) {
		throw error(400, 'Custom prompt must include "TOK" to activate your trained model.');
	}

	if (!prompt) {
		throw error(400, 'Prompt is required.');
	}

	// Estimate cost and check balance
	const estimate = estimateGenerationCost();
	if (balance.balance_cents < estimate.minCents) {
		throw error(402, `Insufficient balance. Estimated cost: $${(estimate.minCents / 100).toFixed(2)} - $${(estimate.maxCents / 100).toFixed(2)}.`);
	}

	// Create generation record
	const generationId = crypto.randomUUID();
	await createGeneration(db, {
		id: generationId,
		user_id: userId,
		model_id: model.id,
		prompt,
		style_preset: stylePreset ?? null,
		status: 'pending'
	});

	// Start Replicate prediction
	const replicateToken = platform?.env?.REPLICATE_API_TOKEN;
	if (!replicateToken) {
		throw error(500, 'Replicate API not configured');
	}

		const webhookUrl = `${url.origin}/api/webhooks/replicate`;

	const replicate = getReplicateClient(replicateToken);

	try {
		const { id: predictionId } = await replicate.startPrediction(
			{
				prompt,
				modelVersion
			},
			webhookUrl
		);

		// Update generation with prediction ID
		await db
			.prepare('UPDATE generations SET replicate_prediction_id = ?, status = ? WHERE id = ?')
			.bind(predictionId, 'processing', generationId)
			.run();

		return json({ generation_id: generationId });
	} catch (err) {
		// Update generation to failed
		await db
			.prepare('UPDATE generations SET status = ?, error_message = ? WHERE id = ?')
			.bind('failed', err instanceof Error ? err.message : 'Failed to start generation', generationId)
			.run();

		const msg = err instanceof Error ? err.message : 'Failed to start generation';
		return json({ message: `Failed to start generation: ${msg}` }, { status: 500 });
	}
};