# Fyr

Fyr is a small, CDN-first framework for adding reactive behavior to ordinary HTML. Define an application in JavaScript, use Fyr directives in its markup, and mount it—no framework-specific build step is required for browser use.

> Fyr is currently a 0.1.0 prototype. Treat public APIs as evolving, keep templates trusted, and test upgrades before deploying them.

## Quick start

Create an HTML file and open it from a local server:

~~~html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Fyr counter</title>
  </head>
  <body>
    <main fyr-app="counter">
      <h1 fyr-text="count"></h1>
      <button fyr-click="increment()">Add one</button>
    </main>

    <script type="module">
      import { Fyr } from
  "https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr.esm.js";

      Fyr.createApp("counter", {
        state: { count: 0 },
        methods: {
          increment() {
            this.state.count += 1;
          }
        }
      });

      Fyr.start("counter");
    </script>
  </body>
</html>
~~~

The root element's fyr-app value and the name passed to Fyr.createApp must match. Expressions in the template access state, computed values, and methods directly; controller methods access state through this.state.

## Install

### CDN

Use a module script and import a pinned build:

~~~html
<script type="module">
import { Fyr } from "https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr.esm.js";
</script>
~~~

The ESM builds also assign window.Fyr in browsers as a convenience, but importing Fyr keeps application dependencies explicit.

### npm

~~~bash
npm install @aldane-dev-create/fyr
~~~

~~~ts
import { Fyr } from "@aldane-dev-create/fyr";
~~~

Fyr targets Node 20+ for local development and modern evergreen browsers at runtime.

## What is included

- Reactive application state backed by proxies
- HTML directives for text, events, forms, conditional content, loops, attributes, classes, styles, and references
- Controller methods, computed values, watchers, and lifecycle hooks
- Fetch-based HTTP and server-action clients
- Event bus, custom directives, plugins, and small UI helpers
- Optional Python, WebAssembly, router, socket, and UI bundles

## Documentation

Start with the [documentation index](docs/index.md).

- [Getting started](docs/getting-started.md)
- [Controllers and state](docs/controllers.md)
- [Directives](docs/directives.md)
- [HTTP client](docs/http.md) and [server actions](docs/server-actions.md)
- [CDN usage](docs/cdn.md) — core, router, Python, WASM, socket, and UI imports for 0.1.2
- [Browser Python](docs/browser-python.md) and [Rust/WebAssembly](docs/rust-wasm.md)
- [Routing](docs/routing.md), [deployment](docs/deployment.md), and [security](docs/security.md)

## Project scripts

~~~bash
npm install
npm run type-check
npm run lint
npm test
npm run build
~~~

The build produces the core library and optional bundles in dist/. The Rust build additionally validates the generated WebAssembly artifact and writes checksums.

## Security

Use Fyr only with templates you control. The current expression evaluator supports complex JavaScript-style expressions and may evaluate them dynamically. Do not place user-provided template text in a Fyr directive, and sanitize untrusted HTML before rendering it with fyr-html. See the [security guide](docs/security.md).

## Contributing and license

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Security reports belong in the private process described in [SECURITY.md](SECURITY.md). Fyr is released under the [MIT License](LICENSE).
