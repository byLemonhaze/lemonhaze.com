# Contributing

## Quality gates
Before merge:
- `node node_modules/vite/bin/vite.js build` passes
- `node --test tests/*.test.mjs` passes
- New behavior is documented in README or repo docs

## Standards
- Keep changes scoped and reviewable.
- Avoid unrelated formatting churn.
- Preserve compatibility of existing routes and URL state behavior.
- Do not remove production data files without explicit migration notes.

## Commit guidance
- Use focused commit messages that describe user-visible impact.
- Include test/build evidence in PR description.
