<!-- Title must be a Conventional Commit (feat:, fix:, chore:, docs:, refactor:, test:, ci:, build:, perf:). Use `feat!:` / `fix!:` for breaking changes. It becomes the squash commit and the release note. -->

Closes #

## What and why

## Test evidence

<!-- Commands you ran and their result; screenshots for UI changes. -->

## Checklist

- [ ] `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test` green locally
- [ ] Tests written first for new behaviour (and coverage thresholds not lowered)
- [ ] Docs updated (`apps/docs`), including `api/components/*.md` when component events change
- [ ] Coverage matrix updated (`apps/docs/.vitepress/theme/data/stripe-coverage.ts`) when Stripe.js surface is added or removed
- [ ] Migration guide updated (`apps/docs/guide/migration-v6.md`) and title uses `!` if this is a breaking change
- [ ] No emoji in code, docs, UI copy or commit messages
