import { describe, it, expect } from 'vitest';
import { validateImageFile, getFileExtension } from './resize.js';

// Note: resizeImage requires browser canvas API which is harder to test in jsdom
// We test the synchronous utility functions here

describe('Image resize utilities', () => {
	describe('validateImageFile', () => {
		it('accepts JPEG files', () => {
			const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
			const result = validateImageFile(file);

			expect(result.valid).toBe(true);
			expect(result.error).toBeUndefined();
		});

		it('accepts PNG files', () => {
			const file = new File([''], 'test.png', { type: 'image/png' });
			const result = validateImageFile(file);

			expect(result.valid).toBe(true);
			expect(result.error).toBeUndefined();
		});

		it('accepts WebP files', () => {
			const file = new File([''], 'test.webp', { type: 'image/webp' });
			const result = validateImageFile(file);

			expect(result.valid).toBe(true);
			expect(result.error).toBeUndefined();
		});

		it('rejects GIF files', () => {
			const file = new File([''], 'test.gif', { type: 'image/gif' });
			const result = validateImageFile(file);

			expect(result.valid).toBe(false);
			expect(result.error).toContain('Invalid file type');
		});

		it('rejects BMP files', () => {
			const file = new File([''], 'test.bmp', { type: 'image/bmp' });
			const result = validateImageFile(file);

			expect(result.valid).toBe(false);
			expect(result.error).toContain('Invalid file type');
		});

		it('rejects files larger than 20MB', () => {
			// Create a file that's 21MB
			const largeContent = new Array(21 * 1024 * 1024).fill('x').join('');
			const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
			const result = validateImageFile(file);

			expect(result.valid).toBe(false);
			expect(result.error).toContain('File too large');
		});

		it('accepts files at exactly 20MB', () => {
			// Create a file that's exactly 20MB
			const content = 'x'.repeat(20 * 1024 * 1024);
			const file = new File([content], 'test.jpg', { type: 'image/jpeg' });
			const result = validateImageFile(file);

			expect(result.valid).toBe(true);
		});

		it('accepts small files', () => {
			const file = new File(['small'], 'test.jpg', { type: 'image/jpeg' });
			const result = validateImageFile(file);

			expect(result.valid).toBe(true);
		});

		it('rejects unknown MIME types', () => {
			const file = new File([''], 'test.txt', { type: 'text/plain' });
			const result = validateImageFile(file);

			expect(result.valid).toBe(false);
			expect(result.error).toContain('text/plain');
		});

		it('handles files with empty MIME type', () => {
			const file = new File([''], 'test', { type: '' });
			const result = validateImageFile(file);

			expect(result.valid).toBe(false);
			expect(result.error).toContain('Invalid file type');
		});
	});

	describe('getFileExtension', () => {
		it('returns jpg for image/jpeg', () => {
			expect(getFileExtension('image/jpeg')).toBe('jpg');
		});

		it('returns png for image/png', () => {
			expect(getFileExtension('image/png')).toBe('png');
		});

		it('returns webp for image/webp', () => {
			expect(getFileExtension('image/webp')).toBe('webp');
		});

		it('returns jpg for unknown content types', () => {
			expect(getFileExtension('image/gif')).toBe('jpg');
			expect(getFileExtension('image/bmp')).toBe('jpg');
			expect(getFileExtension('')).toBe('jpg');
			expect(getFileExtension('unknown')).toBe('jpg');
		});
	});
});