# Contributing

## Quality gates
Before merge:
- Use Node 22 (see `.nvmrc`)
- `npm run verify` passes
- New behavior is documented in README or repo docs

## Standards
- Keep changes scoped and reviewable.
- Avoid unrelated formatting churn.
- Preserve compatibility of existing routes and URL state behavior.
- Do not remove production data files without explicit migration notes.
- Update `docs/` when architecture, API, deployment, or data-flow behavior changes.

## Commit guidance
- Use focused commit messages that describe user-visible impact.
- Include test/build evidence in PR description.
