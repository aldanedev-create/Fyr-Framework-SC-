# Examples

Every example is intentionally small enough to read in one sitting, but uses real Fyr APIs rather than pseudocode.

| Example | Shows | Run |
| --- | --- | --- |
| [`counter`](../examples/counter/) | state, computed values, click handlers, models, `fyr-for`, `fyr-show` | Serve the repository with a static server. |
| [`todo`](../examples/todo/) | forms, immutable array updates, list filtering, attribute binding, events | Serve the repository with a static server. |
| [`advanced-dashboard`](../examples/advanced-dashboard/) | dashboard state, metrics, persistence, notifications, export, responsive UI | Follow its README. |
| [`flask-api`](../examples/flask-api/) | mini classroom, Flask JSON API, `Fyr.http`, forms, list updates, student/teacher views | `python app.py` after installing requirements. |
| [`fastapi-api`](../examples/fastapi-api/) | FastAPI JSON API and `Fyr.http` create/update requests | `uvicorn main:app --reload`. |
| [`router`](../examples/router/) | hash routes, parameters, guards, and application-owned rendering | Serve the folder over HTTP. |
| [`browser-python`](../examples/browser-python/) | reactive UI around Pyodide browser Python | Serve the folder over HTTP; first run downloads Pyodide. |
| [`rust-wasm`](../examples/rust-wasm/) | `WasmLoader`, compilation, and Rust engine inspection | Serve the folder over HTTP. |

## Choosing the right pattern

Use `Fyr.createApp` and directives for interactive pages. Use `Fyr.http` for ordinary JSON APIs. The router is a navigation utility: listen for route changes and render the view your application wants. `fyr-for` should render a state array; when list membership changes, replace the array with a new one rather than mutating it in place.

The Flask classroom is the most complete reference application. It demonstrates a browser frontend and backend boundary without pretending that client-side role switching is security. Its README calls out the production work—authentication, authorization, CSRF, persistence, uploads, validation, and audit logging—that a real school system needs.
