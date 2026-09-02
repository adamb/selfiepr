import Stripe from 'stripe';

export function getStripeClient(env: {
	STRIPE_SECRET_KEY: string;
}): Stripe {
	return new Stripe(env.STRIPE_SECRET_KEY, {
		apiVersion: '2026-04-22.dahlia',
		httpClient: Stripe.createFetchHttpClient()
	});
}

export {
	TOP_UP_AMOUNTS,
	isValidTopUpAmount,
	formatCentsAsDollars
} from './shared.js';
export type { TopUpAmount } from './shared.js';