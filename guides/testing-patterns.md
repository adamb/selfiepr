# Testing Patterns

## Framework

- **Runner**: Vitest (`npx vitest run` for CI, `npx vitest` for watch)
- **Config**: `vitest.config.ts`
- **Environment**: jsdom (DOM APIs available)
- **Component testing**: `@testing-library/svelte`
- **Assertions**: `@testing-library/jest-dom` matchers via `src/test-setup.ts`

## Coverage

- **Threshold**: 100% lines, branches, functions, statements
- **Provider**: v8
- **Enforcement**: `.coverage-thresholds.json` is the source of truth
- **Run**: `npx vitest run --coverage`
- **Blocking**: PR creation and task completion are blocked if coverage drops

## TDD Workflow (MANDATORY)

1. Write a failing test that describes the desired behavior
2. Run the test — confirm it fails with the expected error
3. Write the minimum implementation to make the test pass
4. Run the test — confirm it passes
5. Refactor if needed, tests stay green

## File Conventions

- Test files: `src/**/*.test.ts` or `src/**/*.spec.ts`
- Co-locate tests with source when practical
- Setup file: `src/test-setup.ts`

## Svelte Component Testing

```typescript
import { render, screen } from '@testing-library/svelte';
import Counter from './Counter.svelte';
import { describe, it, expect } from 'vitest';

describe('Counter', () => {
  it('increments on click', async () => {
    render(Counter);
    const button = screen.getByRole('button');
    await userEvent.click(button);
    expect(button).toHaveTextContent('1');
  });
});
```

## Server Endpoint Testing

Test `+server.ts` endpoints by importing handler functions directly or using Vitest's request helpers. Mock platform bindings (D1, R2) when testing server logic in isolation.