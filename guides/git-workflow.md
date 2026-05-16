# Git Workflow

## Branch Strategy

- `master` is the main branch
- Feature branches: `feature/<short-description>`
- Bug fix branches: `fix/<short-description>`
- Use worktrees for parallel work: `git worktree add .claude/worktrees/<name>`

## Commits

- Write clear, imperative commit messages: "Add user auth flow" not "Added auth"
- Include `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>` on AI-assisted commits
- Never use `--no-verify` or skip hooks
- Prefer new commits over amending (unless explicitly asked)

## PRs

- PR title under 70 characters
- Use `gh pr create` with HEREDOC body
- Include Summary and Test Plan sections
- Coverage must pass thresholds before PR creation

## Merging

- Squash-merge preferred for feature branches
- Keep `master` always deployable