# Security guide

Fyr runs in the browser. Everything sent to a client—including JavaScript, templates, WebAssembly, Python code, request bodies, and public configuration—must be treated as visible and modifiable by that client.

## Trusted templates only

Directive expressions are application code, not a security boundary. The current expression evaluator supports complex JavaScript-style expressions and may dynamically evaluate them. Never compile or mount user-provided template text, directive attribute values, or controller method names.

Good:

~~~html
<button fyr-click="save()">Save</button>
~~~

Unsafe:

~~~html
<div fyr-text="untrustedTemplateFromDatabase"></div>
~~~

The issue is not the text binding itself; it is allowing an untrusted party to control a Fyr directive expression or template.

## Raw HTML

fyr-text uses textContent and is the safe default. fyr-html writes directly to innerHTML. Sanitize any untrusted content before assigning it to a value rendered with fyr-html, and prefer a well-maintained HTML sanitizer that fits your server or client environment.

## Server-side controls

The server must enforce:

- authentication and authorization
- request validation and output encoding
- CSRF protection for cookie-authenticated state changes
- rate limits and abuse protection
- database query parameterization
- secret storage and payment processing

Do not put API keys, private credentials, authorization decisions, or private business rules in an Fyr application.

## HTTP and CORS

Use HTTPS in production. If the frontend and API are on different origins, configure CORS narrowly: list only trusted origins, methods, and headers, and use credentialed requests only when needed. Check every state-changing request for CSRF where cookies are used.

## WebAssembly and browser Python

WebAssembly and Pyodide do not make browser code secret. Restrict module URLs to trusted origins, verify artifact integrity in your deployment process, and do not run user-supplied Python or WebAssembly without an explicit isolation model.

## Reporting a vulnerability

Do not open a public issue for a suspected security vulnerability. Follow the private reporting instructions in [SECURITY.md](../SECURITY.md).
