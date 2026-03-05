# Security

## Reporting
If you find a security issue, open a private report through GitHub Security Advisories if enabled, or contact project maintainers directly before public disclosure.

## Scope
- Frontend client code
- Cloudflare Pages deployment configuration
- Functions under `functions/`

## Baseline expectations
- No hardcoded secrets in repo.
- Server-side endpoints validate and sanitize external input.
- Dependencies should remain current and patched.
