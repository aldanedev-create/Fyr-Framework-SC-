# CDN usage

Use Fyr from jsDelivr with the published scoped package name and a pinned version:

`@aldane-dev-create/fyr@0.1.2`

Every JavaScript distribution file is an ES module, including the `.min.js` files. Use `type="module"` and `import`; do **not** use a classic `<script src="...">` tag or the old `fyr-framework` package name.

## Available files

| Feature | Recommended module URL |
| --- | --- |
| Core | `https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr.esm.js` |
| Router | `https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr-router.esm.js` |
| Browser Python | `https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr-python.esm.js` |
| WebAssembly helpers | `https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr-wasm.esm.js` |
| WebSockets | `https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr-socket.esm.js` |
| UI helpers | `https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr-ui.esm.js` |
| UI stylesheet | `https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr-ui.css` |
| Example Rust binary | `https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr-engine.wasm` |

For a smaller production download, replace a JavaScript filename such as `fyr.esm.js` with `fyr.min.js`. It remains an ES module, so the `type="module"` requirement does not change.

## Core

~~~html
<div fyr-app="welcome">
  <p fyr-text="message"></p>
  <button fyr-click="changeMessage">Change message</button>
</div>

<script type="module">
  import { Fyr } from
    "https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr.esm.js";

  Fyr.createApp("welcome", {
    state: { message: "Hello from Fyr" },
    methods: {
      changeMessage() {
        this.state.message = "The state updated.";
      }
    }
  });

  Fyr.start("welcome");
</script>
~~~

## Router

~~~html
<script type="module">
  import { Router } from
    "https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr-router.esm.js";

  const router = new Router({
    mode: "hash",
    routes: [
      { path: "/", component: "home" },
      { path: "/students/:id", component: "student" }
    ]
  });

  router.onRouteChange(route => {
    console.log(route?.route.component, route?.params);
  });

  await router.navigate("/students/42");
</script>
~~~

## Browser Python

~~~html
<script type="module">
  import { PyodideLoader } from
    "https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr-python.esm.js";

  const python = new PyodideLoader();
  await python.load();

  console.log(await python.run("import math\nmath.sqrt(144)")); // 12
  console.log(await python.run("2 ** 10")); // 1024

  await python.loadPackages(["numpy"]);
  console.log(await python.run("import numpy as np\nfloat(np.array([1, 2, 3]).mean())")); // 2
</script>
~~~

`Fyr.python.*` is not a standalone public setup path in 0.1.2, so this guide intentionally uses the working `PyodideLoader` API instead.

## WebAssembly

~~~html
<script type="module">
  import { WasmLoader } from
    "https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr-wasm.esm.js";

  const loader = new WasmLoader({ allowedOrigins: [location.origin] });
  const wasmModule = await loader.load("math", "/wasm/math.wasm");
  const instance = await WebAssembly.instantiate(wasmModule, {});

  console.log(instance.exports.add(20, 22)); // 42, if `add` is exported
</script>
~~~

The functions and imports are determined by the particular `.wasm` binary. `Fyr.wasm.*` is not documented as a standalone API in 0.1.2; use the exported loader and standard WebAssembly APIs.

## WebSockets

~~~html
<script type="module">
  import { SocketClient } from
    "https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr-socket.esm.js";

  const socket = new SocketClient({
    url: "wss://api.example.com/ws",
    debug: true,
    reconnect: {
      maxAttempts: 10,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffFactor: 2
    },
    heartbeat: { enabled: false }
  });

  socket.on("open", () => {
    socket.subscribe("dashboard", data => console.log("Dashboard update:", data));
  });

  socket.on("close", event => console.log("Disconnected:", event.code, event.reason));
  socket.on("error", event => console.error("Socket error:", event));

  await socket.connect();
  socket.send({ type: "auth", token: "obtain-a-token-safely" });
  socket.publish("dashboard", { action: "refresh" });
</script>
~~~

The client supports reconnecting and channels. In 0.1.2, disable the built-in heartbeat as above: it tracks incoming messages but does not yet wire its configured ping message to the socket transport.

## UI helpers

~~~html
<link rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr-ui.css">

<script type="module">
  import { toast, modal } from
    "https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr-ui.esm.js";

  toast({
    message: "Saved successfully!",
    type: "success",
    className: "my-custom-toast"
  });

  modal({
    title: "Confirm action",
    content: "This is a custom modal.",
    className: "my-custom-modal",
    buttons: [
      { label: "Cancel", variant: "secondary" },
      { label: "Confirm", variant: "primary" }
    ]
  }).open();
</script>
~~~

Toast and modal elements use the documented `fyr-*` CSS classes, but their generated HTML varies with options such as `closable`, `progress`, `title`, and `buttons`. Treat the public options and stylesheet as the supported API, rather than depending on an exact generated DOM structure.
