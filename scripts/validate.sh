#!/usr/bin/env bash
# Full validation: type-check + test + coverage + build
set -e

echo "=== Type Check ==="
npm run check

echo "=== Tests ==="
npx vitest run

echo "=== Coverage ==="
npx vitest run --coverage

echo "=== Build ==="
npm run build

echo "=== All checks passed ==="