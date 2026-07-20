# Rust and WebAssembly

Fyr's optional WebAssembly bundle includes a loader, cache, registry, memory helpers, and a plugin-oriented API. The Rust workspace in rust/ builds the framework's example WebAssembly artifact.

## Build the Rust artifact

From the project root:

~~~bash
npm run build:rust
~~~

The full npm run build command runs the Rust build, checks that the expected WebAssembly artifact exists, and generates dist/checksums.txt.

## Load a module

WasmLoader fetches and compiles a module. Instantiate it with browser WebAssembly APIs when you need direct control over imports and exports.

~~~html
<script type="module">
  import { WasmLoader } from
    "https://cdn.jsdelivr.net/npm/fyr-framework@0.1.0/dist/fyr-wasm.esm.js";

  const loader = new WasmLoader({
    allowedOrigins: [location.origin]
  });

  const module = await loader.load("math", "/assets/math.wasm");
  const instance = await WebAssembly.instantiate(module, {});
  console.log(instance.exports.add(2, 3));
</script>
~~~

Serve .wasm files as application/wasm. The source code that builds a module determines its imports and exported function signatures.

## Plugin-oriented API

WasmPlugin exposes higher-level methods such as load, call, unload, and createInstance after installation in a Fyr plugin context. That installation path is still evolving in 0.1.0; use WasmLoader and standard WebAssembly APIs for new applications unless you already own the plugin integration.

## Deployment and security

Restrict allowedOrigins to trusted hosts, serve modules over HTTPS, and verify artifacts in your release pipeline. WebAssembly is delivered to the browser and can be inspected; it cannot protect secrets or replace server-side authorization.
