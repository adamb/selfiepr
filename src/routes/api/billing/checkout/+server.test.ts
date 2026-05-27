import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server.js';
import { createMockRequestEvent, createMockD1Database } from '$lib/test-utils.js';
import { getStripeClient } from '$lib/stripe/server.js';
import { error } from '@sveltejs/kit';

// Mock Stripe client
vi.mock('$lib/stripe/server.js', () => ({
	getStripeClient: vi.fn(),
	TOP_UP_AMOUNTS: [500, 1000, 2000, 5000],
	isValidTopUpAmount: (cents: number) => [500, 1000, 2000, 5000].includes(cents)
}));

// Mock database queries
vi.mock('$lib/db/queries.js', () => ({
	createPurchase: vi.fn()
}));

// Helper to catch SvelteKit errors
async function expectError(fn: () => Promise<any>, status: number, message: string) {
	try {
		await fn();
		expect.fail('Expected error to be thrown');
	} catch (err: any) {
		expect(err.status).toBe(status);
		expect(err.body?.message || err.message).toContain(message);
	}
}

describe('Billing checkout endpoint', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns 401 when not authenticated', async () => {
		const event = createMockRequestEvent({
			locals: {
				supabase: {} as any,
				session: null,
				user: null
			}
		});

		await expectError(() => POST(event), 401, 'Unauthorized');
	});

	it('returns 500 when database is not available', async () => {
		const event = createMockRequestEvent({
			locals: {
				supabase: {} as any,
				session: { user: { id: 'test-user' } } as any,
				user: { id: 'test-user', email: 'test@example.com' } as any
			},
			platform: { env: {} } as any
		});

		await expectError(() => POST(event), 500, 'Database not available');
	});

	it('returns 400 for invalid top-up amount', async () => {
		const event = createMockRequestEvent({
			locals: {
				supabase: {} as any,
				session: { user: { id: 'test-user' } } as any,
				user: { id: 'test-user', email: 'test@example.com' } as any
			},
			platform: {
				env: {
					DB: createMockD1Database()
				}
			} as any,
			request: new Request('http://localhost/api/billing/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ amountCents: 999 }) // Invalid amount
			})
		});

		await expectError(() => POST(event), 400, 'Invalid amount');
	});

	it('creates checkout session for valid amount', async () => {
		const mockDb = createMockD1Database();
		const mockStripeClient = {
			checkout: {
				sessions: {
					create: vi.fn().mockResolvedValue({
						id: 'cs_test_123',
						url: 'https://checkout.stripe.com/test'
					})
				}
			}
		};

		(getStripeClient as ReturnType<typeof vi.fn>).mockReturnValue(mockStripeClient);

		const event = createMockRequestEvent({
			locals: {
				supabase: {} as any,
				session: { user: { id: 'test-user' } } as any,
				user: { id: 'test-user', email: 'test@example.com' } as any
			},
			platform: {
				env: {
					DB: mockDb,
					STRIPE_SECRET_KEY: 'sk_test_123',
					STRIPE_SUCCESS_URL: 'http://localhost/success',
					STRIPE_CANCEL_URL: 'http://localhost/cancel'
				}
			} as any,
			request: new Request('http://localhost/api/billing/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ amountCents: 1000 })
			})
		});

		const response = await POST(event);
		const result = await response.json();

		expect(result).toHaveProperty('url');
		expect(result.url).toBe('https://checkout.stripe.com/test');
		expect(mockStripeClient.checkout.sessions.create).toHaveBeenCalledWith(
			expect.objectContaining({
				payment_method_types: ['card'],
				mode: 'payment',
				customer_email: 'test@example.com',
				line_items: expect.arrayContaining([
					expect.objectContaining({
						price_data: expect.objectContaining({
							currency: 'usd',
							unit_amount: 1000
						}),
						quantity: 1
					})
				])
			})
		);
	});

	it('creates checkout session for minimum amount ($5)', async () => {
		const mockDb = createMockD1Database();
		const mockStripeClient = {
			checkout: {
				sessions: {
					create: vi.fn().mockResolvedValue({
						id: 'cs_test_123',
						url: 'https://checkout.stripe.com/test'
					})
				}
			}
		};

		(getStripeClient as ReturnType<typeof vi.fn>).mockReturnValue(mockStripeClient);

		const event = createMockRequestEvent({
			locals: {
				supabase: {} as any,
				session: { user: { id: 'test-user' } } as any,
				user: { id: 'test-user', email: 'test@example.com' } as any
			},
			platform: {
				env: {
					DB: mockDb,
					STRIPE_SECRET_KEY: 'sk_test_123'
				}
			} as any,
			request: new Request('http://localhost/api/billing/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ amountCents: 500 })
			})
		});

		const response = await POST(event);
		expect(response.status).toBe(200);
	});

	it('creates checkout session for maximum amount ($50)', async () => {
		const mockDb = createMockD1Database();
		const mockStripeClient = {
			checkout: {
				sessions: {
					create: vi.fn().mockResolvedValue({
						id: 'cs_test_123',
						url: 'https://checkout.stripe.com/test'
					})
				}
			}
		};

		(getStripeClient as ReturnType<typeof vi.fn>).mockReturnValue(mockStripeClient);

		const event = createMockRequestEvent({
			locals: {
				supabase: {} as any,
				session: { user: { id: 'test-user' } } as any,
				user: { id: 'test-user', email: 'test@example.com' } as any
			},
			platform: {
				env: {
					DB: mockDb,
					STRIPE_SECRET_KEY: 'sk_test_123'
				}
			} as any,
			request: new Request('http://localhost/api/billing/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ amountCents: 5000 })
			})
		});

		const response = await POST(event);
		expect(response.status).toBe(200);
	});
});