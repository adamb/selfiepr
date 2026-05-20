import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getStripeClient } from '$lib/stripe/server.js';
import { completePurchase, creditBalance } from '$lib/db/queries.js';

export const POST: RequestHandler = async ({ request, platform }) => {
	const db = platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database not available');
	}

	const stripe = getStripeClient({
		STRIPE_SECRET_KEY: platform?.env?.STRIPE_SECRET_KEY ?? ''
	});

	// Read raw body FIRST for signature verification
	const rawBody = await request.text();
	const signature = request.headers.get('stripe-signature');

	if (!signature) {
		throw error(400, 'Missing Stripe signature');
	}

	let event: Stripe.Event;

	try {
		event = stripe.webhooks.constructEvent(
			rawBody,
			signature,
			platform?.env?.STRIPE_WEBHOOK_SECRET ?? ''
		);
	} catch (err) {
		console.error('Stripe webhook signature verification failed:', err);
		throw error(400, 'Invalid signature');
	}

	// Only handle checkout.session.completed
	if (event.type !== 'checkout.session.completed') {
		return json({ received: true });
	}

	const session = event.data.object as Stripe.Checkout.Session;
	const stripeSessionId = session.id;

	// Idempotency: check if already processed
	// completePurchase does this atomically with WHERE status='pending'
	const result = await completePurchase(db, stripeSessionId);

	if (!result.success) {
		// Already processed or not found - return 200 OK (idempotent)
		return json({ received: true });
	}

	// Credit the balance
	const credited = await creditBalance(db, result.userId!, result.amountCents!);

	if (!credited) {
		// This shouldn't happen, but log it
		console.error(`Failed to credit balance for user ${result.userId}, amount ${result.amountCents}`);
	}

	return json({ received: true });
};

import Stripe from 'stripe';