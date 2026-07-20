import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const artifactPath = join(dirname(scriptDirectory), 'dist', 'fyr-engine.wasm');
const bytes = await readFile(artifactPath);
const { instance } = await WebAssembly.instantiate(bytes);

assert.equal(typeof instance.exports.add, 'function', 'the engine must export add');
assert.equal(typeof instance.exports.fibonacci, 'function', 'the engine must export fibonacci');
assert.equal(typeof instance.exports.answer_to_life, 'function', 'the engine must export answer_to_life');
assert.equal(instance.exports.add(20, 22), 42);
assert.equal(instance.exports.fibonacci(10), 55);
assert.equal(instance.exports.answer_to_life(), 42);

console.log(`Verified ${artifactPath} (${bytes.byteLength} bytes).`);
