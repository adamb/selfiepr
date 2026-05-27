import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	getBalance,
	createBalance,
	creditBalance,
	deductBalance,
	getActiveModel,
	getModelById,
	createModel,
	updateModelStatus,
	createGeneration,
	getGenerationById,
	updateGenerationStatus,
	getGenerations,
	createReplicateCost,
	createPurchase,
	completePurchase,
	getPurchases
} from './queries.js';

// Mock D1Database
function createMockDb() {
	return {
		prepare: vi.fn(() => ({
			bind: vi.fn(() => ({
				first: vi.fn(),
				all: vi.fn(),
				run: vi.fn()
			})),
			first: vi.fn(),
			all: vi.fn(),
			run: vi.fn()
		}))
	};
}

describe('User Balances', () => {
	describe('getBalance', () => {
		it('returns user balance when found', async () => {
			const db = createMockDb();
			const mockBalance = {
				user_id: 'user-123',
				balance_cents: 1000,
				total_added_cents: 1000,
				total_deducted_cents: 0,
				created_at: '2024-01-01T00:00:00Z',
				updated_at: '2024-01-01T00:00:00Z'
			};
			db.prepare.mockImplementationOnce(() => ({
				bind: vi.fn(() => ({
					first: vi.fn().mockResolvedValue(mockBalance)
				}))
			}));

			const result = await getBalance(db as unknown as D1Database, 'user-123');

			expect(result).toEqual(mockBalance);
		});

		it('returns null when balance not found', async () => {
			const db = createMockDb();
			db.prepare.mockImplementationOnce(() => ({
				bind: vi.fn(() => ({
					first: vi.fn().mockResolvedValue(null)
				}))
			}));

			const result = await getBalance(db as unknown as D1Database, 'user-123');

			expect(result).toBeNull();
		});
	});

	describe('createBalance', () => {
		it('creates a new balance record with zero balance', async () => {
			const db = createMockDb();
			const mockRun = vi.fn().mockResolvedValue({ meta: { changes: 1 } });
			db.prepare.mockImplementationOnce(() => ({
				bind: vi.fn(() => ({
					run: mockRun
				}))
			}));

			await createBalance(db as unknown as D1Database, 'user-123');

			expect(db.prepare).toHaveBeenCalledWith(
				expect.stringContaining('INSERT INTO user_balances')
			);
		});
	});

	describe('creditBalance', () => {
		it('credits balance and returns true on success', async () => {
			const db = createMockDb();
			db.prepare.mockImplementationOnce(() => ({
				bind: vi.fn(() => ({
					run: vi.fn().mockResolvedValue({ meta: { changes: 1 } })
				}))
			}));

			const result = await creditBalance(db as unknown as D1Database, 'user-123', 500);

			expect(result).toBe(true);
		});

		it('returns false when no rows changed', async () => {
			const db = createMockDb();
			db.prepare.mockImplementationOnce(() => ({
				bind: vi.fn(() => ({
					run: vi.fn().mockResolvedValue({ meta: { changes: 0 } })
				}))
			}));

			const result = await creditBalance(db as unknown as D1Database, 'user-123', 500);

			expect(result).toBe(false);
		});
	});

	describe('deductBalance', () => {
		it('deducts balance when sufficient funds exist', async () => {
			const db = createMockDb();
			db.prepare.mockImplementationOnce(() => ({
				bind: vi.fn(() => ({
					run: vi.fn().mockResolvedValue({ meta: { changes: 1 } })
				}))
			}));

			const result = await deductBalance(db as unknown as D1Database, 'user-123', 100);

			expect(result).toBe(true);
			expect(db.prepare).toHaveBeenCalledWith(
				expect.stringContaining('balance_cents >= ?')
			);
		});

		it('fails when insufficient balance', async () => {
			const db = createMockDb();
			db.prepare.mockImplementationOnce(() => ({
				bind: vi.fn(() => ({
					run: vi.fn().mockResolvedValue({ meta: { changes: 0 } })
				}))
			}));

			const result = await deductBalance(db as unknown as D1Database, 'user-123', 10000);

			expect(result).toBe(false);
		});
	});
});

