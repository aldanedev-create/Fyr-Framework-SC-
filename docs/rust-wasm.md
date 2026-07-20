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
  "https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr-wasm.esm.js";

  const loader = new WasmLoader({
    allowedOrigins: [location.origin]
  });

  const module = await loader.load("math", "/assets/math.wasm");
  const instance = await WebAssembly.instantiate(module, {});
  console.log(instance.exports.add(2, 3));
</script>
~~~

Serve .wasm files as application/wasm. The source code that builds a module determines its imports and exported function signatures.

## Direct helper APIs

The published bundle also exports `WasmInstance`, `MemoryManager`, and `WasmCache`. Use them as explicit instances instead of documenting `Fyr.wasm.*` as a standalone API in 0.1.2.

~~~js
import { MemoryManager, WasmCache, WasmInstance, WasmLoader } from
  "https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr-wasm.esm.js";

const loader = new WasmLoader({ allowedOrigins: [location.origin] });
const module = await loader.load("calculator", "/wasm/calculator.wasm");

const calculator = new WasmInstance({ name: "calculator", module });
await calculator.instantiate();
console.log(calculator.call("add", 10, 20));

const cache = new WasmCache();
cache.set("calculator", module);
console.log(cache.getStats());
cache.clearExpired();

const memory = new WebAssembly.Memory({ initial: 1, maximum: 10 });
const memoryManager = new MemoryManager();
memoryManager.registerMemory("scratch", memory);
const pointer = memoryManager.allocate("scratch", 64);
memoryManager.writeString("scratch", pointer, "Hello WASM!");
console.log(memoryManager.readString("scratch", pointer));
memoryManager.free(pointer);
~~~

`MemoryManager` tracks browser-managed memory ranges; it does not replace an allocator exported by your particular WebAssembly module. For a complete CDN overview, see [CDN usage](cdn.md#webassembly).

## Deployment and security

Restrict allowedOrigins to trusted hosts, serve modules over HTTPS, and verify artifacts in your release pipeline. WebAssembly is delivered to the browser and can be inspected; it cannot protect secrets or replace server-side authorization.
