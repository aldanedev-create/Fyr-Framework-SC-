/**
 * WebAssembly Plugin
 * Main plugin for browser WebAssembly support
 */

import type { Plugin, PluginContext } from '../plugins/plugin';
import { WasmLoader, type WasmLoaderOptions } from './wasm-loader';
import { WasmRegistry, type WasmModule } from './wasm-registry';
import { WasmInstance, type WasmInstanceOptions } from './wasm-instance';
import { MemoryManager } from './memory-manager';
import { WasmCache } from './wasm-cache';
import { WasmError, createWasmError } from './wasm-errors';

/**
 * WebAssembly plugin options
 */
export interface WasmPluginOptions {
  /** Enable debug logging */
  debug?: boolean;
  /** Default timeout in milliseconds */
  defaultTimeout?: number;
  /** Enable caching */
  cache?: boolean;
  /** Cache TTL in milliseconds */
  cacheTTL?: number;
  /** Max memory in MB */
  maxMemory?: number;
  /** Allowed WASM origins */
  allowedOrigins?: string[];
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: WasmPluginOptions = {
  debug: false,
  defaultTimeout: 30000,
  cache: true,
  cacheTTL: 3600000, // 1 hour
  maxMemory: 256,
  allowedOrigins: ['*'],
};

/**
 * WebAssembly Plugin
 */
export class WasmPlugin implements Plugin {
  public readonly name = 'wasm';
  public readonly version = '0.1.0';
  public readonly description = 'Browser WebAssembly support';
  public readonly dependencies: string[] = [];

  private options: WasmPluginOptions;
  private context: PluginContext | null = null;
  private loader: WasmLoader | null = null;
  private registry: WasmRegistry | null = null;
  private memoryManager: MemoryManager | null = null;
  private cache: WasmCache | null = null;

