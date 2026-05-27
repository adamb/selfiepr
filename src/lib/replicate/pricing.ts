/**
 * Replicate Cost Calculation
 * Hardware rates and cost calculation for training and generation
 */

interface HardwareRate {
	name: string;
	ratePerSecond: number; // dollars
}

const HARDWARE_RATES: Record<string, HardwareRate> = {
	'Nvidia A100 (40GB)': { name: 'Nvidia A100 (40GB)', ratePerSecond: 0.000695 },
	'Nvidia A100 (80GB)': { name: 'Nvidia A100 (80GB)', ratePerSecond: 0.00139 },
	'Nvidia H100': { name: 'Nvidia H100', ratePerSecond: 0.00234 },
	'Nvidia T4 (High-memory)': { name: 'Nvidia T4 (High-memory)', ratePerSecond: 0.000225 },
	// Default fallback
	'default': { name: 'Unknown', ratePerSecond: 0.001 }
};

/**
 * Calculate actual cost in cents based on hardware and predict time
 */
export function calculateCostCents(hardware: string, predictTimeSeconds: number): number {
	const rate = HARDWARE_RATES[hardware]?.ratePerSecond ?? HARDWARE_RATES['default'].ratePerSecond;
	const costDollars = rate * predictTimeSeconds;
	return Math.ceil(costDollars * 100); // Convert to cents, round up
}

/**
 * Calculate deduction amount (2x actual cost)
 */
export function calculateDeductionCents(costCents: number): number {
	return costCents * 2;
}

/**
 * Get hardware rate for display
 */
export function getHardwareRate(hardware: string): number {
	return HARDWARE_RATES[hardware]?.ratePerSecond ?? HARDWARE_RATES['default'].ratePerSecond;
}

/**
 * Estimate training cost (typically ~1000 steps on A100)
 */
export function estimateTrainingCost(): { minCents: number; maxCents: number } {
	// Training typically takes 5-15 minutes on A100 (40GB)
	const minSeconds = 5 * 60;
	const maxSeconds = 15 * 60;

	return {
		minCents: calculateDeductionCents(calculateCostCents('Nvidia A100 (40GB)', minSeconds)),
		maxCents: calculateDeductionCents(calculateCostCents('Nvidia A100 (40GB)', maxSeconds))
	};
}

/**
 * Estimate generation cost (typically 10-30 seconds)
 */
export function estimateGenerationCost(): { minCents: number; maxCents: number } {
	// Generation typically takes 10-30 seconds
	const minSeconds = 10;
	const maxSeconds = 30;

	return {
		minCents: calculateDeductionCents(calculateCostCents('Nvidia A100 (40GB)', minSeconds)),
		maxCents: calculateDeductionCents(calculateCostCents('Nvidia A100 (40GB)', maxSeconds))
	};
}