/**
 * WASM Registry
 * Registers and manages WebAssembly modules
 */

import { WasmError, createWasmError } from './wasm-errors';

/**
 * WASM module exports
 */
export interface WasmExports {
  [key: string]: any;
}

/**
 * WASM module
 */
export interface WasmModule {
  /** Module name */
  name: string;
  /** WebAssembly module */
  module: WebAssembly.Module;
  /** Instance exports */
  exports: WasmExports;
  /** Memory instance */
  memory?: WebAssembly.Memory;
  /** Instance */
  instance: WebAssembly.Instance;
  /** Load timestamp */
  loadedAt: number;
  /** Module size in bytes */
  size?: number;
}

/**
 * Registry options
 */
export interface WasmRegistryOptions {
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: Required<WasmRegistryOptions> = {
  debug: false,
};

/**
 * WASM Registry
 */
export class WasmRegistry {
  private options: Required<WasmRegistryOptions>;
  private modules: Map<string, WasmModule> = new Map();

  constructor(options: WasmRegistryOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Register a WASM module
   */
  register(
    name: string,
    module: WebAssembly.Module,
    instance?: WebAssembly.Instance
  ): WasmModule {
    if (this.modules.has(name)) {
      throw createWasmError(
        `WASM module '${name}' is already registered`,
        'DUPLICATE_MODULE'
      );
    }

    const exports = instance ? instance.exports : {};
    const memory = this.findMemory(exports);

    const wasmModule: WasmModule = {
      name,
      module,
      exports,
      instance: instance || {} as WebAssembly.Instance,
      memory,
      loadedAt: Date.now(),
    };

    this.modules.set(name, wasmModule);
    this.log(`Registered WASM module: ${name}`);

    return wasmModule;
  }

  /**
   * Get a WASM module
   */
  get(name: string): WasmModule | undefined {
    return this.modules.get(name);
  }

  /**
   * Check if a module exists
   */
  has(name: string): boolean {
    return this.modules.has(name);
  }

  /**
   * Unregister a WASM module
   */
  unregister(name: string): boolean {
    const result = this.modules.delete(name);
    if (result) {
      this.log(`Unregistered WASM module: ${name}`);
    }
    return result;
  }

  /**
   * List all registered modules
   */
  list(): string[] {
    return Array.from(this.modules.keys());
  }

  /**
   * Get all registered modules
   */
  getAll(): WasmModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * Clear all modules
   */
  clear(): void {
    this.modules.clear();
    this.log('Cleared all WASM modules');
  }

  /**
   * Get module count
   */
  count(): number {
    return this.modules.size;
  }

  /**
   * Find memory in exports
   */
  private findMemory(exports: WasmExports): WebAssembly.Memory | undefined {
    for (const key of Object.keys(exports)) {
      const value = exports[key];
      if (value instanceof WebAssembly.Memory) {
        return value;
      }
    }
    return undefined;
  }

  /**
   * Log debug message
   */
  private log(message: string, ...data: any[]): void {
    if (this.options.debug) {
      console.log(`[WASM Registry] ${message}`, ...data);
    }
  }
}

/**
 * Default WASM registry instance
 */
export const wasmRegistry = new WasmRegistry();