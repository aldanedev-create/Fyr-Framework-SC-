# Security policy

## Supported versions

Fyr is currently pre-1.0. Security fixes are made against the latest 0.1.x release and the main development branch. Earlier prototypes are not supported.

## Reporting a vulnerability

Please do not disclose suspected vulnerabilities in public issues, discussions, or pull requests. Send a report to **security@fyr.dev** with:

- affected version or commit
- a clear description and impact
- reproducible steps or proof of concept
- any suggested mitigation

We aim to acknowledge valid reports within 72 hours and will coordinate a fix and disclosure timeline with the reporter.

## Security model

Browser-delivered code is not secret. This includes Fyr application code, directives, browser Python, WebAssembly modules, network requests, and public configuration.

Servers must enforce authentication, authorization, validation, rate limits, and secret handling. Fyr cannot protect against a backend that accepts an unauthorized request.

## Framework-specific guidance

- Use only templates and directive expressions that you control. The current expression evaluator is not a sandbox.
- Prefer fyr-text for untrusted values. Sanitize any content passed to fyr-html.
- Use HTTPS and a carefully scoped CORS policy in production.
- Protect cookie-authenticated state changes with CSRF defenses.
- Restrict WebAssembly sources to trusted origins and verify released artifacts.
- Do not put credentials, private keys, or authorization decisions in browser code.

For detailed implementation guidance, see [docs/security.md](docs/security.md).
