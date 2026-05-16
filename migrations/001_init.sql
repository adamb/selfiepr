-- Selfie v2 schema
-- D1 is SQLite: no uuid(), no timestamptz, no RETURNING on upserts
-- All UUIDs generated with crypto.randomUUID() in JS
-- All timestamps stored as ISO8601 TEXT
-- FK constraints are decorative in D1; enforce referential integrity in app code

CREATE TABLE user_balances (
  user_id TEXT PRIMARY KEY,
  balance_cents INTEGER NOT NULL DEFAULT 0,
  total_added_cents INTEGER NOT NULL DEFAULT 0,
  total_deducted_cents INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE user_models (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  replicate_training_id TEXT,
  replicate_model_name TEXT,
  lora_weights_url TEXT,
  status TEXT NOT NULL CHECK(status IN ('uploading','training','succeeded','failed')),
  training_cost_cents INTEGER,
  deducted_cents INTEGER,
  hardware TEXT,
  predict_time_seconds REAL,
  error_message TEXT,
  superseded_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE generations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  style_preset TEXT,
  replicate_prediction_id TEXT,
  status TEXT NOT NULL CHECK(status IN ('pending','processing','succeeded','failed')),
  output_image_url TEXT,
  output_r2_key TEXT,
  cost_cents INTEGER,
  deducted_cents INTEGER,
  hardware TEXT,
  predict_time_seconds REAL,
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE replicate_costs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  job_type TEXT NOT NULL CHECK(job_type IN ('training','generation')),
  job_id TEXT NOT NULL,
  hardware TEXT NOT NULL,
  predict_time_seconds REAL NOT NULL,
  actual_cost_cents INTEGER NOT NULL,
  deducted_cents INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE purchases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  stripe_session_id TEXT UNIQUE NOT NULL,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending','completed','failed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Indexes for common queries
CREATE INDEX idx_user_models_user ON user_models(user_id);
CREATE INDEX idx_user_models_status ON user_models(user_id, status);
CREATE INDEX idx_generations_user ON generations(user_id);
CREATE INDEX idx_generations_model ON generations(model_id);
CREATE INDEX idx_generations_status ON generations(user_id, status);
CREATE INDEX idx_replicate_costs_user ON replicate_costs(user_id);
CREATE INDEX idx_purchases_user ON purchases(user_id);
CREATE INDEX idx_purchases_session ON purchases(stripe_session_id);

-- One active model per user: only one row with status in (uploading, training, succeeded)
CREATE UNIQUE INDEX idx_user_models_one_active ON user_models(user_id) WHERE status IN ('uploading', 'training', 'succeeded');