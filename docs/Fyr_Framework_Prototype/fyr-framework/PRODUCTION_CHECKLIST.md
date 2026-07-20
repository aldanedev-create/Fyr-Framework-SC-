# Fyr production checklist

The prototype works locally, but complete these controls before public launch:

- Replace the development secret with a managed random secret.
- Enable HTTPS and `FYR_SECURE_COOKIES=true`.
- Add CSRF tokens to cookie-authenticated write requests.
- Replace the expression evaluator with a restricted parser; do not enable user-authored expressions.
- Move from SQLite to PostgreSQL and introduce Alembic migrations.
- Add reverse-proxy and application rate limiting.
- Configure a Content Security Policy and Subresource Integrity for pinned CDN assets.
- Add structured logging, error monitoring, metrics, backups and uptime checks.
- Add role-based authorization to each business operation.
- Run dependency, SAST, DAST and independent security reviews.
- Minify builds and publish immutable versioned assets with source maps stored privately or deliberately published.
- Add browser compatibility, accessibility, load and end-to-end test suites.