  constructor(options: WasmPluginOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Install the plugin
   */
  async install(context: PluginContext): Promise<void> {
    this.context = context;

    // Initialize components
    this.memoryManager = new MemoryManager({
      maxMemory: this.options.maxMemory,
      debug: this.options.debug,
    });

    this.cache = new WasmCache({
      enabled: this.options.cache,
      ttl: this.options.cacheTTL,
      debug: this.options.debug,
    });

    this.loader = new WasmLoader({
      debug: this.options.debug,
      defaultTimeout: this.options.defaultTimeout,
      allowedOrigins: this.options.allowedOrigins,
      cache: this.cache,
    });

    this.registry = new WasmRegistry({
      debug: this.options.debug,
    });

    // Register with Fyr
    if (this.context) {
      this.context.registerService('wasm', {
        load: this.load.bind(this),
        loadFromUrl: this.loadFromUrl.bind(this),
        call: this.call.bind(this),
        get: this.get.bind(this),
        has: this.has.bind(this),
        unload: this.unload.bind(this),
        list: this.list.bind(this),
        createInstance: this.createInstance.bind(this),
        getInstance: this.getInstance.bind(this),
      });

      // Expose on Fyr.wasm
      const fyr = this.context.fyr;
      if (fyr) {
        (fyr as any).wasm = {
          load: this.load.bind(this),
          loadFromUrl: this.loadFromUrl.bind(this),
          call: this.call.bind(this),
          get: this.get.bind(this),
          has: this.has.bind(this),
          unload: this.unload.bind(this),
          list: this.list.bind(this),
          createInstance: this.createInstance.bind(this),
          getInstance: this.getInstance.bind(this),
        };
      }
    }

    this.log('WASM plugin installed');
  }

  /**
   * Initialize the plugin
   */
  async init(): Promise<void> {
    this.log('WASM plugin initialized');
  }

  /**
   * Load a WebAssembly module
   */
  async load(
    name: string,
    url: string,
    options?: { imports?: WebAssembly.Imports; timeout?: number }
  ): Promise<WasmModule> {
    if (!this.loader) {
      throw new WasmError('Loader not initialized', 'LOADER_NOT_INITIALIZED');
    }

    if (!this.registry) {
      throw new WasmError('Registry not initialized', 'REGISTRY_NOT_INITIALIZED');
    }

    // Check if already loaded
    if (this.registry.has(name)) {
      this.log(`Module '${name}' already loaded`);
      return this.registry.get(name)!;
    }

    this.log(`Loading WASM module: ${name} from ${url}`);

    try {
      // Load the module
      const module = await this.loader.load(name, url, options);

      // Register the module
      this.registry.register(name, module);

      // Set up memory
      if (this.memoryManager && module.memory) {
        this.memoryManager.registerMemory(name, module.memory);
      }

      this.log(`WASM module '${name}' loaded successfully`);
      return module;
    } catch (error) {
      this.log(`Failed to load WASM module '${name}':`, error);
      throw createWasmError(
        `Failed to load WASM module '${name}': ${error instanceof Error ? error.message : String(error)}`,
        'LOAD_ERROR'
      );
    }
  }

  /**
   * Load a WebAssembly module from URL (alias for load)
   */
  async loadFromUrl(
    name: string,
    url: string,
    options?: { imports?: WebAssembly.Imports; timeout?: number }
  ): Promise<WasmModule> {
    return this.load(name, url, options);
  }

  /**
   * Call a function on a WASM module
   */
  call<T = any>(
    name: string,
    exportName: string,
    ...args: any[]
  ): T {
    if (!this.registry) {
      throw new WasmError('Registry not initialized', 'REGISTRY_NOT_INITIALIZED');
    }

    const module = this.registry.get(name);
    if (!module) {
      throw createWasmError(
        `WASM module '${name}' not found`,
        'MODULE_NOT_FOUND'
      );
    }

    const fn = module.exports[exportName];
    if (typeof fn !== 'function') {
      throw createWasmError(
        `Export '${exportName}' not found in module '${name}'`,
        'EXPORT_NOT_FOUND'
      );
    }

    try {
      this.log(`Calling '${exportName}' on module '${name}'`);
      const result = fn(...args);
      this.log(`Call to '${exportName}' returned:`, result);
      return result as T;
    } catch (error) {
      this.log(`Call to '${exportName}' failed:`, error);
      throw createWasmError(
        `Call to '${exportName}' failed: ${error instanceof Error ? error.message : String(error)}`,
        'CALL_ERROR'
      );
    }
  }

  /**
   * Get a WASM module
   */
  get(name: string): WasmModule | undefined {
    if (!this.registry) {
      return undefined;
    }
    return this.registry.get(name);
  }

  /**
   * Check if a WASM module is loaded
   */
  has(name: string): boolean {
    if (!this.registry) {
      return false;
    }
    return this.registry.has(name);
  }

  /**
   * Unload a WASM module
   */
  unload(name: string): boolean {
    if (!this.registry) {
      return false;
    }

    // Remove from memory manager
    if (this.memoryManager) {
      this.memoryManager.unregisterMemory(name);
    }

    const result = this.registry.unregister(name);

    if (result) {
      this.log(`WASM module '${name}' unloaded`);
    }

    return result;
  }

  /**
   * List all loaded WASM modules
   */
  list(): string[] {
    if (!this.registry) {
      return [];
    }
    return this.registry.list();
  }

  /**
   * Create a WASM instance
   */
  async createInstance(
    name: string,
    options: WasmInstanceOptions
  ): Promise<WasmInstance> {
    if (!this.loader) {
      throw new WasmError('Loader not initialized', 'LOADER_NOT_INITIALIZED');
    }

    this.log(`Creating WASM instance: ${name}`);

    try {
      // Load the module if not already loaded
      if (!this.has(name)) {
        await this.load(name, options.url, { imports: options.imports });
      }

      // Get the module
      const module = this.get(name);
      if (!module) {
        throw new WasmError(`Module '${name}' not found after loading`, 'MODULE_NOT_FOUND');
      }

      // Create instance
      const instance = new WasmInstance({
        name,
        module,
        imports: options.imports,
        debug: this.options.debug,
      });

      await instance.instantiate();

      this.log(`WASM instance '${name}' created`);
      return instance;
    } catch (error) {
      this.log(`Failed to create WASM instance '${name}':`, error);
      throw createWasmError(
        `Failed to create WASM instance '${name}': ${error instanceof Error ? error.message : String(error)}`,
        'INSTANCE_ERROR'
      );
    }
  }

  /**
   * Get a WASM instance
   */
  getInstance(name: string): WasmInstance | undefined {
    // This would need to store instances
    // For now, we'll return undefined
    return undefined;
  }

  /**
   * Log debug message
   */
  private log(message: string, ...data: any[]): void {
    if (this.options.debug) {
      console.log(`[Fyr WASM] ${message}`, ...data);
    }
  }
}

/**
 * Default WASM plugin instance
 */
export const wasmPlugin = new WasmPlugin();

/**
 * Export default instance as Fyr.wasm
 */
export default wasmPlugin;