# Selfie v2 — Implementation Plan

## Status: approved

## Architecture Overview

SvelteKit app on Cloudflare Pages/Workers with:
- **Auth**: Supabase Auth (email+password, Google OAuth) — SSR via @supabase/ssr
- **Data**: Cloudflare D1 (SQLite) — 5 tables, all UUIDs/Timestamps in JS
- **Storage**: Cloudflare R2 — training photos, zips, generated outputs
- **AI**: Replicate API — ostris/flux-dev-lora-trainer for training, black-forest-labs/flux-dev-lora for generation
- **Billing**: Stripe Checkout Sessions (dynamic pricing) — webhook for balance credits
- **Design**: Dark luxury — #080808 bg, #F0EBE1 text, #D4A853 accent

## Design Review Gate — Fixes Applied

Based on PM, Architect, and Security reviews:

1. **State machine**: Added `failed` → retry transitions. User can retrain without re-uploading photos (photos persist in R2). Added `superseded_by` column for model history.
2. **Webhook safety**: All state transitions use compare-and-swap UPDATE with WHERE on expected current status. Never read-then-write. `result.meta.changes === 0` means already processed or wrong state — return 200 OK.
3. **D1 FK constraints**: Not enforced in D1/SQLite. All referential integrity enforced in application code.
4. **R2/D1 consistency**: Two-phase writes — D1 first with pending status, then R2 upload, then update D1. Cleanup cron for orphans.
5. **Stripe idempotency**: Claim purchase with `UPDATE purchases SET status = 'completed' WHERE stripe_session_id = ? AND status = 'pending'`; if changes=0, already processed, return 200.
6. **Balance polling**: After Stripe redirect, client polls balance with loading state.
7. **Minimum balance threshold**: Pre-generation check requires balance >= $1.00 (conservative, covers cost variance).
8. **One active model per user**: Partial unique index ensures only one model with status in (uploading, training, succeeded).
9. **Photo validation**: Server-side validation of file type, size, and count.
10. **Error states**: All failure modes mapped to specific UX (error message, retry link, balance impact).

## Work Units (aligned with human checkpoints)

### WU1: Infrastructure (DoD 1-6)
**Human checkpoint #1 after this**

Files:
- `wrangler.toml` — D1 binding (DB), R2 binding (SELFIE_BUCKET), env vars
- `migrations/001_init.sql` — 5 tables with all review fixes
- `src/app.d.ts` — Platform interface with DB and SELFIE_BUCKET
- `src/lib/db/schema.ts` — TypeScript types for all 5 tables
- `src/lib/db/queries.ts` — Typed D1 query helpers with atomic patterns

Key decisions:
- All UUIDs: `crypto.randomUUID()` in JS before INSERT
- All timestamps: ISO8601 TEXT in D1
- Atomic balance deductions: single UPDATE with WHERE clause, check meta.changes
- Compare-and-swap for all state transitions
- One active model per user via partial unique index

### WU2: Auth (DoD 7-11)
**Human checkpoint #2 after this**

Files:
- `src/hooks.server.ts` — Supabase session injection via @supabase/ssr
- `src/lib/supabase/server.ts` — createServerClient helper
- `src/lib/supabase/client.ts` — createBrowserClient helper
- `src/routes/auth/signup/+page.svelte` — Email+password signup form
- `src/routes/auth/signup/+page.server.ts` — Signup action
- `src/routes/auth/login/+page.svelte` — Login form
- `src/routes/auth/login/+page.server.ts` — Login action
- `src/routes/auth/callback/+server.ts` — Google OAuth callback
- `src/routes/auth/logout/+server.ts` — POST logout handler

### WU3: App State Machine & Layout (DoD 12-16, 84-87)

Files:
- `src/routes/app/+layout.server.ts` — State machine redirects with failure handling
- `src/routes/app/+layout.svelte` — App shell with nav, balance display
- `src/lib/auth/guards.ts` — Route guard helpers
- `src/app.css` — Theme tokens (colors, fonts)

State machine logic:
1. No session → /auth/login
2. No user_balances row OR balance=0 → /app/billing
3. No user_models row → /app/onboarding
4. user_models status in (uploading, training) → /app/training
5. user_models status = 'failed' → /app/onboarding (with retry option, photos already in R2)
6. user_models status = 'succeeded' → /app/generate (allowed)

