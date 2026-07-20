# Browser Python

The Python bundle provides Pyodide-based browser Python utilities. It is optional and should be loaded only when the application needs it.

## Load Pyodide directly

For the most direct integration, import PyodideLoader and let it load Pyodide from its configured CDN.

~~~html
<script type="module">
  import { PyodideLoader } from
    "https://cdn.jsdelivr.net/npm/fyr-framework@0.1.0/dist/fyr-python.esm.js";

  const python = new PyodideLoader();
  await python.load();

  const result = await python.run("sum([1, 2, 3])");
  console.log(result);
</script>
~~~

Pyodide is downloaded at runtime. Plan for its startup and download cost, provide clear loading UI, and consider a self-hosted Pyodide distribution when your deployment needs strict asset control.

## Configure the Pyodide source

~~~js
const python = new PyodideLoader({
  pyodideUrl: "/vendor/pyodide/pyodide.mjs",
  indexURL: "/vendor/pyodide/",
  debug: true
});

await python.load();
~~~

The module's default configuration targets Pyodide 0.27.7. When self-hosting, keep the module URL and index URL from the same Pyodide release.

## PythonPlugin status

The bundle also exports PythonPlugin and PythonRuntime for plugin-oriented integrations. They are lower-level surfaces in 0.1.0 and require a Fyr plugin context. Prefer PyodideLoader for a standalone browser integration until the core package offers a stable plugin installation API.

## Security

Python executes in the user's browser. It is not a place for secrets, authorization logic, or trusted server operations. Do not execute code supplied by another user unless you have designed and validated an appropriate isolation model.
