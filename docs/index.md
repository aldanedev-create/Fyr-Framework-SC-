# Fyr documentation

Fyr applications are regular HTML enhanced by a JavaScript application definition. The guides below describe the in-repository `@aldane-dev-create/fyr` 0.1.2 API and the examples in this repository.

## Core guides

- [Getting started](getting-started.md) — create and mount an app
- [Controllers](controllers.md) — state, methods, computed values, watchers, and lifecycle hooks
- [Directives](directives.md) — the HTML binding reference
- [HTTP](http.md) — requests, responses, configuration, and interceptors
- [Server actions](server-actions.md) — the action endpoint convention
- [Security](security.md) — trusted templates, raw HTML, and deployment boundaries
- [Deployment](deployment.md) — static hosting and production checklist
- [CDN usage](cdn.md) — verified 0.1.2 core and optional-module imports
- [API reference](api-reference.md) — core API, directives, registration, and optional bundles
- [Examples](examples.md) — what each runnable sample demonstrates

## Optional modules

- [Browser Python](browser-python.md)
- [Rust and WebAssembly](rust-wasm.md)
- [Routing](routing.md)
- [Components](components.md)
- [UI helpers](ui.md)
- [WebSockets](sockets.md)

## Backend examples

- [FastAPI](fastapi.md)
- [Flask](flask.md)
- [Fyr Classroom](classroom.md) — complete Flask mini classroom walkthrough

The optional modules are published as separate entry points so they need not be loaded by a core-only application.
