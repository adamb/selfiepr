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
			// Trust Tailscale proxy origins
			trustedOrigins: ['https://hermes.tail1df8a8.ts.net', 'http://localhost:8788']
		}
	}
};

export default config;