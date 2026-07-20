import { copyFile, mkdir } from "node:fs/promises";
await mkdir("dist", { recursive: true });
await copyFile("packages/core/src/fyr.js", "dist/fyr.js");
await copyFile("packages/core/src/fyr.js", "dist/fyr.min.js");
await copyFile("packages/python/src/fyr-python.js", "dist/fyr-python.js");
await copyFile("packages/wasm/src/fyr-wasm.js", "dist/fyr-wasm.js");
console.log("Fyr distributions built.");
