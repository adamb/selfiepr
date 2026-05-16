# Agent Coordination

## Team Mode

When `TeamCreate` and `SendMessage` tools are available, the orchestrator uses Team Mode for parallel agent dispatch. Otherwise it falls back to Task Mode (existing workflow, unchanged).

## Agent Dispatch Patterns

- **Parallel agents**: Use for independent tasks (e.g., review + test writing)
- **Sequential agents**: Use when tasks have dependencies (e.g., implement → test → review)
- **Adversarial review**: Spawn independent reviewers for plan and code review

## Context Sharing

- Plans persist to `.beads/` for context recovery after compaction
- Use `bd prime --work-type recovery` to reload context after compaction
- Agent outputs are collected and synthesized, not directly committed

## Quality Gates

All agents must pass through quality gates before work is considered complete:

1. **Design Review Gate** — 5-agent parallel review after brainstorming
2. **Plan Review Gate** — 3 adversarial reviewers before plan approval
3. **Coverage Gate** — `.coverage-thresholds.json` thresholds must be met

## File Scope

Agents must stay within their assigned file scope. No agent should modify files outside their assigned scope without explicit coordination.