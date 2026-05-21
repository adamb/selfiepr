import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { updateModelStatus, updateGenerationStatus, deductBalance, createReplicateCost } from '$lib/db/queries.js';
import { calculateCostCents, calculateDeductionCents } from '$lib/replicate/pricing.js';
import { uploadGeneratedImage, getPublicUrl } from '$lib/storage/r2.js';

interface ReplicateWebhookPayload {
	id: string;
	status: string;
	model?: string;
	version?: string;
	input?: Record<string, unknown>;
	output?: string | string[] | null;
	error?: string;
	metrics?: {
		predict_time?: number;
		hardware?: string;
	};
	created_at?: string;
	completed_at?: string;
}

export const POST: RequestHandler = async ({ request, platform }) => {
	const db = platform?.env?.DB;
	const bucket = platform?.env?.SELFIE_BUCKET;
	const publicR2Url = platform?.env?.PUBLIC_R2_URL;

	if (!db) {
		throw error(500, 'Database not available');
	}

	// Read raw body for signature verification
	const rawBody = await request.text();

	// TODO: Verify SVIX signature when REPLICATE_WEBHOOK_SIGNING_KEY is available
	// For now, we trust the webhook since it comes from Replicate
	// const signingKey = platform?.env?.REPLICATE_WEBHOOK_SIGNING_KEY;
	// const webhookId = request.headers.get('webhook-id');
	// const webhookTimestamp = request.headers.get('webhook-timestamp');
	// const webhookSignature = request.headers.get('webhook-signature');

	// Parse the payload
	let payload: ReplicateWebhookPayload;
	try {
		payload = JSON.parse(rawBody);
	} catch {
		throw error(400, 'Invalid JSON');
	}

	const { id: jobId, status, output, error, metrics } = payload;

	// Look up by training_id first
	const { results: modelResults } = await db
		.prepare('SELECT id, user_id, status FROM user_models WHERE replicate_training_id = ?')
		.bind(jobId)
		.all<{ id: string; user_id: string; status: string }>();

	if (modelResults.length > 0) {
		// This is a training webhook
		return await handleTrainingWebhook(db, modelResults[0], status, output, error, metrics);
	}

	// Look up by prediction_id
	const { results: generationResults } = await db
		.prepare('SELECT id, user_id, status FROM generations WHERE replicate_prediction_id = ?')
		.bind(jobId)
		.all<{ id: string; user_id: string; status: string }>();

	if (generationResults.length > 0) {
		// This is a generation webhook
		return await handleGenerationWebhook(
			db,
			bucket,
			publicR2Url,
			generationResults[0],
			status,
			output,
			error,
			metrics
		);
	}

	// Unknown job ID - return 200 OK (idempotent)
	return json({ received: true, status: 'unknown_job' });
};

async function handleTrainingWebhook(
	db: D1Database,
	model: { id: string; user_id: string; status: string },
	status: string,
	output: string | string[] | null,
	error: string | undefined,
	metrics: { predict_time?: number; hardware?: string } | undefined
): Promise<Response> {
	if (status === 'succeeded' && output) {
		// Training succeeded
		const weightsUrl = typeof output === 'string' ? output : output[0];
		const predictTime = metrics?.predict_time ?? 0;
		const hardware = metrics?.hardware ?? 'Nvidia A100 (40GB)';

		// Calculate cost
		const costCents = calculateCostCents(hardware, predictTime);
		const deductionCents = calculateDeductionCents(costCents);

		// Update model to succeeded
		await updateModelStatus(db, model.id, 'training', 'succeeded', {
			lora_weights_url: weightsUrl,
			hardware,
			predict_time_seconds: predictTime,
			training_cost_cents: costCents,
			deducted_cents: deductionCents
		});

		// Deduct balance atomically
		const deducted = await deductBalance(db, model.user_id, deductionCents);
		if (!deducted) {
			// Balance insufficient - model already succeeded, log error
			console.error(`Failed to deduct balance for training ${model.id}: insufficient balance`);
		}

		// Record cost
		await createReplicateCost(db, {
			id: crypto.randomUUID(),
			user_id: model.user_id,
			job_type: 'training',
			job_id: model.id,
			hardware,
			predict_time_seconds: predictTime,
			actual_cost_cents: costCents,
			deducted_cents: deductionCents
		});

		return json({ received: true, status: 'training_succeeded' });
	}

	if (status === 'failed') {
		// Training failed
		await updateModelStatus(db, model.id, 'training', 'failed', {
			error_message: error ?? 'Training failed'
		});

		return json({ received: true, status: 'training_failed' });
	}

	// Other status (starting, etc.)
	return json({ received: true, status });
}

async function handleGenerationWebhook(
	db: D1Database,
	bucket: R2Bucket | undefined,
	publicR2Url: string | undefined,
	generation: { id: string; user_id: string; status: string },
	status: string,
	output: string | string[] | null,
	error: string | undefined,
	metrics: { predict_time?: number; hardware?: string } | undefined
): Promise<Response> {
	if (status === 'succeeded' && output) {
		// Generation succeeded
		const imageUrl = typeof output === 'string' ? output : output[0];
		const predictTime = metrics?.predict_time ?? 0;
		const hardware = metrics?.hardware ?? 'Nvidia A100 (40GB)';

		// Calculate cost
		const costCents = calculateCostCents(hardware, predictTime);
		const deductionCents = calculateDeductionCents(costCents);

		// Fetch output image and upload to R2
		let r2Key: string | null = null;
		if (bucket && publicR2Url && imageUrl) {
			try {
				const response = await fetch(imageUrl);
				if (response.ok) {
					const imageBuffer = await response.arrayBuffer();
					r2Key = await uploadGeneratedImage(bucket, generation.user_id, generation.id, imageBuffer);
				}
			} catch (err) {
				console.error('Failed to upload generated image to R2:', err);
			}
		}

		// Update generation to succeeded
		await updateGenerationStatus(db, generation.id, 'processing', 'succeeded', {
			output_image_url: r2Key ? getPublicUrl(publicR2Url ?? '', r2Key) : imageUrl,
			output_r2_key: r2Key,
			hardware,
			predict_time_seconds: predictTime,
			cost_cents: costCents,
			deducted_cents: deductionCents
		});

		// Deduct balance atomically
		const deducted = await deductBalance(db, generation.user_id, deductionCents);
		if (!deducted) {
			console.error(`Failed to deduct balance for generation ${generation.id}: insufficient balance`);
		}

		// Record cost
		await createReplicateCost(db, {
			id: crypto.randomUUID(),
			user_id: generation.user_id,
			job_type: 'generation',
			job_id: generation.id,
			hardware,
			predict_time_seconds: predictTime,
			actual_cost_cents: costCents,
			deducted_cents: deductionCents
		});

		return json({ received: true, status: 'generation_succeeded' });
	}

	if (status === 'failed') {
		// Generation failed
		await updateGenerationStatus(db, generation.id, 'processing', 'failed', {
			error_message: error ?? 'Generation failed'
		});

		return json({ received: true, status: 'generation_failed' });
	}

	// Other status
	return json({ received: true, status });
}