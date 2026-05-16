# .beads — Plan Persistence

This directory stores approved plans and execution state for context recovery.

## Structure

- `plans/` — Approved implementation plans (JSON)
- `context/` — Execution context snapshots for recovery after compaction

## Usage

- Plans written here persist across context compaction windows
- Use `bd prime --work-type recovery` to reload context
- Plans are written by the orchestrator, not manually edited