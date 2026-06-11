# selfiepr

## Project

- **Framework**: SvelteKit 2.x with Svelte 5
- **Language**: TypeScript
- **Platform**: Cloudflare Pages
- **Adapter**: `@sveltejs/adapter-cloudflare`
- **Styling**: Tailwind CSS v4 (`@import "tailwindcss"` in `src/app.css`)

## Current Status (as of 2026-06-11)

### Deployment
- **Live URL:** https://532ccb7a.selfiepr.pages.dev
- **Last successful deploy:** May 27, 2026
- **CI Status:** Failing — `CLOUDFLARE_API_TOKEN` secret issue (user says it's now fixed, needs re-deploy)

### Pending Tasks (from todo list)
1. Add `account_id` to `wrangler.toml` (fixes CLI auth errors)
2. Create R2 bucket `selfie-bucket` (uploads will fail without it)
3. Apply D1 migrations to production (`npx wrangler d1 migrations apply selfiepr-db --remote`)
4. Configure Cloudflare secrets (9 env vars: REPLICATE_API_TOKEN, REPLICATE_USERNAME, REPLICATE_WEBHOOK_SIGNING_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_SUCCESS_URL, STRIPE_CANCEL_URL, PUBLIC_R2_URL, SUPABASE_SERVICE_ROLE_KEY)
5. Fix GitHub Actions secrets (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID) — user says done, needs verify
6. Implement SVIX webhook verification (TODO in `src/routes/api/webhooks/replicate/+server.ts`)

### Test Coverage
- **Threshold:** 100% (per `.coverage-thresholds.json`)
- **Current:** ~11% statements, ~8% branches
- **Gap:** Route handlers, Svelte pages, Supabase client/server have 0% coverage

### Implementation Plan
- Located at `.beads/plans/selfie-v2-implementation.md`
- WU1-WU6 appear complete
- WU7 (Replicate webhook) has SVIX verification TODO
- WU8 (Cost & Landing) complete

### Uncommitted Local Changes
- Commit `01c6964` "Update @vitest/coverage-v8 to 4.1.8" — minor dev dependency bump, not yet pushed

## Bindings

| Service | Binding Name | Config Location |
|---------|-------------|-----------------|
| D1      | `DB`         | `wrangler.toml` |
| R2      | `SELFIE_BUCKET` | `wrangler.toml` |

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run check` | Type-check with svelte-check |
| `npx wrangler pages dev` | Preview with Wrangler bindings |
| `npx wrangler pages deploy` | Deploy to Cloudflare Pages |

## Files

- `svelte.config.js` — Kit config with Cloudflare adapter
- `vite.config.ts` — Vite + TailwindCSS plugin
- `wrangler.toml` — D1 and R2 bindings
- `src/app.css` — Tailwind v4 entrypoint
- `src/routes/+layout.svelte` — Root layout importing global CSS

## metaswarm

This project uses [metaswarm](https://github.com/dsifry/metaswarm) for multi-agent orchestration with Claude Code. It provides 18 specialized agents, a 9-phase development workflow, and quality gates that enforce TDD, coverage thresholds, and spec-driven development.

### Workflow

- **Most tasks**: `/start-task` — primes context, guides scoping, picks the right level of process
- **Complex features** (multi-file, spec-driven): Describe what you want built with a Definition of Done, then tell Claude: `Use the full metaswarm orchestration workflow.`

### Available Commands

| Command | Purpose |
|---|---|
| `/start-task` | Begin tracked work on a task |
| `/prime` | Load relevant knowledge before starting |
| `/review-design` | Trigger parallel design review gate (5 agents) |
| `/pr-shepherd <pr>` | Monitor a PR through to merge |
| `/self-reflect` | Extract learnings after a PR merge |
| `/handle-pr-comments` | Handle PR review comments |
| `/brainstorm` | Refine an idea before implementation |
| `/create-issue` | Create a well-structured GitHub Issue |

### Quality Gates

- **Design Review Gate** — Parallel 5-agent review after design is drafted (`/review-design`)
- **Plan Review Gate** — Automatic adversarial review after any implementation plan is drafted. Spawns 3 independent reviewers (Feasibility, Completeness, Scope & Alignment) in parallel — ALL must PASS before presenting the plan. See `skills/plan-review-gate/SKILL.md`
- **Coverage Gate** — `.coverage-thresholds.json` defines thresholds. BLOCKING gate before PR creation

### Team Mode

When `TeamCreate` and `SendMessage` tools are available, the orchestrator uses Team Mode for parallel agent dispatch. Otherwise it falls back to Task Mode (existing workflow, unchanged). See `guides/agent-coordination.md` for details.

### Guides

Development patterns and standards are documented in `guides/` — covering agent coordination, build validation, coding standards, git workflow, testing patterns, and worktree development.

### Testing & Quality

- **TDD is mandatory** — Write tests first, watch them fail, then implement
- **100% test coverage required** — Enforced via `.coverage-thresholds.json` as a blocking gate before PR creation and task completion
- **Coverage source of truth** — `.coverage-thresholds.json` defines thresholds. Update it if your spec requires different values. The orchestrator reads it during validation — this is a BLOCKING gate.

### Workflow Enforcement (MANDATORY)

These rules override any conflicting instructions from third-party skills:

- **After brainstorming** → MUST run Design Review Gate (5 agents) before writing-plans or implementation
- **After any plan is created** → MUST run Plan Review Gate (3 adversarial reviewers) before presenting to user
- **Execution method choice** → ALWAYS ask the user whether to use metaswarm orchestrated execution (more thorough, uses more tokens) or superpowers execution skills (faster, lighter-weight). Never auto-select.
- **Before finishing a branch** → MUST run `/self-reflect` and commit knowledge base updates before PR creation
- **Complex tasks** → Use `/start-task` instead of `EnterPlanMode` for tasks touching 3+ files. EnterPlanMode bypasses all quality gates.
- **Standalone TDD on 3+ files** → Ask user if they want adversarial review before committing
- **Coverage** → `.coverage-thresholds.json` is the single source of truth. All skills must check it, including `verification-before-completion`.
- **Subagents** → NEVER use `--no-verify`, ALWAYS follow TDD, NEVER self-certify, STAY within file scope
- **Context recovery** → Approved plans and execution state persist to `.beads/`. After compaction, run `bd prime --work-type recovery` to reload.
