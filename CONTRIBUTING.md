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

## Documentation and release records

Start with [docs/README.md](docs/README.md). Update current guides when behavior changes; preserve dated feedback as history with links to the current guide. Significant releases need a concise changelog/report containing the actual source commit, verification and deployment evidence, plus remaining limits. Keep source-branch integration distinct from Cloudflare's deployment label.

For documentation-only work, check relative links, referenced files, code/config claims and `git diff --check`; use `node --test tests/standards.test.mjs` for repository documentation requirements. Application changes require the complete `npm run verify` gate. GitHub's required `verify` check also runs for documentation pull requests.

Use a pull request to integrate into protected main, preserving meaningful commit history. Do not bypass required checks. Publishing source does not itself authorize opening the shop or changing private service configuration.
