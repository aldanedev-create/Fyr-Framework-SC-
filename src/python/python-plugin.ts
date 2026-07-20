/**
 * Python Plugin
 * Main plugin for browser Python support
 */

import type { Plugin, PluginContext } from '../plugins/plugin';
import { PyodideLoader } from './pyodide-loader';
import { PythonRuntime } from './python-runtime';
import { WorkerManager } from './worker-manager';
import { PackageLoader } from './package-loader';
import { JavaScriptBridge } from './javascript-bridge';
import { PythonError, createPythonError } from './python-errors';

/**
 * Python plugin options
 */
export interface PythonPluginOptions {
  /** Pyodide CDN URL */
  pyodideUrl?: string;
  /** Pyodide index URL */
  indexURL?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Default timeout in milliseconds */
  defaultTimeout?: number;
  /** Max memory in MB */
  maxMemory?: number;
  /** Allowed packages */
  allowedPackages?: string[];
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: PythonPluginOptions = {
  pyodideUrl: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.mjs',
  indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/',
  debug: false,
  defaultTimeout: 30000,
  maxMemory: 512,
  allowedPackages: ['micropip', 'numpy', 'pandas', 'math', 'json', 'random'],
};

/**
 * Python Plugin
 */
export class PythonPlugin implements Plugin {
  public readonly name = 'python';
  public readonly version = '0.1.0';
  public readonly description = 'Browser Python support via Pyodide';
  public readonly dependencies: string[] = [];

  private options: PythonPluginOptions;
  private context: PluginContext | null = null;
  private runtime: PythonRuntime | null = null;
  private loader: PyodideLoader | null = null;
  private workerManager: WorkerManager | null = null;
  private packageLoader: PackageLoader | null = null;
  private bridge: JavaScriptBridge | null = null;

  constructor(options: PythonPluginOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Install the plugin
   */
  async install(context: PluginContext): Promise<void> {
    this.context = context;

    // Initialize components
    this.loader = new PyodideLoader({
      pyodideUrl: this.options.pyodideUrl,
      indexURL: this.options.indexURL,
      debug: this.options.debug,
    });

    this.workerManager = new WorkerManager({
      debug: this.options.debug,
      defaultTimeout: this.options.defaultTimeout,
      maxMemory: this.options.maxMemory,
    });

    this.packageLoader = new PackageLoader({
      allowedPackages: this.options.allowedPackages,
      debug: this.options.debug,
    });

    this.bridge = new JavaScriptBridge({
      debug: this.options.debug,
    });

    this.runtime = new PythonRuntime({
      loader: this.loader,
      workerManager: this.workerManager,
      packageLoader: this.packageLoader,
      bridge: this.bridge,
      debug: this.options.debug,
      defaultTimeout: this.options.defaultTimeout,
    });

    // Register with Fyr
    if (this.context) {
      this.context.registerService('python', {
        run: this.run.bind(this),
        load: this.load.bind(this),
        install: this.installPackage.bind(this),
        eval: this.eval.bind(this),
        execute: this.execute.bind(this),
        getRuntime: this.getRuntime.bind(this),
        isLoaded: this.isLoaded.bind(this),
      });

      // Expose on Fyr.python
      const fyr = this.context.fyr;
      if (fyr) {
        (fyr as any).python = {
          run: this.run.bind(this),
          load: this.load.bind(this),
          install: this.installPackage.bind(this),
          eval: this.eval.bind(this),
          execute: this.execute.bind(this),
          getRuntime: this.getRuntime.bind(this),
          isLoaded: this.isLoaded.bind(this),
        };
      }
    }

    this.log('Python plugin installed');
  }

  /**
   * Initialize the plugin
   */
  async init(): Promise<void> {
    this.log('Python plugin initialized');
  }

  /**
   * Load Python runtime
   */
  async load(): Promise<void> {
    if (!this.runtime) {
      throw new PythonError('Runtime not initialized', 'RUNTIME_NOT_INITIALIZED');
    }
    await this.runtime.load();
  }

  /**
   * Run Python code
   */
  async run(code: string, options?: { timeout?: number }): Promise<any> {
    if (!this.runtime) {
      throw new PythonError('Runtime not initialized', 'RUNTIME_NOT_INITIALIZED');
    }
    return this.runtime.run(code, options);
  }

  /**
   * Evaluate Python expression
   */
  async eval(expression: string, options?: { timeout?: number }): Promise<any> {
    if (!this.runtime) {
      throw new PythonError('Runtime not initialized', 'RUNTIME_NOT_INITIALIZED');
    }
    return this.runtime.eval(expression, options);
  }

  /**
   * Execute Python code (non-blocking)
   */
  async execute(code: string, options?: { timeout?: number }): Promise<any> {
    if (!this.runtime) {
      throw new PythonError('Runtime not initialized', 'RUNTIME_NOT_INITIALIZED');
    }
    return this.runtime.execute(code, options);
  }

  /**
   * Install a Python package
   */
  async installPackage(packageName: string): Promise<void> {
    if (!this.runtime) {
      throw new PythonError('Runtime not initialized', 'RUNTIME_NOT_INITIALIZED');
    }
    return this.runtime.installPackage(packageName);
  }

  /**
   * Get the runtime instance
   */
  getRuntime(): PythonRuntime | null {
    return this.runtime;
  }

  /**
   * Check if runtime is loaded
   */
  isLoaded(): boolean {
    return this.runtime ? this.runtime.isLoaded() : false;
  }

  /**
   * Log debug message
   */
  private log(message: string, ...data: any[]): void {
    if (this.options.debug) {
      console.log(`[Fyr Python] ${message}`, ...data);
    }
  }
}

/**
 * Default Python plugin instance
 */
export const pythonPlugin = new PythonPlugin();

/**
 * Export default instance as Fyr.python
 */
export default pythonPlugin;