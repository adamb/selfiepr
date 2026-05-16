import type {
	UserBalance,
	UserModel,
	UserModelStatus,
	Generation,
	GenerationStatus,
	ReplicateCost,
	Purchase,
	PurchaseStatus,
	NewUserModel,
	NewGeneration,
	NewReplicateCost,
	NewPurchase
} from './schema.js';

function now(): string {
	return new Date().toISOString();
}

// ── User Balances ──

export async function getBalance(db: D1Database, userId: string): Promise<UserBalance | null> {
	return db.prepare('SELECT * FROM user_balances WHERE user_id = ?').bind(userId).first<UserBalance>();
}

export async function createBalance(db: D1Database, userId: string): Promise<void> {
	const timestamp = now();
	await db
		.prepare(
			'INSERT INTO user_balances (user_id, balance_cents, total_added_cents, total_deducted_cents, created_at, updated_at) VALUES (?, 0, 0, 0, ?, ?)'
		)
		.bind(userId, timestamp, timestamp)
		.run();
}

export async function creditBalance(
	db: D1Database,
	userId: string,
	amountCents: number
): Promise<boolean> {
	const timestamp = now();
	const result = await db
		.prepare(
			`INSERT INTO user_balances (user_id, balance_cents, total_added_cents, total_deducted_cents, created_at, updated_at)
			 VALUES (?, ?, ?, 0, ?, ?)
			 ON CONFLICT(user_id) DO UPDATE SET
			 balance_cents = balance_cents + ?,
			 total_added_cents = total_added_cents + ?,
			 updated_at = ?`
		)
		.bind(userId, amountCents, amountCents, timestamp, timestamp, amountCents, amountCents, timestamp)
		.run();
	return result.meta.changes > 0;
}

export async function deductBalance(
	db: D1Database,
	userId: string,
	amountCents: number
): Promise<boolean> {
	const timestamp = now();
	const result = await db
		.prepare(
			`UPDATE user_balances SET
			 balance_cents = balance_cents - ?,
			 total_deducted_cents = total_deducted_cents + ?,
			 updated_at = ?
			 WHERE user_id = ? AND balance_cents >= ?`
		)
		.bind(amountCents, amountCents, timestamp, userId, amountCents)
		.run();
	return result.meta.changes > 0;
}

// ── User Models ──

export async function getActiveModel(db: D1Database, userId: string): Promise<UserModel | null> {
	return db
		.prepare(
			"SELECT * FROM user_models WHERE user_id = ? AND status IN ('uploading', 'training', 'succeeded') ORDER BY created_at DESC LIMIT 1"
		)
		.bind(userId)
		.first<UserModel>();
}

export async function getModelById(db: D1Database, modelId: string): Promise<UserModel | null> {
	return db.prepare('SELECT * FROM user_models WHERE id = ?').bind(modelId).first<UserModel>();
}

