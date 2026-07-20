# Deployment

A core Fyr application is static HTML, JavaScript, CSS, and any assets it fetches. It can be served by a CDN, static host, reverse proxy, or application server.

## Build and verify

For a self-hosted copy of Fyr:

~~~bash
npm ci
npm run type-check
npm run lint
npm test
npm run build
~~~

Deploy the generated dist directory with your application assets. The build writes dist/checksums.txt for artifact verification.

## CDN use

Pin the package version instead of using a floating tag:

~~~html
<script type="module">
  import { Fyr } from
  "https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr.esm.js";
</script>
~~~

Review and update the pinned version intentionally. If your security policy requires Subresource Integrity, generate and manage the integrity value from the exact deployed asset; do not reuse a hash for a different package version.

## Static hosting checklist

- Serve HTML, JavaScript, CSS, and WebAssembly with correct content types.
- Use HTTPS and redirect HTTP to HTTPS.
- Set a Content Security Policy suited to your application. Because current Fyr expressions may use dynamic evaluation, validate a restrictive policy against your app before rollout.
- Configure CORS on APIs, not as a broad wildcard by default.
- Version or cache-bust static assets when releasing updates.

WebAssembly should be served as application/wasm. Most static hosts supply this automatically; verify it in the network panel if a module fails to load.

## Router fallback

Hash routing works on ordinary static hosting. If you use the router's history mode, configure the host to serve your application entry HTML for unknown client-side routes while still returning real files and API routes normally.

For example, a request for /settings should return index.html so the client router can resolve it. Do not redirect API or asset requests to index.html.

## Production API boundaries

Keep API URLs configurable, do not embed secrets in frontend code, and enforce authentication and authorization on the server. See [security.md](security.md) for the complete trust-boundary guidance.
