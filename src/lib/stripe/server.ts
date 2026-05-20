import Stripe from 'stripe';

export function getStripeClient(env: {
	STRIPE_SECRET_KEY: string;
}): Stripe {
	return new Stripe(env.STRIPE_SECRET_KEY, {
		apiVersion: '2026-04-22.dahlia',
		httpClient: Stripe.createFetchHttpClient()
	});
}

export const TOP_UP_AMOUNTS = [500, 1000, 2000, 5000] as const;
export type TopUpAmount = (typeof TOP_UP_AMOUNTS)[number];

export function isValidTopUpAmount(cents: number): cents is TopUpAmount {
	return TOP_UP_AMOUNTS.includes(cents as TopUpAmount);
}

export function formatCentsAsDollars(cents: number): string {
	return (cents / 100).toFixed(2);
}