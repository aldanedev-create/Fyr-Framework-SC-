/**
 * WebAssembly Plugin - Main Export
 * Browser WebAssembly support
 */

import { wasmPlugin } from './wasm-plugin';

export { WasmPlugin, wasmPlugin } from './wasm-plugin';
export { WasmLoader, wasmLoader, type WasmLoaderOptions } from './wasm-loader';
export { WasmRegistry, wasmRegistry, type WasmModule, type WasmExports } from './wasm-registry';
export { WasmInstance, wasmInstance, type WasmInstanceOptions, type InstanceState } from './wasm-instance';
export { MemoryManager, memoryManager, type MemoryManagerOptions } from './memory-manager';
export { WasmCache, wasmCache, type WasmCacheOptions } from './wasm-cache';
export { WasmError, createWasmError, isWasmError, type WasmErrorCode } from './wasm-errors';

// Default export
export default wasmPlugin;
