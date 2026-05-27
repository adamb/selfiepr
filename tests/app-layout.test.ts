import { describe, it, expect, vi, beforeEach } from 'vitest';
import { redirect } from '@sveltejs/kit';

// Mock the redirect function to track calls
vi.mock('@sveltejs/kit', async () => {
	const actual = await vi.importActual('@sveltejs/kit');
	return {
		...actual,
		redirect: vi.fn((status, location) => {
			throw { status, location, type: 'redirect' };
		})
	};
});

// Mock the queries module
vi.mock('$lib/db/queries.js', () => ({
	getBalance: vi.fn(),
	getActiveModel: vi.fn()
}));

import { load } from '../src/routes/app/+layout.server.js';
import { getBalance, getActiveModel } from '$lib/db/queries.js';

function createMockEvent(overrides: Partial<any> = {}) {
	const path = overrides.path ?? '/app';
	return {
		locals: {
			session: overrides.session ?? { user: { id: 'test-user' } },
			user: overrides.user ?? { id: 'test-user' }
		},
		platform: {
			env: {
				DB: overrides.db ?? 'mock-db'
			}
		},
		url: new URL(`http://localhost${path}`)
	};
}

describe('App layout server', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Authentication check', () => {
		it('redirects to login when not authenticated', async () => {
			const event = {
				locals: {
					session: null,
					user: null
				},
				platform: {
					env: { DB: 'mock-db' }
				},
				url: new URL('http://localhost/app')
			};

			await expect(() => load(event)).rejects.toMatchObject({
				status: 302,
				location: '/auth/login'
			});
		});

		it('proceeds when authenticated', async () => {
			const event = createMockEvent();
			(getBalance as any).mockResolvedValue({ balance_cents: 1000 });
			(getActiveModel as any).mockResolvedValue({ status: 'succeeded' });

			const result = await load(event);
			expect(result).toHaveProperty('user');
			expect(result).toHaveProperty('balance');
		});
	});

	describe('Balance check', () => {
		it('redirects to billing when balance is zero', async () => {
			const event = createMockEvent({ path: '/app/generate' });
			(getBalance as any).mockResolvedValue({ balance_cents: 0 });
			(getActiveModel as any).mockResolvedValue(null);

			await expect(() => load(event)).rejects.toMatchObject({
				status: 302,
				location: '/app/billing'
			});
		});

		it('redirects to billing when balance is null', async () => {
			const event = createMockEvent({ path: '/app/generate' });
			(getBalance as any).mockResolvedValue(null);
			(getActiveModel as any).mockResolvedValue(null);

			await expect(() => load(event)).rejects.toMatchObject({
				status: 302,
				location: '/app/billing'
			});
		});

		it('does NOT redirect to billing when already on billing page', async () => {
			const event = createMockEvent({ path: '/app/billing' });
			(getBalance as any).mockResolvedValue({ balance_cents: 0 });
			(getActiveModel as any).mockResolvedValue(null);

			const result = await load(event);
			expect(result).toHaveProperty('state', 'needs_billing');
		});
	});

	describe('Model check', () => {
		it('redirects to onboarding when no model exists', async () => {
			const event = createMockEvent({ path: '/app/generate' });
			(getBalance as any).mockResolvedValue({ balance_cents: 1000 });
			(getActiveModel as any).mockResolvedValue(null);

			await expect(() => load(event)).rejects.toMatchObject({
				status: 302,
				location: '/app/onboarding'
			});
		});

		it('does NOT redirect to onboarding when already on onboarding', async () => {
			const event = createMockEvent({ path: '/app/onboarding' });
			(getBalance as any).mockResolvedValue({ balance_cents: 1000 });
			(getActiveModel as any).mockResolvedValue(null);

			const result = await load(event);
			expect(result).toHaveProperty('state', 'needs_onboarding');
		});

		it('redirects to training when model is uploading', async () => {
			const event = createMockEvent({ path: '/app/onboarding' });
			(getBalance as any).mockResolvedValue({ balance_cents: 1000 });
			(getActiveModel as any).mockResolvedValue({ status: 'uploading' });

			await expect(() => load(event)).rejects.toMatchObject({
				status: 302,
				location: '/app/training'
			});
		});

		it('redirects to training when model is training', async () => {
			const event = createMockEvent({ path: '/app/onboarding' });
			(getBalance as any).mockResolvedValue({ balance_cents: 1000 });
			(getActiveModel as any).mockResolvedValue({ status: 'training' });

			await expect(() => load(event)).rejects.toMatchObject({
				status: 302,
				location: '/app/training'
			});
		});

		it('does NOT redirect to training when already on training page', async () => {
			const event = createMockEvent({ path: '/app/training' });
			(getBalance as any).mockResolvedValue({ balance_cents: 1000 });
			(getActiveModel as any).mockResolvedValue({ status: 'training' });

			// Should not throw redirect
			const result = await load(event);
			expect(result).toHaveProperty('model');
		});

		it('redirects to onboarding when model failed', async () => {
			const event = createMockEvent({ path: '/app/generate' });
			(getBalance as any).mockResolvedValue({ balance_cents: 1000 });
			(getActiveModel as any).mockResolvedValue({ status: 'failed' });

			await expect(() => load(event)).rejects.toMatchObject({
				status: 302,
				location: '/app/onboarding?retry=1'
			});
		});

		it('does NOT redirect to onboarding when already there with failed model', async () => {
			const event = createMockEvent({ path: '/app/onboarding' });
			(getBalance as any).mockResolvedValue({ balance_cents: 1000 });
			(getActiveModel as any).mockResolvedValue({ status: 'failed' });

			// Should not throw redirect
			const result = await load(event);
			expect(result).toHaveProperty('model');
		});
	});

	describe('Happy path', () => {
		it('returns ready state when model is succeeded', async () => {
			const event = createMockEvent({ path: '/app/generate' });
			(getBalance as any).mockResolvedValue({ balance_cents: 1000 });
			(getActiveModel as any).mockResolvedValue({ status: 'succeeded', id: 'model-123' });

			const result = await load(event);
			expect(result).toHaveProperty('state', 'ready');
			expect(result).toHaveProperty('balance');
			expect(result).toHaveProperty('model');
		});
	});

	describe('No database (dev mode)', () => {
		it('returns needs_billing state when DB is not available', async () => {
			const event = {
				locals: {
					session: { user: { id: 'test-user' } },
					user: { id: 'test-user' }
				},
				platform: {
					env: {} // No DB
				},
				url: new URL('http://localhost/app')
			};

			const result = await load(event);
			expect(result).toHaveProperty('state', 'needs_billing');
		});
	});
});