### WU4: Billing — API & Page (DoD 44-48, 61-71)
**Human checkpoint #5 after this**

Files:
- `src/routes/api/billing/checkout/+server.ts` — POST create Stripe session
- `src/routes/api/webhooks/stripe/+server.ts` — POST Stripe webhook (raw body first)
- `src/lib/stripe/server.ts` — Stripe client, signature verification
- `src/routes/app/billing/+page.svelte` — Balance display, top-up buttons, purchase history
- `src/routes/app/billing/+page.server.ts` — Load balance and purchases

Key decisions:
- Dynamic price_data in Stripe Checkout (no pre-created products)
- Webhook reads raw body FIRST with request.text() for signature verification
- Idempotent: `UPDATE purchases SET status = 'completed' WHERE stripe_session_id = ? AND status = 'pending'`
- If changes=0, already processed, return 200 OK
- Atomic upsert for balance: `INSERT ... ON CONFLICT(user_id) DO UPDATE SET balance_cents = balance_cents + ?`
- Client polls balance after Stripe redirect with loading state

### WU5: Onboarding & Training API (DoD 17-26, 49-53)
**Human checkpoint #3 after this**

Files:
- `src/routes/app/onboarding/+page.svelte` — Upload UI with drag-drop, preview, resize
- `src/routes/app/onboarding/+page.server.ts` — Load balance for guard
- `src/routes/api/train/+server.ts` — POST multipart upload, zip, start training
- `src/lib/replicate/client.ts` — Replicate API wrapper
- `src/lib/replicate/training.ts` — Start training function
- `src/lib/replicate/pricing.ts` — Hardware rate table + cost calculation
- `src/lib/storage/r2.ts` — R2 upload helpers
- `src/lib/images/resize.ts` — Client-side image resize

Key decisions:
- Client-side canvas resize to max 1024px / <1MB before upload
- Server-side validation: file type, size, count (5-10)
- Server-side JSZip to create photos.zip in R2
- Two-phase: D1 insert with status='uploading' first, then R2 uploads, then start training
- Replicate training: ostris/flux-dev-lora-trainer, steps=1000, trigger_word='TOK'
- Training destination: create Replicate model via API first, use as destination
- If training fails, user can retry without re-uploading (photos in R2)

### WU6: Training Wait & Generation (DoD 27-43, 54-60)
**Human checkpoint #4 after this**

Files:
- `src/routes/app/training/+page.svelte` — Polling UI, gradient orb, elapsed time
- `src/routes/app/training/+page.server.ts` — Load model status
- `src/routes/api/generation/[id]/status/+server.ts` — GET status endpoint
- `src/routes/app/generate/+page.svelte` — Style presets, prompt input, generate UI
- `src/routes/app/generate/+page.server.ts` — Load balance + model info
- `src/routes/api/generate/+server.ts` — POST create generation
- `src/lib/replicate/generation.ts` — Start prediction function
- `src/routes/app/gallery/+page.svelte` — Paginated grid
- `src/routes/app/gallery/+page.server.ts` — Load generations

Key decisions:
- Minimum balance threshold: $0.15 (15 cents) for generation
- Two-phase: D1 insert with status='pending' first, then start Replicate prediction
- Balance check is atomic: `WHERE balance_cents >= 15` (minimum threshold)
- Shimmer placeholder while polling generation status

### WU7: Replicate Webhook (DoD 72-78)

Files:
- `src/routes/api/webhooks/replicate/+server.ts` — POST Replicate webhook handler
- `src/lib/replicate/webhook.ts` — SVIX signature verification
- `src/lib/replicate/handlers/training.ts` — Training completion handler
- `src/lib/replicate/handlers/generation.ts` — Generation completion handler

Key decisions:
- SVIX signature verification using webhook-id, webhook-timestamp, webhook-signature headers
- Compare-and-swap for ALL state transitions (WHERE status = expected_state)
- Training succeeded: extract output.weights, calculate cost, atomic deduction
- Training failed: update status only, no cost deduction
- Generation succeeded: fetch output image, upload to R2, then update D1
- Generation failed: update status only, no cost deduction
- All webhooks return 200 OK even for already-processed events

