# Coding Standards

## Language & Types

- TypeScript strict mode enabled (`strict: true` in tsconfig.json)
- Use `svelte-check` for type validation, not `tsc` directly
- Prefer `interface` over `type` for object shapes
- No `any` — use `unknown` and narrow with type guards

## Svelte 5 Conventions

- Use runes (`$state`, `$derived`, `$effect`, `$props`) — not legacy stores
- Component props: `let { prop1, prop2 } = $props()`
- Event handlers: use `onclick` not `on:click`
- Snippets and `{@render}` replace slots
- `$effect()` replaces `onMount`/`onDestroy` for side effects

## Styling

- Tailwind CSS v4 — use `@import "tailwindcss"` in `src/app.css`
- Utility classes in markup, no separate CSS files
- Custom theme values in `app.css` via `@theme` block if needed

## File Organization

- Routes in `src/routes/` following SvelteKit conventions
- Shared components in `src/lib/components/`
- Utilities in `src/lib/utils/`
- Server logic in `src/routes/` `+server.ts` or `+page.server.ts`
- Types in `src/lib/types/`

## Naming

- Files: `kebab-case.svelte` for components, `kebab-case.ts` for modules
- Exports: `PascalCase` for components, `camelCase` for functions/variables
- Route params: `kebab-case`