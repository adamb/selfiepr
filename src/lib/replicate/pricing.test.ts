import { describe, it, expect } from 'vitest';
import {
	calculateCostCents,
	calculateDeductionCents,
	getHardwareRate,
	estimateTrainingCost,
	estimateGenerationCost
} from './pricing.js';

describe('Replicate pricing', () => {
	describe('calculateCostCents', () => {
		it('calculates cost for A100 40GB', () => {
			// Rate: $0.000695/second
			// 100 seconds = $0.0695 = 6.95 cents, rounded up to 7 cents
			const result = calculateCostCents('Nvidia A100 (40GB)', 100);
			expect(result).toBe(7);
		});

		it('calculates cost for A100 80GB', () => {
			// Rate: $0.00139/second
			// 100 seconds = $0.139 = 13.9 cents, rounded up to 14 cents
			const result = calculateCostCents('Nvidia A100 (80GB)', 100);
			expect(result).toBe(14);
		});

		it('calculates cost for H100', () => {
			// Rate: $0.00234/second
			// 100 seconds = $0.234 = 23.4 cents, rounded up to 24 cents
			const result = calculateCostCents('Nvidia H100', 100);
			expect(result).toBe(24);
		});

		it('calculates cost for T4', () => {
			// Rate: $0.000225/second
			// 100 seconds = $0.0225 = 2.25 cents, rounded up to 3 cents
			const result = calculateCostCents('Nvidia T4 (High-memory)', 100);
			expect(result).toBe(3);
		});

		it('uses default rate for unknown hardware', () => {
			// Default rate: $0.001/second
			// 100 seconds = $0.10 = 10 cents
			const result = calculateCostCents('Unknown Hardware', 100);
			expect(result).toBe(10);
		});

		it('rounds up to nearest cent', () => {
			// 0.01 seconds at default rate = $0.00001 = 0.001 cents, rounds up to 1 cent
			const result = calculateCostCents('Unknown Hardware', 0.01);
			expect(result).toBe(1);
		});

		it('handles zero seconds', () => {
			const result = calculateCostCents('Nvidia A100 (40GB)', 0);
			expect(result).toBe(0);
		});
	});

	describe('calculateDeductionCents', () => {
		it('returns 2x the cost (user markup)', () => {
			expect(calculateDeductionCents(100)).toBe(200);
			expect(calculateDeductionCents(50)).toBe(100);
			expect(calculateDeductionCents(1)).toBe(2);
		});

		it('handles zero cost', () => {
			expect(calculateDeductionCents(0)).toBe(0);
		});
	});

	describe('getHardwareRate', () => {
		it('returns correct rate for known hardware', () => {
			expect(getHardwareRate('Nvidia A100 (40GB)')).toBe(0.000695);
			expect(getHardwareRate('Nvidia A100 (80GB)')).toBe(0.00139);
			expect(getHardwareRate('Nvidia H100')).toBe(0.00234);
			expect(getHardwareRate('Nvidia T4 (High-memory)')).toBe(0.000225);
		});

		it('returns default rate for unknown hardware', () => {
			expect(getHardwareRate('Unknown')).toBe(0.001);
		});
	});

	describe('estimateTrainingCost', () => {
		it('returns an object with min and max cents', () => {
			const estimate = estimateTrainingCost();

			expect(estimate).toHaveProperty('minCents');
			expect(estimate).toHaveProperty('maxCents');
			expect(typeof estimate.minCents).toBe('number');
			expect(typeof estimate.maxCents).toBe('number');
		});

		it('min is less than max', () => {
			const estimate = estimateTrainingCost();
			expect(estimate.minCents).toBeLessThan(estimate.maxCents);
		});

		it('values are reasonable (within expected range)', () => {
			const estimate = estimateTrainingCost();
			// Training cost should be roughly $0.42 - $1.25 with 2x markup
			// (5-15 min at $0.000695/sec * 2)
			expect(estimate.minCents).toBeGreaterThan(40);
			expect(estimate.maxCents).toBeLessThan(150);
		});
	});

	describe('estimateGenerationCost', () => {
		it('returns an object with min and max cents', () => {
			const estimate = estimateGenerationCost();

			expect(estimate).toHaveProperty('minCents');
			expect(estimate).toHaveProperty('maxCents');
			expect(typeof estimate.minCents).toBe('number');
			expect(typeof estimate.maxCents).toBe('number');
		});

		it('min is less than max', () => {
			const estimate = estimateGenerationCost();
			expect(estimate.minCents).toBeLessThan(estimate.maxCents);
		});

		it('values are reasonable (within expected range)', () => {
			const estimate = estimateGenerationCost();
			// Generation cost should be roughly $0.01 - $0.04 with 2x markup
			// (10-30 sec at $0.000695/sec * 2)
			expect(estimate.minCents).toBeGreaterThan(1);
			expect(estimate.maxCents).toBeLessThan(10);
		});
	});

	describe('cost calculation consistency', () => {
		it('estimateGenerationCost matches calculateCostCents for A100', () => {
			const estimate = estimateGenerationCost();
			// 10-30 seconds at A100 rate, multiplied by 2 for user deduction
			const minFromCalc = calculateDeductionCents(calculateCostCents('Nvidia A100 (40GB)', 10));
			const maxFromCalc = calculateDeductionCents(calculateCostCents('Nvidia A100 (40GB)', 30));

			expect(estimate.minCents).toBe(minFromCalc);
			expect(estimate.maxCents).toBe(maxFromCalc);
		});

		it('estimateTrainingCost matches calculateCostCents for A100', () => {
			const estimate = estimateTrainingCost();
			// 5-15 minutes = 300-900 seconds
			const minFromCalc = calculateDeductionCents(calculateCostCents('Nvidia A100 (40GB)', 300));
			const maxFromCalc = calculateDeductionCents(calculateCostCents('Nvidia A100 (40GB)', 900));

			expect(estimate.minCents).toBe(minFromCalc);
			expect(estimate.maxCents).toBe(maxFromCalc);
		});
	});
});