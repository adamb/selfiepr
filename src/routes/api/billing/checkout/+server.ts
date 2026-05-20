import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getStripeClient, isValidTopUpAmount } from '$lib/stripe/server.js';
import { createPurchase } from '$lib/db/queries.js';
import { TOP_UP_AMOUNTS } from '$lib/stripe/server.js';

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	// Validate session
	if (!locals.session || !locals.user) {
		throw error(401, 'Unauthorized');
	}

	const db = platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database not available');
	}

	const stripe = getStripeClient({
		STRIPE_SECRET_KEY: platform?.env?.STRIPE_SECRET_KEY ?? ''
	});

	// Parse request body
	const body = await request.json() as { amountCents: number };
	const amountCents = body.amountCents;

	if (!isValidTopUpAmount(amountCents)) {
		throw error(400, `Invalid amount. Must be one of: ${TOP_UP_AMOUNTS.join(', ')} cents`);
	}

	const userId = locals.user.id;
	const purchaseId = crypto.randomUUID();

	// Create Stripe Checkout Session with dynamic pricing
	const session = await stripe.checkout.sessions.create({
		payment_method_types: ['card'],
		mode: 'payment',
		customer_email: locals.user.email,
		line_items: [
			{
				price_data: {
					currency: 'usd',
					unit_amount: amountCents,
					product_data: {
						name: `Selfie Balance: $${(amountCents / 100).toFixed(2)}`,
						description: 'Add balance to your Selfie account for AI portrait generation'
					}
				},
				quantity: 1
			}
		],
		success_url: platform?.env?.STRIPE_SUCCESS_URL ?? 'http://localhost:8788/app/billing?topup=success',
		cancel_url: platform?.env?.STRIPE_CANCEL_URL ?? 'http://localhost:8788/app/billing?topup=cancel',
		metadata: {
			user_id: userId,
			purchase_id: purchaseId,
			amount_cents: amountCents.toString()
		}
	});

	// Insert purchase row with status='pending'
	await createPurchase(db, {
		id: purchaseId,
		user_id: userId,
		stripe_session_id: session.id,
		amount_cents: amountCents,
		status: 'pending'
	});

	return json({ url: session.url });
};