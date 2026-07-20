/**
 * WASM Instance
 * Manages individual WebAssembly instances
 */

import type { WasmExports, WasmModule } from './wasm-registry';
import { WasmError, createWasmError } from './wasm-errors';

/**
 * Instance state
 */
export type InstanceState = 'created' | 'instantiating' | 'ready' | 'error' | 'destroyed';

/**
 * Instance options
 */
export interface WasmInstanceOptions {
  /** Instance name */
  name: string;
  /** WASM module */
  module: WasmModule;
  /** Source URL used when the plugin must lazily load this module. */
  url?: string;
  /** Import object */
  imports?: WebAssembly.Imports;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * WASM Instance
 */
export class WasmInstance {
  public readonly name: string;
  public readonly module: WasmModule;
  public state: InstanceState = 'created';
  public instance: WebAssembly.Instance | null = null;
  public exports: WasmExports | null = null;
  public memory: WebAssembly.Memory | null = null;

  private options: WasmInstanceOptions & { imports: WebAssembly.Imports; debug: boolean };
  private instantiatePromise: Promise<void> | null = null;

  constructor(options: WasmInstanceOptions) {
    this.name = options.name;
    this.module = options.module;
    this.options = {
      ...options,
      debug: options.debug || false,
      imports: options.imports || {},
    };
  }

  /**
   * Instantiate the WASM module
   */
  async instantiate(): Promise<void> {
    if (this.state === 'ready') {
      return;
    }

    if (this.state === 'instantiating') {
      return this.instantiatePromise ?? Promise.resolve();
    }

    if (this.state === 'destroyed') {
      throw new WasmError('Instance is destroyed', 'INSTANCE_DESTROYED');
    }

    this.state = 'instantiating';

    this.instantiatePromise = this._instantiate();
    await this.instantiatePromise;
    this.instantiatePromise = null;
  }

  /**
   * Internal instantiate
   */
  private async _instantiate(): Promise<void> {
    try {
      this.log(`Instantiating WASM: ${this.name}`);

      // Prepare imports
      const imports = this.prepareImports();

      // Instantiate
      this.instance = await WebAssembly.instantiate(this.module.module, imports);

      // Get exports
      this.exports = this.instance.exports;

      // Find memory
      this.memory = this.findMemory(this.exports) ?? null;

      // Update state
      this.state = 'ready';

      this.log(`WASM instance '${this.name}' ready`);
    } catch (error) {
      this.state = 'error';
      this.log(`Failed to instantiate WASM '${this.name}':`, error);
      throw createWasmError(
        `Failed to instantiate WASM '${this.name}': ${error instanceof Error ? error.message : String(error)}`,
        'INSTANTIATE_ERROR'
      );
    }
  }

  /**
   * Prepare imports for instantiation
   */
  private prepareImports(): WebAssembly.Imports {
    const imports: WebAssembly.Imports = {
      env: {
        memory: this.module.memory || new WebAssembly.Memory({ initial: 1, maximum: 256 }),
        ...this.options.imports,
      },
    };

    // Add any custom imports
    if (this.options.imports) {
      for (const [key, value] of Object.entries(this.options.imports)) {
        if (key !== 'env') {
          imports[key] = value;
        } else {
          imports.env = { ...imports.env, ...value };
        }
      }
    }

    return imports;
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
   * Call an exported function
   */
  call<T = any>(name: string, ...args: any[]): T {
    if (this.state !== 'ready') {
      throw new WasmError('Instance not ready', 'INSTANCE_NOT_READY');
    }

    if (!this.exports) {
      throw new WasmError('No exports available', 'NO_EXPORTS');
    }

    const fn = this.exports[name];
    if (typeof fn !== 'function') {
      throw createWasmError(
        `Export '${name}' not found`,
        'EXPORT_NOT_FOUND'
      );
    }

    try {
      return fn(...args) as T;
    } catch (error) {
      throw createWasmError(
        `Call to '${name}' failed: ${error instanceof Error ? error.message : String(error)}`,
        'CALL_ERROR'
      );
    }
  }

  /**
   * Check if an export exists
   */
  hasExport(name: string): boolean {
    if (!this.exports) {
      return false;
    }
    return name in this.exports && typeof this.exports[name] === 'function';
  }

  /**
   * Get export names
   */
  getExportNames(): string[] {
    const exports = this.exports;
    if (!exports) {
      return [];
    }
    return Object.keys(exports).filter(
      key => typeof exports[key] === 'function'
    );
  }

  /**
   * Destroy the instance
   */
  destroy(): void {
    if (this.state === 'destroyed') {
      return;
    }

    this.state = 'destroyed';
    this.instance = null;
    this.exports = null;
    this.memory = null;

    this.log(`WASM instance '${this.name}' destroyed`);
  }

  /**
   * Log debug message
   */
  private log(message: string, ...data: any[]): void {
    if (this.options.debug) {
      console.log(`[WASM Instance] ${message}`, ...data);
    }
  }
}

/**
 * Default WASM instance factory
 */
export const wasmInstance = {
  create: (options: WasmInstanceOptions) => new WasmInstance(options),
};
