import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		env: {
			publicPrefix: 'PUBLIC_'
		},
		csrf: {
			// Allow form submissions from any origin (needed for Tailscale proxy)
			checkOrigin: false
		}
	}
};

export default config;