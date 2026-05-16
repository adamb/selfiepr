/// <reference types="@sveltejs/kit" />
/// <reference types="@cloudflare/workers-types" />

declare global {
	namespace App {
		interface Locals {
			supabase: ReturnType<typeof import('@supabase/ssr').createServerClient>;
			session: import('@supabase/supabase-js').Session | null;
			user: import('@supabase/supabase-js').User | null;
		}
		interface Platform {
			env: {
				DB: D1Database;
				SELFIE_BUCKET: R2Bucket;
				SUPABASE_URL: string;
				SUPABASE_ANON_KEY: string;
				SUPABASE_SERVICE_ROLE_KEY: string;
				REPLICATE_API_TOKEN: string;
				REPLICATE_USERNAME: string;
				REPLICATE_WEBHOOK_SIGNING_KEY: string;
				STRIPE_SECRET_KEY: string;
				STRIPE_WEBHOOK_SECRET: string;
				STRIPE_SUCCESS_URL: string;
				STRIPE_CANCEL_URL: string;
				PUBLIC_R2_URL: string;
			};
		}
	}
}

export {};