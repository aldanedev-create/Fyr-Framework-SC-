(function (global) {
  "use strict";
  const modules = new Map();
  async function load(name, url, imports = {}) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Unable to load WASM module: ${response.status}`);
    const bytes = await response.arrayBuffer();
    const instance = await WebAssembly.instantiate(bytes, imports);
    modules.set(name, instance.instance.exports);
    return instance.instance.exports;
  }
  function call(name, exportName, ...args) {
    const module = modules.get(name);
    if (!module) throw new Error(`WASM module '${name}' is not loaded`);
    const fn = module[exportName];
    if (typeof fn !== "function") throw new Error(`WASM export '${exportName}' was not found`);
    return fn(...args);
  }
  const plugin = { name: "wasm", load, call, has: name => modules.has(name) };
  global.FyrWasm = plugin;
  global.Fyr?.plugin("wasm", { install(Fyr) { Fyr.wasm = plugin; } });
})(globalThis);
