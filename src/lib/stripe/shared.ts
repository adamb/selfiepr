export const TOP_UP_AMOUNTS = [500, 1000, 2000, 5000] as const;
export type TopUpAmount = (typeof TOP_UP_AMOUNTS)[number];

export function isValidTopUpAmount(cents: number): cents is TopUpAmount {
	return (TOP_UP_AMOUNTS as readonly number[]).includes(cents);
}

export function formatCentsAsDollars(cents: number): string {
	return (cents / 100).toFixed(2);
}