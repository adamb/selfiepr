/**
 * R2 Storage Helpers
 * Upload and retrieve files from Cloudflare R2 bucket
 */

export async function uploadToR2(
	bucket: R2Bucket,
	key: string,
	data: ArrayBuffer | ReadableStream<Uint8Array>,
	contentType: string = 'application/octet-stream'
): Promise<string> {
	await bucket.put(key, data, {
		httpMetadata: {
			contentType
		}
	});

	return key;
}

export async function uploadTrainingPhoto(
	bucket: R2Bucket,
	userId: string,
	timestamp: number,
	index: number,
	imageData: ArrayBuffer,
	contentType: string = 'image/jpeg'
): Promise<string> {
	const key = `training/${userId}/${timestamp}_${index}.jpg`;
	await uploadToR2(bucket, key, imageData, contentType);
	return key;
}

export async function uploadTrainingZip(
	bucket: R2Bucket,
	userId: string,
	timestamp: number,
	zipData: ArrayBuffer
): Promise<string> {
	const key = `training/${userId}/${timestamp}_photos.zip`;
	await uploadToR2(bucket, key, zipData, 'application/zip');
	return key;
}

export async function uploadGeneratedImage(
	bucket: R2Bucket,
	userId: string,
	generationId: string,
	imageData: ArrayBuffer,
	contentType: string = 'image/webp'
): Promise<string> {
	const key = `outputs/${userId}/${generationId}.webp`;
	await uploadToR2(bucket, key, imageData, contentType);
	return key;
}

export function getPublicUrl(basePublicUrl: string, key: string): string {
	// Remove trailing slash from base URL if present
	const base = basePublicUrl.replace(/\/$/, '');
	return `${base}/${key}`;
}