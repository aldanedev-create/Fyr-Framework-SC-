import { Fyr } from "https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr.esm.js";
import { WasmLoader } from "https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr-wasm.esm.js";

const engineUrl = "https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr-engine.wasm";
const loader = new WasmLoader({ allowedOrigins: ["https://cdn.jsdelivr.net"] });
const app = Fyr.createApp("wasm-demo", {
  state: { status: "The Rust engine has not been loaded.", loaded: false, byteLength: 0, exportsText: "" },
  methods: {
    async loadEngine() {
      this.state.status = "Downloading and compiling WebAssembly…";
      try {
        const module = await loader.load("fyr-engine", engineUrl);
        const response = await fetch(engineUrl);
        this.state.byteLength = (await response.arrayBuffer()).byteLength;
        this.state.exportsText = WebAssembly.Module.exports(module).map(entry => `${entry.kind}: ${entry.name}`).join("\n") || "The engine exports no public functions.";
        this.state.loaded = true;
        this.state.status = "Rust engine compiled successfully.";
      } catch (error) {
        this.state.status = `Unable to load the engine: ${error.message}`;
      }
    },
  },
});
Fyr.start("wasm-demo");
