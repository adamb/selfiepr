import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}', 'src/__tests__/**/*.{test,spec}.{js,ts}', 'tests/**/*.test.{js,ts}'],
		environment: 'jsdom',
		setupFiles: ['src/test-setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			include: ['src/**/*.{js,ts,svelte}'],
			exclude: [
				'src/test-setup.ts',
				'src/test-utils.ts',
				'src/__tests__/**',
				'src/app.html',
				'**/*.d.ts',
				'**/node_modules/**'
			]
		}
	}
});