### WU8: Cost Calculation & Landing Page (DoD 79-88)

Files:
- `src/lib/replicate/pricing.ts` — Rate table + calculation functions
- `src/routes/+page.svelte` — Landing page (hero, sample portraits, pricing)
- `src/routes/+layout.svelte` — Root layout update for fonts

## D1 Schema (001_init.sql)

```sql
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
-- SQLite supports partial indexes; D1 supports them too
CREATE UNIQUE INDEX idx_user_models_one_active ON user_models(user_id) WHERE status IN ('uploading', 'training', 'succeeded');
```

## Replicate API Details (from old repo research)

- Training model: `ostris/flux-dev-lora-trainer` version `d995297071a44dcb72244e6c19462111649ec86a9646c32df56daa7f14801944`
- Training input: `{ input_images: zipUrl, trigger_word: "TOK", steps: 1000 }`
- Use `destination` parameter on training API: `{owner}/{modelName}` — Replicate creates the model if it doesn't exist
- Prediction model: `black-forest-labs/flux-dev-lora` with `hf_lora` parameter pointing to `lora_weights_url`
- Webhook events filter: `["start", "completed"]`
- Webhook URL: `{BASE_URL}/api/webhooks/replicate`

## Hardware Rate Table (src/lib/replicate/pricing.ts)

| Hardware | Rate ($/sec) | Cents/sec |
|----------|-------------|-----------|
| Nvidia A100 (40GB) | $0.000695 | 0.0695 |
| Nvidia A100 (80GB) | $0.00139 | 0.139 |
| Nvidia H100 | $0.00234 | 0.234 |
| Nvidia T4 (High-memory) | $0.000225 | 0.0225 |

`calculateCostCents(hardware, predictTimeSeconds)` = ceil(rate * seconds * 100)
`calculateDeductionCents(costCents)` = costCents * 2

## Environment Variables Required

```
SUPABASE_URL — Supabase project URL
SUPABASE_ANON_KEY — Supabase anon key (public)
SUPABASE_SERVICE_ROLE_KEY — Service role key (server only, secret)
REPLICATE_API_TOKEN — Replicate API token (secret)
REPLICATE_USERNAME — Replicate username for model destination
REPLICATE_WEBHOOK_SIGNING_KEY — SVIX signing key for webhook verification
STRIPE_SECRET_KEY — Stripe secret key (secret)
STRIPE_WEBHOOK_SECRET — Stripe webhook signing secret (secret)
STRIPE_SUCCESS_URL — Stripe checkout success redirect URL
STRIPE_CANCEL_URL — Stripe checkout cancel redirect URL
PUBLIC_R2_URL — Public R2 bucket URL for image access (public)
```

## Error States (from design review)

| Failure Mode | User Sees | User Action | Balance Impact | Server Recovery |
|---|---|---|---|---|
| Training failed | Error message on /app/training | Click "Retry" to retrain (photos still in R2) | No deduction on failure | Webhook sets status='failed', no cost deduction |
| Generation failed | Error message on /app/generate | Click "Generate" again | No deduction on failure | Webhook sets status='failed', no cost deduction |
| Balance too low for training | "Insufficient balance" on /app/onboarding | Add funds at /app/billing | No charge | API returns 402 |
| Balance too low for generation | "Balance below $0.15" warning on /app/generate | Add funds at /app/billing | No charge | API returns 402 |
| Stripe webhook fires twice | No visible effect | N/A | No double-credit | Idempotent: claim purchase with WHERE status='pending' |
| Replicate webhook out of order | No visible effect | N/A | No double-deduction | Compare-and-swap: WHERE status = expected_state |
| R2 upload fails after D1 write | "Upload failed, please retry" | Retry upload | No deduction | D1 row stays in 'uploading', cron marks stale as 'failed' |
| Active model already exists | "Model already training" message | Wait for training to complete | No charge | API returns 409 |

## Execution Order

WU1 → WU2 → WU3 → WU4 → WU5 → WU6 → WU7 → WU8

With human checkpoints after WU1, WU2, WU5, WU6+WU7, and WU4.