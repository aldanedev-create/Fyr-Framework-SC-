# Fyr

**Fyr** (pronounced "fire") is a CDN-first full-stack web framework prototype. It turns ordinary HTML into reactive applications, connects safely to a Python backend, loads Python in the browser only when requested, and loads precompiled Rust WebAssembly modules from a CDN.

## What is included

- `dist/fyr.js`: zero-build browser framework with reactive state, directives, controllers, HTTP, server actions, notifications and WebAssembly loading.
- `dist/fyr-python.js`: lazy Pyodide bridge for browser-side Python.
- `dist/fyr-wasm.js`: Rust/WASM module registry and loader.
- `dist/fyr-engine.wasm`: working WebAssembly module exported as `add`.
- `examples/production-dashboard`: runnable FastAPI + SQLite application with login, CRUD tasks, server actions and a production-style dashboard.
- `rust-engine`: Rust source corresponding to the browser compute engine.
- `docs/Fyr_Computer_Science_Project.docx`: formal computer science project document.

## Run the working example

```powershell
cd examples\production-dashboard
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m app.seed
uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000` and sign in with:

- Email: `admin@fyr.dev`
- Password: `Admin123!`

## CDN-style use

During local development:

```html
<script src="/fyr/fyr.js"></script>
<script src="/fyr/fyr-wasm.js"></script>
<script src="/fyr/fyr-python.js"></script>
```

After publishing to npm:

```html
<script src="https://cdn.jsdelivr.net/npm/fyr-framework@0.1.0/dist/fyr.min.js"></script>
```

Pin an exact version in production.

## Important production note

The project is a serious, working prototype and starter architecture. Before operating a public service, add managed PostgreSQL, HTTPS-only secure cookies, CSRF protection for cookie-authenticated writes, migrations, distributed rate limiting, structured logs, secret management, monitoring and independent security review.
