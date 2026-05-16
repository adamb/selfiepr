# Build Validation

## Pre-commit Checks

Run these before committing:

```bash
npm run check          # Type-check with svelte-check
npx vitest run         # Run all tests
npx vitest run --coverage  # Verify coverage meets thresholds
npm run build          # Verify production build succeeds
```

## CI Pipeline (GitHub Actions)

The CI pipeline should run:

1. **Type check**: `npm run check`
2. **Tests**: `npx vitest run`
3. **Coverage gate**: `npx vitest run --coverage` (must meet 100% thresholds)
4. **Build**: `npm run build`

## Build Verification

- `npm run build` must succeed without errors
- No TypeScript errors from `npm run check`
- All tests must pass
- Coverage must meet thresholds in `.coverage-thresholds.json`

## Cloudflare Bindings

For local development with bindings:

```bash
npx wrangler pages dev
```

This provides access to D1 (`DB`) and R2 (`SELFIE_BUCKET`) bindings locally.