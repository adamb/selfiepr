# Selfie — AI Portrait Studio

Train a personalized AI model on your photos and generate stunning portraits in any style.

## Tech Stack

- **Frontend**: SvelteKit 2.x with Svelte 5
- **Styling**: Tailwind CSS v4
- **Platform**: Cloudflare Pages with D1 (SQLite) and R2 storage
- **Auth**: Supabase Auth (email/password, Google OAuth)
- **AI**: Replicate API (Flux LoRA training and generation)
- **Billing**: Stripe Checkout

## Development

```bash
npm install
npm run dev
```

For Cloudflare bindings locally:
```bash
npx wrangler pages dev .svelte-kit/cloudflare
```

## Deployment

Deployed to Cloudflare Pages via GitHub Actions on push to `master`.

### Environment Variables

Managed in `wrangler.toml` (public) and Cloudflare dashboard (secrets):

**Public (in wrangler.toml):**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `PUBLIC_R2_URL` — **⚠️ DEV ONLY** — Change before production

**Secrets (Cloudflare dashboard):**
- `REPLICATE_API_TOKEN` — Replicate API key
- `STRIPE_SECRET_KEY` — Stripe secret key
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret

### Database Migrations

```bash
npx wrangler d1 execute selfiepr-db --remote --file=migrations/001_init.sql
```

### R2 Bucket

Create bucket:
```bash
npx wrangler r2 bucket create selfie-bucket
```

Enable public access in Cloudflare dashboard and update `PUBLIC_R2_URL` accordingly.

> ⚠️ **Note**: The current `PUBLIC_R2_URL` in `wrangler.toml` is for development only. Before production, replace with your production R2 public URL.

## Testing

```bash
npm run test
npm run test:coverage
```

## Project Structure

```
src/
├── lib/
│   ├── db/           — Database queries
│   ├── images/       — Image resize utilities
│   ├── replicate/    — Replicate API client and pricing
│   ├── storage/      — R2 upload helpers
│   ├── stripe/       — Stripe utilities
│   └── supabase/     — Supabase client setup
├── routes/
│   ├── api/          — API endpoints
│   ├── app/          — Authenticated app pages
│   └── auth/         — Login, signup, OAuth callback
└── migrations/       — D1 migration files
```

## Flow

1. User signs up/logs in (Supabase Auth)
2. User adds balance via Stripe Checkout
3. User uploads 5-10 photos for training
4. Photos uploaded to R2, training started on Replicate
5. Webhook received when training completes
6. User generates portraits using style presets or custom prompts
7. Generated images stored in R2, displayed in gallery