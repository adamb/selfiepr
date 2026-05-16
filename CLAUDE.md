# selfiepr

## Project

- **Framework**: SvelteKit 2.x with Svelte 5
- **Language**: TypeScript
- **Platform**: Cloudflare Pages
- **Adapter**: `@sveltejs/adapter-cloudflare`
- **Styling**: Tailwind CSS v4 (`@import "tailwindcss"` in `src/app.css`)

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
