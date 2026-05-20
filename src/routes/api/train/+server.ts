import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getBalance, createModel, updateModelStatus } from '$lib/db/queries.js';
import { uploadTrainingPhoto, uploadTrainingZip, getPublicUrl } from '$lib/storage/r2.js';
import { getReplicateClient } from '$lib/replicate/client.js';
import JSZip from 'jszip';

const MIN_BALANCE_CENTS = 300; // $3.00 minimum for training
const MIN_PHOTOS = 5;
const MAX_PHOTOS = 10;
const TRAINING_STEPS = 1000;
const TRIGGER_WORD = 'TOK';

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	// Validate session
	if (!locals.session || !locals.user) {
		throw error(401, 'Unauthorized');
	}

	const db = platform?.env?.DB;
	const bucket = platform?.env?.SELFIE_BUCKET;
	const publicR2Url = platform?.env?.PUBLIC_R2_URL;

	if (!db || !bucket) {
		throw error(500, 'Storage not available');
	}

	const userId = locals.user.id;

	// Check balance
	const balance = await getBalance(db, userId);
	if (!balance || balance.balance_cents < MIN_BALANCE_CENTS) {
		throw error(402, `Insufficient balance. Minimum $${(MIN_BALANCE_CENTS / 100).toFixed(2)} required for training.`);
	}

	// Check for existing active model
	const { results: existingModels } = await db
		.prepare("SELECT id FROM user_models WHERE user_id = ? AND status IN ('uploading', 'training', 'succeeded')")
		.bind(userId)
		.all();

	if (existingModels.length > 0) {
		throw error(409, 'You already have an active model. You can only have one model at a time.');
	}

	// Parse multipart form data
	const formData = await request.formData();
	const photos = formData.getAll('photos') as File[];

	// Validate photos
	if (photos.length < MIN_PHOTOS) {
		throw error(400, `At least ${MIN_PHOTOS} photos required.`);
	}
	if (photos.length > MAX_PHOTOS) {
		throw error(400, `Maximum ${MAX_PHOTOS} photos allowed.`);
	}

	// Validate each photo
	for (const photo of photos) {
		if (!photo.type.startsWith('image/')) {
			throw error(400, 'All files must be images.');
		}
		if (photo.size > 20 * 1024 * 1024) {
			throw error(400, 'Each photo must be under 20MB.');
		}
	}

	const timestamp = Date.now();
	const modelId = crypto.randomUUID();

	// Create model record with status='uploading'
	await createModel(db, {
		id: modelId,
		user_id: userId,
		status: 'uploading'
	});

	try {
		// Upload photos to R2
		const uploadPromises = photos.map(async (photo, index) => {
			const arrayBuffer = await photo.arrayBuffer();
			return uploadTrainingPhoto(bucket, userId, timestamp, index, arrayBuffer, photo.type);
		});

		const photoKeys = await Promise.all(uploadPromises);

		// Create zip file server-side
		const zip = new JSZip();
		for (let i = 0; i < photos.length; i++) {
			const arrayBuffer = await photos[i].arrayBuffer();
			zip.file(`photo_${i}.jpg`, arrayBuffer);
		}

		const zipBlob = await zip.generateAsync({ type: 'arraybuffer' });

		// Upload zip to R2
		const zipKey = await uploadTrainingZip(bucket, userId, timestamp, zipBlob);

		// Get public URL for zip
		if (!publicR2Url) {
			throw error(500, 'Public R2 URL not configured');
		}

		const zipUrl = getPublicUrl(publicR2Url, zipKey);

		// Start Replicate training
		const replicateToken = platform?.env?.REPLICATE_API_TOKEN;
		if (!replicateToken) {
			throw error(500, 'Replicate API not configured');
		}

		const replicate = getReplicateClient(replicateToken);
		const baseUrl = publicR2Url.replace(/\/$/, '');
		const webhookUrl = `${baseUrl.replace(/\/[^/]*$/, '')}/api/webhooks/replicate`;

		const { id: trainingId } = await replicate.startTraining(
			{
				input_images: zipUrl,
				trigger_word: TRIGGER_WORD,
				steps: TRAINING_STEPS
			},
			webhookUrl
		);

		// Update model to status='training'
		await updateModelStatus(db, modelId, 'uploading', 'training', {
			replicate_training_id: trainingId
		});

		return json({ model_id: modelId });
	} catch (err) {
		// Update model to failed on error
		const errorMessage = err instanceof Error ? err.message : 'Unknown error';
		await updateModelStatus(db, modelId, 'uploading', 'failed', {
			error_message: errorMessage
		});
		throw error(500, `Training failed: ${errorMessage}`);
	}
};