export async function createModel(db: D1Database, model: NewUserModel): Promise<void> {
	const timestamp = now();
	await db
		.prepare(
			`INSERT INTO user_models (id, user_id, replicate_training_id, replicate_model_name, lora_weights_url, status, training_cost_cents, deducted_cents, hardware, predict_time_seconds, error_message, superseded_by, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			model.id,
			model.user_id,
			model.replicate_training_id,
			model.replicate_model_name,
			model.lora_weights_url,
			model.status,
			model.training_cost_cents,
			model.deducted_cents,
			model.hardware,
			model.predict_time_seconds,
			model.error_message,
			model.superseded_by,
			timestamp,
			timestamp
		)
		.run();
}

export async function updateModelStatus(
	db: D1Database,
	modelId: string,
	fromStatus: UserModelStatus,
	toStatus: UserModelStatus,
	updates: Partial<Pick<UserModel, 'replicate_training_id' | 'lora_weights_url' | 'training_cost_cents' | 'deducted_cents' | 'hardware' | 'predict_time_seconds' | 'error_message'>> = {}
): Promise<boolean> {
	const timestamp = now();
	const setClauses: string[] = ['status = ?', 'updated_at = ?'];
	const values: (string | number | null)[] = [toStatus, timestamp];

	for (const [key, value] of Object.entries(updates)) {
		if (value !== undefined) {
			setClauses.push(`${key} = ?`);
			values.push(value);
		}
	}

	values.push(modelId, fromStatus);
	const result = await db
		.prepare(`UPDATE user_models SET ${setClauses.join(', ')} WHERE id = ? AND status = ?`)
		.bind(...values)
		.run();
	return result.meta.changes > 0;
}

// ── Generations ──

export async function createGeneration(db: D1Database, generation: NewGeneration): Promise<void> {
	const timestamp = now();
	await db
		.prepare(
			`INSERT INTO generations (id, user_id, model_id, prompt, style_preset, replicate_prediction_id, status, output_image_url, output_r2_key, cost_cents, deducted_cents, hardware, predict_time_seconds, error_message, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			generation.id,
			generation.user_id,
			generation.model_id,
			generation.prompt,
			generation.style_preset,
			generation.replicate_prediction_id,
			generation.status,
			generation.output_image_url,
			generation.output_r2_key,
			generation.cost_cents,
			generation.deducted_cents,
			generation.hardware,
			generation.predict_time_seconds,
			generation.error_message,
			timestamp,
			timestamp
		)
		.run();
}

export async function getGenerationById(
	db: D1Database,
	generationId: string,
	userId: string
): Promise<Generation | null> {
	return db
		.prepare('SELECT * FROM generations WHERE id = ? AND user_id = ?')
		.bind(generationId, userId)
		.first<Generation>();
}

export async function updateGenerationStatus(
	db: D1Database,
	generationId: string,
	fromStatus: GenerationStatus,
	toStatus: GenerationStatus,
	updates: Partial<Pick<Generation, 'replicate_prediction_id' | 'output_image_url' | 'output_r2_key' | 'cost_cents' | 'deducted_cents' | 'hardware' | 'predict_time_seconds' | 'error_message'>> = {}
): Promise<boolean> {
	const timestamp = now();
	const setClauses: string[] = ['status = ?', 'updated_at = ?'];
	const values: (string | number | null)[] = [toStatus, timestamp];

	for (const [key, value] of Object.entries(updates)) {
		if (value !== undefined) {
			setClauses.push(`${key} = ?`);
			values.push(value);
		}
	}

	values.push(generationId, fromStatus);
	const result = await db
		.prepare(`UPDATE generations SET ${setClauses.join(', ')} WHERE id = ? AND status = ?`)
		.bind(...values)
		.run();
	return result.meta.changes > 0;
}

export async function getGenerations(
	db: D1Database,
	userId: string,
	page: number = 1,
	perPage: number = 20
): Promise<Generation[]> {
	const offset = (page - 1) * perPage;
	const { results } = await db
		.prepare(
			"SELECT * FROM generations WHERE user_id = ? AND status = 'succeeded' ORDER BY created_at DESC LIMIT ? OFFSET ?"
		)
		.bind(userId, perPage, offset)
		.all<Generation>();
	return results;
}

// ── Replicate Costs ──

export async function createReplicateCost(db: D1Database, cost: NewReplicateCost): Promise<void> {
	const timestamp = now();
	await db
		.prepare(
			`INSERT INTO replicate_costs (id, user_id, job_type, job_id, hardware, predict_time_seconds, actual_cost_cents, deducted_cents, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			cost.id,
			cost.user_id,
			cost.job_type,
			cost.job_id,
			cost.hardware,
			cost.predict_time_seconds,
			cost.actual_cost_cents,
			cost.deducted_cents,
			timestamp
		)
		.run();
}

// ── Purchases ──

export async function createPurchase(db: D1Database, purchase: NewPurchase): Promise<void> {
	const timestamp = now();
	await db
		.prepare(
			`INSERT INTO purchases (id, user_id, stripe_session_id, amount_cents, status, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			purchase.id,
			purchase.user_id,
			purchase.stripe_session_id,
			purchase.amount_cents,
			purchase.status,
			timestamp,
			timestamp
		)
		.run();
}

export async function completePurchase(
	db: D1Database,
	stripeSessionId: string
): Promise<{ success: boolean; userId: string | null; amountCents: number | null }> {
	const timestamp = now();

	// Compare-and-swap: only transition from 'pending' to 'completed'
	const result = await db
		.prepare(
			`UPDATE purchases SET status = 'completed', updated_at = ? WHERE stripe_session_id = ? AND status = 'pending'`
		)
		.bind(timestamp, stripeSessionId)
		.run();

	if (result.meta.changes === 0) {
		// Already processed or not found
		return { success: false, userId: null, amountCents: null };
	}

	// Fetch the purchase details to credit the balance
	const purchase = await db
		.prepare('SELECT user_id, amount_cents FROM purchases WHERE stripe_session_id = ?')
		.bind(stripeSessionId)
		.first<{ user_id: string; amount_cents: number }>();

	if (!purchase) {
		return { success: false, userId: null, amountCents: null };
	}

	return { success: true, userId: purchase.user_id, amountCents: purchase.amount_cents };
}

export async function getPurchases(
	db: D1Database,
	userId: string,
	page: number = 1,
	perPage: number = 20
): Promise<Purchase[]> {
	const offset = (page - 1) * perPage;
	const { results } = await db
		.prepare(
			"SELECT * FROM purchases WHERE user_id = ? AND status = 'completed' ORDER BY created_at DESC LIMIT ? OFFSET ?"
		)
		.bind(userId, perPage, offset)
		.all<Purchase>();
	return results;
}