# Fyr production dashboard example

This example proves the complete request path:

1. HTML loads Fyr from a static/CDN-style path.
2. Fyr binds state and directives without a build step.
3. The frontend authenticates against FastAPI using an HTTP-only cookie.
4. CRUD requests write to SQLite through SQLAlchemy.
5. A server action returns aggregate statistics.
6. A real WebAssembly binary is fetched and executed in the browser.
7. Python is lazy-loaded from the Pyodide CDN and executed in-browser.

## Windows PowerShell

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m app.seed
uvicorn app.main:app --reload
```

Go to `http://127.0.0.1:8000`.
