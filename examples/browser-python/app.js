import { Fyr } from "https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr.esm.js";

let pyodide;
const app = Fyr.createApp("python-demo", {
  state: { code: "numbers = [2, 3, 5, 7]\n{'sum': sum(numbers), 'squares': [n * n for n in numbers]}", status: "Python runtime is not loaded.", output: "" },
  methods: {
    async runPython() {
      this.state.status = "Loading Pyodide…";
      try {
        if (!pyodide) {
          const { loadPyodide } = await import("https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.mjs");
          pyodide = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/" });
        }
        const result = await pyodide.runPythonAsync(this.state.code);
        this.state.output = result === undefined ? "Python completed with no return value." : String(result);
        this.state.status = "Python completed in this browser tab.";
      } catch (error) {
        this.state.status = `Python error: ${error.message}`;
      }
    },
  },
});
Fyr.start("python-demo");
