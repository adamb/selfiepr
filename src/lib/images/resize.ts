/**
 * Client-side image resize utility
 * Resize images to max 1024px / <1MB using canvas API
 */

export interface ResizedImage {
	data: ArrayBuffer;
	contentType: string;
	width: number;
	height: number;
}

const MAX_DIMENSION = 1024;
const MAX_SIZE_BYTES = 1024 * 1024; // 1MB

export async function resizeImage(file: File): Promise<ResizedImage> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			URL.revokeObjectURL(img.src);

			let { width, height } = img;

			// Scale down if needed
			if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
				const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
				width = Math.round(width * ratio);
				height = Math.round(height * ratio);
			}

			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;

			const ctx = canvas.getContext('2d');
			if (!ctx) {
				reject(new Error('Failed to get canvas context'));
				return;
			}

			ctx.drawImage(img, 0, 0, width, height);

			// Try different quality levels to get under 1MB
			let quality = 0.9;
			const contentType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';

			const tryEncode = (): void => {
				canvas.toBlob(
					(blob) => {
						if (!blob) {
							reject(new Error('Failed to encode image'));
							return;
						}

						// If under 1MB or at minimum quality, we're done
						if (blob.size <= MAX_SIZE_BYTES || quality <= 0.1) {
							blob.arrayBuffer().then((buffer) => {
								resolve({
									data: buffer,
									contentType,
									width,
									height
								});
							});
							return;
						}

						// Reduce quality and try again
						quality -= 0.1;
						canvas.toBlob(tryEncode, 'image/jpeg', quality);
					},
					contentType,
					quality
				);
			};

			tryEncode();
		};

		img.onerror = () => {
			URL.revokeObjectURL(img.src);
			reject(new Error('Failed to load image'));
		};

		img.src = URL.createObjectURL(file);
	});
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
	const validTypes = ['image/jpeg', 'image/png', 'image/webp'];

	if (!validTypes.includes(file.type)) {
		return {
			valid: false,
			error: `Invalid file type: ${file.type}. Must be JPEG, PNG, or WebP.`
		};
	}

	if (file.size > 20 * 1024 * 1024) {
		return {
			valid: false,
			error: 'File too large. Maximum size is 20MB.'
		};
	}

	return { valid: true };
}

export function getFileExtension(contentType: string): string {
	switch (contentType) {
		case 'image/jpeg':
			return 'jpg';
		case 'image/png':
			return 'png';
		case 'image/webp':
			return 'webp';
		default:
			return 'jpg';
	}
}