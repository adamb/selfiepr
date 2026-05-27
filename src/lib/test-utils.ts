import { vi } from 'vitest';

/**
 * Mock D1Database for testing
 */
export function createMockD1Database(): D1Database {
	return {
		prepare: vi.fn(() => ({
			bind: vi.fn(() => ({
				first: vi.fn().mockResolvedValue(null),
				all: vi.fn().mockResolvedValue({ results: [] }),
				run: vi.fn().mockResolvedValue({ meta: { changes: 0 } })
			})),
			first: vi.fn().mockResolvedValue(null),
			all: vi.fn().mockResolvedValue({ results: [] }),
			run: vi.fn().mockResolvedValue({ meta: { changes: 0 } })
		})),
		batch: vi.fn().mockResolvedValue([]),
		dump: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
		exec: vi.fn().mockResolvedValue({ count: 0, results: [] })
	} as unknown as D1Database;
}

/**
 * Mock R2Bucket for testing
 */
export function createMockR2Bucket(): R2Bucket {
	return {
		get: vi.fn().mockResolvedValue(null),
		put: vi.fn().mockResolvedValue({ key: 'test-key' }),
		delete: vi.fn().mockResolvedValue(undefined),
		list: vi.fn().mockResolvedValue({ objects: [] }),
		head: vi.fn().mockResolvedValue(null)
	} as unknown as R2Bucket;
}

/**
 * Mock platform environment for testing
 */
export function createMockPlatform(overrides: Partial<App.Platform> = {}): App.Platform {
	return {
		env: {
			DB: createMockD1Database(),
			SELFIE_BUCKET: createMockR2Bucket(),
			SUPABASE_URL: 'https://test.supabase.co',
			SUPABASE_ANON_KEY: 'test-anon-key',
			REPLICATE_API_TOKEN: 'test-replicate-token',
			PUBLIC_R2_URL: 'https://test-r2.example.com',
			...overrides.env
		},
		...overrides
	} as App.Platform;
}

/**
 * Mock Supabase auth client
 */
export function createMockSupabaseAuth() {
	return {
		signUp: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
		signInWithPassword: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' }, session: {} }, error: null }),
		signInWithOAuth: vi.fn().mockResolvedValue({ data: { url: 'https://oauth.example.com' }, error: null }),
		signOut: vi.fn().mockResolvedValue({ error: null }),
		getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
		exchangeCodeForSession: vi.fn().mockResolvedValue({ data: {}, error: null })
	};
}

/**
 * Mock Supabase client
 */
export function createMockSupabaseClient() {
	return {
		auth: createMockSupabaseAuth(),
		from: vi.fn().mockReturnValue({
			select: vi.fn().mockReturnThis(),
			insert: vi.fn().mockReturnThis(),
			update: vi.fn().mockReturnThis(),
			delete: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			order: vi.fn().mockReturnThis(),
			limit: vi.fn().mockReturnThis(),
			single: vi.fn().mockResolvedValue({ data: null, error: null })
		}),
		rpc: vi.fn().mockResolvedValue({ data: null, error: null })
	};
}

/**
 * Mock SvelteKit request event
 */
export function createMockRequestEvent(overrides: Partial<RequestEvent> = {}): RequestEvent {
	return {
		locals: {
			supabase: createMockSupabaseClient() as unknown as typeof import('@supabase/ssr').createServerClient extends (...args: any[]) => infer R ? R : never,
			session: null,
			user: null
		},
		platform: createMockPlatform(),
		cookies: {
			get: vi.fn(),
			set: vi.fn(),
			delete: vi.fn(),
			getAll: vi.fn().mockReturnValue([])
		},
		url: new URL('http://localhost/test'),
		request: new Request('http://localhost/test'),
		params: {},
		route: { id: '/test' } as unknown as App.Route,
		isSubRequest: false,
		...overrides
	} as unknown as RequestEvent;
}

/**
 * Mock Stripe client
 */
export function createMockStripeClient() {
	return {
		checkout: {
			sessions: {
				create: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test' })
			}
		},
		webhooks: {
			signatures: {
				constructEvent: vi.fn().mockReturnValue({ type: 'checkout.session.completed', data: { object: {} } })
			}
		}
	};
}

/**
 * Mock Replicate client
 */
export function createMockReplicateClient() {
	return {
		predictions: {
			create: vi.fn().mockResolvedValue({ id: 'test-prediction-id' }),
			get: vi.fn().mockResolvedValue({ status: 'succeeded', output: 'https://example.com/image.png' })
		}
	};
}