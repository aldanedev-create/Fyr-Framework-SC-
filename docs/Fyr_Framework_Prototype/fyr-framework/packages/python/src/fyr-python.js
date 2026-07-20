(function (global) {
  "use strict";
  const DEFAULT_PYODIDE = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.mjs";
  let runtimePromise;

  async function load(options = {}) {
    if (!runtimePromise) {
      runtimePromise = (async () => {
        const module = await import(options.pyodideUrl || DEFAULT_PYODIDE);
        const pyodide = await module.loadPyodide({ indexURL: options.indexURL || DEFAULT_PYODIDE.replace("pyodide.mjs", "") });
        pyodide.globals.set("fyr_js", {
          text(selector, value) { document.querySelector(selector).textContent = String(value); },
          value(selector) { return document.querySelector(selector)?.value ?? ""; },
          notify(message) { global.Fyr?.notify(String(message), "success"); }
        });
        await pyodide.runPythonAsync(`
class FyrBridge:
    def text(self, selector, value): fyr_js.text(selector, value)
    def value(self, selector): return fyr_js.value(selector)
    def notify(self, message): fyr_js.notify(message)
fyr = FyrBridge()
`);
        return pyodide;
      })();
    }
    return runtimePromise;
  }

  async function run(code, options = {}) {
    const pyodide = await load(options);
    return pyodide.runPythonAsync(code);
  }

  const plugin = { name: "python", load, run };
  global.FyrPython = plugin;
  global.Fyr?.plugin("python", { install(Fyr) { Fyr.python = plugin; } });
})(globalThis);
