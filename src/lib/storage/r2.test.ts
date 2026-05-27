import { describe, it, expect, vi } from 'vitest';
import {
	uploadToR2,
	uploadTrainingPhoto,
	uploadTrainingZip,
	uploadGeneratedImage,
	getPublicUrl
} from './r2.js';
import { createMockR2Bucket } from '$lib/test-utils.js';

describe('R2 Storage Helpers', () => {
	describe('uploadToR2', () => {
		it('uploads data to R2 with content type', async () => {
			const bucket = createMockR2Bucket();
			const data = new TextEncoder().encode('test data').buffer;

			const result = await uploadToR2(bucket as unknown as R2Bucket, 'test/key.jpg', data, 'image/jpeg');

			expect(result).toBe('test/key.jpg');
			expect(bucket.put).toHaveBeenCalledWith('test/key.jpg', data, {
				httpMetadata: { contentType: 'image/jpeg' }
			});
		});

		it('uses default content type if not specified', async () => {
			const bucket = createMockR2Bucket();
			const data = new TextEncoder().encode('test data').buffer;

			const result = await uploadToR2(bucket as unknown as R2Bucket, 'test/key', data);

			expect(result).toBe('test/key');
			expect(bucket.put).toHaveBeenCalledWith('test/key', data, {
				httpMetadata: { contentType: 'application/octet-stream' }
			});
		});
	});

	describe('uploadTrainingPhoto', () => {
		it('uploads training photo with correct key format', async () => {
			const bucket = createMockR2Bucket();
			const data = new TextEncoder().encode('photo data').buffer;

			const result = await uploadTrainingPhoto(
				bucket as unknown as R2Bucket,
				'user-123',
				1700000000000,
				0,
				data
			);

			expect(result).toBe('training/user-123/1700000000000_0.jpg');
			expect(bucket.put).toHaveBeenCalledWith(
				'training/user-123/1700000000000_0.jpg',
				data,
				{ httpMetadata: { contentType: 'image/jpeg' } }
			);
		});

		it('uses custom content type', async () => {
			const bucket = createMockR2Bucket();
			const data = new TextEncoder().encode('photo data').buffer;

			const result = await uploadTrainingPhoto(
				bucket as unknown as R2Bucket,
				'user-123',
				1700000000000,
				1,
				data,
				'image/png'
			);

			expect(result).toBe('training/user-123/1700000000000_1.jpg');
		});
	});

	describe('uploadTrainingZip', () => {
		it('uploads training zip with correct key format', async () => {
			const bucket = createMockR2Bucket();
			const data = new TextEncoder().encode('zip data').buffer;

			const result = await uploadTrainingZip(
				bucket as unknown as R2Bucket,
				'user-123',
				1700000000000,
				data
			);

			expect(result).toBe('training/user-123/1700000000000_photos.zip');
			expect(bucket.put).toHaveBeenCalledWith(
				'training/user-123/1700000000000_photos.zip',
				data,
				{ httpMetadata: { contentType: 'application/zip' } }
			);
		});
	});

	describe('uploadGeneratedImage', () => {
		it('uploads generated image with correct key format', async () => {
			const bucket = createMockR2Bucket();
			const data = new TextEncoder().encode('image data').buffer;

			const result = await uploadGeneratedImage(
				bucket as unknown as R2Bucket,
				'user-123',
				'gen-456',
				data
			);

			expect(result).toBe('outputs/user-123/gen-456.webp');
			expect(bucket.put).toHaveBeenCalledWith(
				'outputs/user-123/gen-456.webp',
				data,
				{ httpMetadata: { contentType: 'image/webp' } }
			);
		});

		it('uses custom content type', async () => {
			const bucket = createMockR2Bucket();
			const data = new TextEncoder().encode('image data').buffer;

			const result = await uploadGeneratedImage(
				bucket as unknown as R2Bucket,
				'user-123',
				'gen-456',
				data,
				'image/png'
			);

			expect(result).toBe('outputs/user-123/gen-456.webp');
		});
	});

	describe('getPublicUrl', () => {
		it('constructs URL with key', () => {
			const result = getPublicUrl('https://cdn.example.com', 'training/user-123/photo.jpg');
			expect(result).toBe('https://cdn.example.com/training/user-123/photo.jpg');
		});

		it('handles trailing slash in base URL', () => {
			const result = getPublicUrl('https://cdn.example.com/', 'outputs/user/photo.webp');
			expect(result).toBe('https://cdn.example.com/outputs/user/photo.webp');
		});

		it('handles base URL without trailing slash', () => {
			const result = getPublicUrl('https://cdn.example.com', 'key');
			expect(result).toBe('https://cdn.example.com/key');
		});

		it('handles empty key', () => {
			const result = getPublicUrl('https://cdn.example.com', '');
			expect(result).toBe('https://cdn.example.com/');
		});
	});
});