describe('User Models', () => {
	describe('getActiveModel', () => {
		it('returns the most recent active model', async () => {
			const db = createMockDb();
			const mockModel = {
				id: 'model-123',
				user_id: 'user-123',
				status: 'succeeded'
			};
			db.prepare.mockImplementationOnce(() => ({
				bind: vi.fn(() => ({
					first: vi.fn().mockResolvedValue(mockModel)
				}))
			}));

			const result = await getActiveModel(db as unknown as D1Database, 'user-123');

			expect(result).toEqual(mockModel);
			expect(db.prepare).toHaveBeenCalledWith(
				expect.stringContaining("status IN ('uploading', 'training', 'succeeded')")
			);
		});

		it('returns null when no active model exists', async () => {
			const db = createMockDb();
			db.prepare.mockImplementationOnce(() => ({
				bind: vi.fn(() => ({
					first: vi.fn().mockResolvedValue(null)
				}))
			}));

			const result = await getActiveModel(db as unknown as D1Database, 'user-123');

			expect(result).toBeNull();
		});
	});

	describe('getModelById', () => {
		it('returns model by id', async () => {
			const db = createMockDb();
			const mockModel = { id: 'model-123', user_id: 'user-123' };
			db.prepare.mockImplementationOnce(() => ({
				bind: vi.fn(() => ({
					first: vi.fn().mockResolvedValue(mockModel)
				}))
			}));

			const result = await getModelById(db as unknown as D1Database, 'model-123');

			expect(result).toEqual(mockModel);
		});
	});

	describe('createModel', () => {
		it('inserts a new model record', async () => {
			const db = createMockDb();
			const mockRun = vi.fn().mockResolvedValue({ meta: { changes: 1 } });
			db.prepare.mockImplementationOnce(() => ({
				bind: vi.fn(() => ({
					run: mockRun
				}))
			}));

			await createModel(db as unknown as D1Database, {
				id: 'model-123',
				user_id: 'user-123',
				replicate_training_id: 'training-123',
				replicate_model_name: 'my-model',
				status: 'uploading'
			});

			expect(db.prepare).toHaveBeenCalledWith(
				expect.stringContaining('INSERT INTO user_models')
			);
		});
	});

	describe('updateModelStatus', () => {
		it('updates status with compare-and-swap pattern', async () => {
			const db = createMockDb();
			db.prepare.mockImplementationOnce(() => ({
				bind: vi.fn(() => ({
					run: vi.fn().mockResolvedValue({ meta: { changes: 1 } })
				}))
			}));

			const result = await updateModelStatus(
				db as unknown as D1Database,
				'model-123',
				'training',
				'succeeded'
			);

			expect(result).toBe(true);
			expect(db.prepare).toHaveBeenCalledWith(
				expect.stringContaining('WHERE id = ? AND status = ?')
			);
		});

		it('returns false when status does not match expected', async () => {
			const db = createMockDb();
			db.prepare.mockImplementationOnce(() => ({
				bind: vi.fn(() => ({
					run: vi.fn().mockResolvedValue({ meta: { changes: 0 } })
				}))
			}));

			const result = await updateModelStatus(
				db as unknown as D1Database,
				'model-123',
				'training',
				'succeeded'
			);

			expect(result).toBe(false);
		});

		it('includes additional fields in update', async () => {
			const db = createMockDb();
			db.prepare.mockImplementationOnce(() => ({
				bind: vi.fn(() => ({
					run: vi.fn().mockResolvedValue({ meta: { changes: 1 } })
				}))
			}));

			await updateModelStatus(
				db as unknown as D1Database,
				'model-123',
				'training',
				'succeeded',
				{ lora_weights_url: 'https://example.com/weights', training_cost_cents: 100 }
			);

			expect(db.prepare).toHaveBeenCalledWith(
				expect.stringContaining('lora_weights_url')
			);
		});
	});
});

