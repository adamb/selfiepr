export type UserBalance = {
	user_id: string;
	balance_cents: number;
	total_added_cents: number;
	total_deducted_cents: number;
	created_at: string;
	updated_at: string;
};

export type UserModelStatus = 'uploading' | 'training' | 'succeeded' | 'failed';

export type UserModel = {
	id: string;
	user_id: string;
	replicate_training_id: string | null;
	replicate_model_name: string | null;
	lora_weights_url: string | null;
	status: UserModelStatus;
	training_cost_cents: number | null;
	deducted_cents: number | null;
	hardware: string | null;
	predict_time_seconds: number | null;
	error_message: string | null;
	superseded_by: string | null;
	created_at: string;
	updated_at: string;
};

export type GenerationStatus = 'pending' | 'processing' | 'succeeded' | 'failed';

export type Generation = {
	id: string;
	user_id: string;
	model_id: string;
	prompt: string;
	style_preset: string | null;
	replicate_prediction_id: string | null;
	status: GenerationStatus;
	output_image_url: string | null;
	output_r2_key: string | null;
	cost_cents: number | null;
	deducted_cents: number | null;
	hardware: string | null;
	predict_time_seconds: number | null;
	error_message: string | null;
	created_at: string;
	updated_at: string;
};

export type ReplicateCost = {
	id: string;
	user_id: string;
	job_type: 'training' | 'generation';
	job_id: string;
	hardware: string;
	predict_time_seconds: number;
	actual_cost_cents: number;
	deducted_cents: number;
	created_at: string;
};

export type PurchaseStatus = 'pending' | 'completed' | 'failed';

export type Purchase = {
	id: string;
	user_id: string;
	stripe_session_id: string;
	amount_cents: number;
	status: PurchaseStatus;
	created_at: string;
	updated_at: string;
};

export type NewUserBalance = Omit<UserBalance, 'created_at' | 'updated_at'>;
export type NewUserModel = Omit<UserModel, 'created_at' | 'updated_at'>;
export type NewGeneration = Omit<Generation, 'created_at' | 'updated_at'>;
export type NewReplicateCost = Omit<ReplicateCost, 'created_at'>;
export type NewPurchase = Omit<Purchase, 'created_at' | 'updated_at'>;