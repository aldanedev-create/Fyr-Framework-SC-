import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("prebuilt wasm add works", async () => {
  const bytes = await readFile(new URL("../dist/fyr-engine.wasm", import.meta.url));
  const { instance } = await WebAssembly.instantiate(bytes);
  assert.equal(instance.exports.add(20, 22), 42);
});
