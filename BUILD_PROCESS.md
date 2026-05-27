# Build Process & Lessons Learned

This document captures the development process and key lessons for future projects.

## Development Workflow

### 1. TDD (Test-Driven Development)

**What worked:**
- Writing unit tests for utility functions (pricing, validation, storage)
- Integration tests for SvelteKit load functions caught the redirect loop bug
- Mock utilities for D1Database, R2Bucket, Supabase make testing easier

**What we missed:**
- Integration tests for the app layout state machine were written AFTER the bug
- Should write tests for redirect logic BEFORE implementing the feature
- E2E tests with Playwright should be set up early

**Lesson:** Write integration tests for state machines and redirect logic before deploying.

### 2. Common Bugs & Solutions

#### Redirect Loops
**Bug:** App layout redirects to `/app/onboarding` when user has no model, even when already on that page.

**Solution:** Check `url.pathname` before throwing redirects:
```typescript
// Before (buggy):
if (!model) {
    throw redirect(302, '/app/onboarding');
}

// After (fixed):
if (!model && url.pathname !== '/app/onboarding') {
    throw redirect(302, '/app/onboarding');
}
```

**Test for this:**
```typescript
it('does NOT redirect to onboarding when already on onboarding', async () => {
    const event = createMockEvent({ path: '/app/onboarding' });
    getBalance.mockResolvedValue({ balance_cents: 1000 });
    getActiveModel.mockResolvedValue(null);
    
    const result = await load(event);
    expect(result).toHaveProperty('state', 'needs_onboarding');
});
```

#### Environment Variables in Cloudflare Pages
**Bug:** `[vars]` in wrangler.toml not being applied when deploying via `cloudflare/pages-action@v1`.

**Solution:** Use `wrangler pages deploy` directly in GitHub Actions:
```yaml
- name: Deploy to Cloudflare Pages
  run: npx wrangler pages deploy .svelte-kit/cloudflare --project-name=selfiepr
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

#### Test File Naming in SvelteKit
**Bug:** Files prefixed with `+` are reserved by SvelteKit, causing build errors.

**Solution:** Move test files to `tests/` directory or use `__tests__/` folders:
```
tests/app-layout.test.ts  ✅
src/routes/+server.test.ts  ❌ (build error)
```

### 3. SvelteKit + Cloudflare Pages Setup

#### wrangler.toml Configuration
```toml
name = "selfiepr"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = ".svelte-kit/cloudflare"

[[d1_databases]]
binding = "DB"
database_name = "selfiepr-db"
database_id = "your-database-id"

[[r2_buckets]]
binding = "SELFIE_BUCKET"
bucket_name = "selfie-bucket"

# Public vars (non-secret)
[vars]
SUPABASE_URL = "..."
# etc.

# Secrets (set in Cloudflare dashboard):
# - REPLICATE_API_TOKEN
# - STRIPE_SECRET_KEY
```

#### GitHub Actions Auto-Deploy
```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run build
      - name: Deploy to Cloudflare Pages
        run: npx wrangler pages deploy .svelte-kit/cloudflare --project-name=selfiepr
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### 4. Testing Strategy

#### Unit Tests (Fast, Isolated)
- Database queries with mocked D1
- Utility functions (pricing, validation)
- Storage helpers (R2)
- API utilities (Stripe, etc.)

#### Integration Tests (SvelteKit Load Functions)
- App layout state machine
- Auth redirect logic
- Error handling paths

#### E2E Tests (Full User Flow)
- Playwright tests against deployed app
- Critical path testing (signup → onboarding → training → generate)

### 5. Key Files to Test

| File | Test Type | Why |
|------|-----------|-----|
| `+layout.server.ts` | Integration | State machine, redirects |
| `+page.server.ts` | Integration | Auth checks, data loading |
| `+server.ts` (API) | Integration | Request/response handling |
| `queries.ts` | Unit | Database operations |
| `pricing.ts` | Unit | Pure calculations |
| `resize.ts` | Unit | Image processing |

### 6. Debugging Tips

#### Cloudflare Logs
- Workers & Pages → selfiepr → Logs → Real-time Logs
- Add `console.error()` for missing env vars to see them in logs

#### Local Development
```bash
npm run dev  # Dev server
npx wrangler pages dev .svelte-kit/cloudflare  # With CF bindings
```

#### Database Queries
```bash
npx wrangler d1 execute selfiepr-db --remote --command "SELECT * FROM user_balances;"
```

### 7. Checklist Before Deployment

- [ ] All unit tests pass: `npm run test`
- [ ] Integration tests pass for state machines
- [ ] Build succeeds: `npm run build`
- [ ] Database migrations run: `npx wrangler d1 execute ...`
- [ ] Environment variables set (both public and secrets)
- [ ] R2 bucket created and public URL configured
- [ ] Supabase redirect URLs configured
- [ ] OAuth providers enabled (if using)

### 8. Lessons for Future Projects

1. **Write state machine tests first** - Redirect logic is tricky
2. **Use `url.pathname` checks** - Prevent redirect loops
3. **Test on staging before production** - Catch env issues early
4. **Mock SvelteKit internals** - `createMockRequestEvent` helper
5. **Log missing env vars** - Helps debug production issues
6. **Keep tests close to code** - `__tests__` folders or parallel test files
7. **Run full test suite before pushing** - Catch regressions early