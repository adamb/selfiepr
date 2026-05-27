import { describe, it, expect } from 'vitest';
import { getStripeClient, TOP_UP_AMOUNTS, isValidTopUpAmount, formatCentsAsDollars } from './server.js';

describe('Stripe server utilities', () => {
	describe('getStripeClient', () => {
		it('creates a Stripe client with the provided key', () => {
			const client = getStripeClient({ STRIPE_SECRET_KEY: 'sk_test_123' });

			expect(client).toBeDefined();
			expect(client).toBeInstanceOf(Object);
			expect(typeof client.checkout.sessions.create).toBe('function');
		});
	});

	describe('TOP_UP_AMOUNTS', () => {
		it('contains allowed top-up amounts in cents', () => {
			expect(TOP_UP_AMOUNTS).toEqual([500, 1000, 2000, 5000]);
		});

		it('all amounts are positive integers', () => {
			TOP_UP_AMOUNTS.forEach((amount) => {
				expect(Number.isInteger(amount)).toBe(true);
				expect(amount).toBeGreaterThan(0);
			});
		});
	});

	describe('isValidTopUpAmount', () => {
		it('returns true for valid amounts', () => {
			expect(isValidTopUpAmount(500)).toBe(true);
			expect(isValidTopUpAmount(1000)).toBe(true);
			expect(isValidTopUpAmount(2000)).toBe(true);
			expect(isValidTopUpAmount(5000)).toBe(true);
		});

		it('returns false for invalid amounts', () => {
			expect(isValidTopUpAmount(0)).toBe(false);
			expect(isValidTopUpAmount(100)).toBe(false);
			expect(isValidTopUpAmount(999)).toBe(false);
			expect(isValidTopUpAmount(-500)).toBe(false);
			expect(isValidTopUpAmount(500.5)).toBe(false);
		});

		it('works as type guard', () => {
			const amount: number = 1000;

			if (isValidTopUpAmount(amount)) {
				// TypeScript should infer this as TopUpAmount
				const validAmount: typeof TOP_UP_AMOUNTS[number] = amount;
				expect(validAmount).toBe(1000);
			}
		});
	});

	describe('formatCentsAsDollars', () => {
		it('formats cents as dollars with two decimal places', () => {
			expect(formatCentsAsDollars(0)).toBe('0.00');
			expect(formatCentsAsDollars(100)).toBe('1.00');
			expect(formatCentsAsDollars(500)).toBe('5.00');
			expect(formatCentsAsDollars(1234)).toBe('12.34');
			expect(formatCentsAsDollars(99)).toBe('0.99');
		});

		it('handles large amounts', () => {
			expect(formatCentsAsDollars(100000)).toBe('1000.00');
			expect(formatCentsAsDollars(999999)).toBe('9999.99');
		});

		it('handles decimal amounts correctly', () => {
			expect(formatCentsAsDollars(101)).toBe('1.01');
			expect(formatCentsAsDollars(110)).toBe('1.10');
		});
	});
});