describe('Generations', () => {
	describe('createGeneration', () => {
		it('creates a new generation record', async () => {
			const db = createMockDb();
			db.prepare.mockImplementationOnce(() => ({
				bind: vi.fn(() => ({
					run: vi.fn().mockResolvedValue({ meta: { changes: 1 } })
				}))
			}));

			await createGeneration(db as unknown as D1Database, {
				id: 'gen-123',
				user_id: 'user-123',
				model_id: 'model-123',
				prompt: 'a portrait',
				status: 'pending'
			});

			expect(db.prepare).toHaveBeenCalledWith(
				expect.stringContaining('INSERT INTO generations')
			);
		});
	});

	describe('getGenerationById', () => {
		it('returns generation for correct user', async () => {
			const db = createMockDb();
			const mockGen = { id: 'gen-123', user_id: 'user-123' };
			db.prepare.mockImplementationOnce(() => ({
				bind: vi.fn(() => ({
					first: vi.fn().mockResolvedValue(mockGen)
				}))
			}));

			const result = await getGenerationById(db as unknown as D1Database, 'gen-123', 'user-123');

			expect(result).toEqual(mockGen);
		});
	});

	describe('updateGenerationStatus', () => {
		it('updates generation status with compare-and-swap', async () => {
			const db = createMockDb();
			db.prepare.mockImplementationOnce(() => ({
				bind: vi.fn(() => ({
					run: vi.fn().mockResolvedValue({ meta: { changes: 1 } })
				}))
			}));

			const result = await updateGenerationStatus(
				db as unknown as D1Database,
				'gen-123',
				'pending',
				'succeeded',
				{ output_image_url: 'https://example.com/image.png' }
			);

			expect(result).toBe(true);
		});
	});

	describe('getGenerations', () => {
		it('returns paginated succeeded generations', async () => {
			const db = createMockDb();
			const mockGens = [
				{ id: 'gen-1', user_id: 'user-123', status: 'succeeded' },
				{ id: 'gen-2', user_id: 'user-123', status: 'succeeded' }
			];
			db.prepare.mockImplementationOnce(() => ({
				bind: vi.fn(() => ({
					all: vi.fn().mockResolvedValue({ results: mockGens })
				}))
			}));

			const result = await getGenerations(db as unknown as D1Database, 'user-123', 1, 20);

			expect(result).toEqual(mockGens);
			expect(db.prepare).toHaveBeenCalledWith(
				expect.stringContaining("status = 'succeeded'")
			);
		});
	});
});

describe('Replicate Costs', () => {
	describe('createReplicateCost', () => {
		it('creates a cost record', async () => {
			const db = createMockDb();
			db.prepare.mockImplementationOnce(() => ({
				bind: vi.fn(() => ({
					run: vi.fn().mockResolvedValue({ meta: { changes: 1 } })
				}))
			}));

			await createReplicateCost(db as unknown as D1Database, {
				id: 'cost-123',
				user_id: 'user-123',
				job_type: 'training',
				job_id: 'model-123',
				hardware: 'Nvidia A100 (40GB)',
				predict_time_seconds: 60,
				actual_cost_cents: 100,
				deducted_cents: 200
			});

			expect(db.prepare).toHaveBeenCalledWith(
				expect.stringContaining('INSERT INTO replicate_costs')
			);
		});
	});
});

describe('Purchases', () => {
	describe('createPurchase', () => {
		it('creates a pending purchase record', async () => {
			const db = createMockDb();
			db.prepare.mockImplementationOnce(() => ({
				bind: vi.fn(() => ({
					run: vi.fn().mockResolvedValue({ meta: { changes: 1 } })
				}))
			}));

			await createPurchase(db as unknown as D1Database, {
				id: 'purchase-123',
				user_id: 'user-123',
				stripe_session_id: 'cs_123',
				amount_cents: 1000,
				status: 'pending'
			});

			expect(db.prepare).toHaveBeenCalledWith(
				expect.stringContaining('INSERT INTO purchases')
			);
		});
	});

	describe('completePurchase', () => {
		it('completes a pending purchase and returns details', async () => {
			const db = createMockDb();
			db.prepare.mockImplementationOnce(() => ({
				bind: vi.fn(() => ({
					run: vi.fn().mockResolvedValue({ meta: { changes: 1 } })
				}))
			}));
			db.prepare.mockImplementationOnce(() => ({
				bind: vi.fn(() => ({
					first: vi.fn().mockResolvedValue({ user_id: 'user-123', amount_cents: 1000 })
				}))
			}));

			const result = await completePurchase(db as unknown as D1Database, 'cs_123');

			expect(result).toEqual({ success: true, userId: 'user-123', amountCents: 1000 });
		});

		it('returns failure when purchase already completed', async () => {
			const db = createMockDb();
			db.prepare.mockImplementationOnce(() => ({
				bind: vi.fn(() => ({
					run: vi.fn().mockResolvedValue({ meta: { changes: 0 } })
				}))
			}));

			const result = await completePurchase(db as unknown as D1Database, 'cs_123');

			expect(result).toEqual({ success: false, userId: null, amountCents: null });
		});
	});

	describe('getPurchases', () => {
		it('returns completed purchases for user', async () => {
			const db = createMockDb();
			const mockPurchases = [
				{ id: 'purchase-1', user_id: 'user-123', status: 'completed' }
			];
			db.prepare.mockImplementationOnce(() => ({
				bind: vi.fn(() => ({
					all: vi.fn().mockResolvedValue({ results: mockPurchases })
				}))
			}));

			const result = await getPurchases(db as unknown as D1Database, 'user-123', 1, 20);

			expect(result).toEqual(mockPurchases);
			expect(db.prepare).toHaveBeenCalledWith(
				expect.stringContaining("status = 'completed'")
			);
		});
	});
});