/**
 * Python Runtime
 * Manages Python execution and state
 */

import type { PyodideLoader } from './pyodide-loader';
import type { WorkerManager } from './worker-manager';
import type { PackageLoader } from './package-loader';
import type { JavaScriptBridge } from './javascript-bridge';
import { PythonError, createPythonError } from './python-errors';

/**
 * Python runtime options
 */
export interface PythonRuntimeOptions {
  /** Pyodide loader */
  loader: PyodideLoader;
  /** Worker manager */
  workerManager: WorkerManager;
  /** Package loader */
  packageLoader: PackageLoader;
  /** JavaScript bridge */
  bridge: JavaScriptBridge;
  /** Enable debug logging */
  debug?: boolean;
  /** Default timeout in milliseconds */
  defaultTimeout?: number;
}

/**
 * Python runtime state
 */
interface RuntimeState {
  initialized: boolean;
  loaded: boolean;
  packages: Set<string>;
  globals: Record<string, any>;
}

/**
 * Python Runtime
 */
export class PythonRuntime {
  private options: Required<PythonRuntimeOptions>;
  private state: RuntimeState = {
    initialized: false,
    loaded: false,
    packages: new Set(),
    globals: {},
  };

  constructor(options: PythonRuntimeOptions) {
    this.options = {
      ...options,
      debug: options.debug || false,
      defaultTimeout: options.defaultTimeout || 30000,
    };
  }

  /**
   * Initialize the runtime
   */
  async initialize(): Promise<void> {
    if (this.state.initialized) {
      return;
    }

    this.log('Initializing Python runtime...');

    try {
      // Set up bridge
      this.options.bridge.initialize();

      // Load Pyodide
      await this.options.loader.load();

      // Set up globals
      await this.setupGlobals();

      this.state.initialized = true;
      this.log('Python runtime initialized');
    } catch (error) {
      this.log('Failed to initialize Python runtime:', error);
      throw createPythonError(
        'Failed to initialize Python runtime: ' + (error instanceof Error ? error.message : String(error)),
        'INIT_ERROR'
      );
    }
  }

  /**
   * Load the runtime
   */
  async load(): Promise<void> {
    if (this.state.loaded) {
      return;
    }

    await this.initialize();
    this.state.loaded = true;
    this.log('Python runtime loaded');
  }

  /**
   * Check if loaded
   */
  isLoaded(): boolean {
    return this.state.loaded;
  }

  /**
   * Run Python code
   */
  async run(code: string, options?: { timeout?: number }): Promise<any> {
    await this.load();

    const timeout = options?.timeout || this.options.defaultTimeout;

    this.log('Running Python code...');

    try {
      const result = await this.options.workerManager.execute({
        type: 'run',
        code,
        timeout,
      });

      this.log('Python code executed successfully');
      return result;
    } catch (error) {
      this.log('Python execution error:', error);
      throw createPythonError(
        error instanceof Error ? error.message : String(error),
        'EXECUTION_ERROR'
      );
    }
  }

  /**
   * Evaluate Python expression
   */
  async eval(expression: string, options?: { timeout?: number }): Promise<any> {
    await this.load();

    const timeout = options?.timeout || this.options.defaultTimeout;

    this.log('Evaluating Python expression...');

    try {
      const result = await this.options.workerManager.execute({
        type: 'eval',
        code: expression,
        timeout,
      });

      this.log('Python expression evaluated');
      return result;
    } catch (error) {
      this.log('Python eval error:', error);
      throw createPythonError(
        error instanceof Error ? error.message : String(error),
        'EVAL_ERROR'
      );
    }
  }

  /**
   * Execute Python code (non-blocking)
   */
  async execute(code: string, options?: { timeout?: number }): Promise<any> {
    await this.load();

    const timeout = options?.timeout || this.options.defaultTimeout;

    this.log('Executing Python code...');

    try {
      const result = await this.options.workerManager.execute({
        type: 'execute',
        code,
        timeout,
      });

      this.log('Python code executed');
      return result;
    } catch (error) {
      this.log('Python execute error:', error);
      throw createPythonError(
        error instanceof Error ? error.message : String(error),
        'EXECUTION_ERROR'
      );
    }
  }

  /**
   * Install a Python package
   */
  async installPackage(packageName: string): Promise<void> {
    await this.load();

    if (this.state.packages.has(packageName)) {
      this.log(`Package '${packageName}' already installed`);
      return;
    }

    this.log(`Installing package: ${packageName}`);

    try {
      await this.options.packageLoader.install(packageName);
      this.state.packages.add(packageName);
      this.log(`Package '${packageName}' installed`);
    } catch (error) {
      this.log(`Failed to install package '${packageName}':`, error);
      throw createPythonError(
        `Failed to install package '${packageName}': ${error instanceof Error ? error.message : String(error)}`,
        'PACKAGE_INSTALL_ERROR'
      );
    }
  }

  /**
   * Install multiple packages
   */
  async installPackages(packages: string[]): Promise<void> {
    await this.load();

    const toInstall = packages.filter(p => !this.state.packages.has(p));

    if (toInstall.length === 0) {
      this.log('All packages already installed');
      return;
    }

    this.log(`Installing packages: ${toInstall.join(', ')}`);

    for (const pkg of toInstall) {
      await this.installPackage(pkg);
    }
  }

  /**
   * Setup Python globals
   */
  private async setupGlobals(): Promise<void> {
    const pyodide = this.options.loader.getPyodide();

    // Set up bridge globals
    const bridgeCode = this.options.bridge.getBridgeCode();
    await pyodide.runPythonAsync(bridgeCode);

    // Set up basic globals
    const globalsCode = `
import sys
import json
import math
import random

# Set up bridge
from fyr_bridge import FyrBridge
fyr = FyrBridge()

# Helper functions
def to_js(obj):
    return obj

def to_py(obj):
    return obj
`;
    await pyodide.runPythonAsync(globalsCode);

    this.log('Python globals set up');
  }

  /**
   * Log debug message
   */
  private log(message: string, ...data: any[]): void {
    if (this.options.debug) {
      console.log(`[Python Runtime] ${message}`, ...data);
    }
  }

  /**
   * Get runtime state
   */
  getState(): RuntimeState {
    return { ...this.state };
  }

  /**
   * Reset runtime
   */
  reset(): void {
    this.state = {
      initialized: false,
      loaded: false,
      packages: new Set(),
      globals: {},
    };
    this.options.loader.reset();
    this.log('Runtime reset');
  }
}

/**
 * Default Python runtime instance
 */
export const pythonRuntime = new PythonRuntime({
  loader: {} as any,
  workerManager: {} as any,
  packageLoader: {} as any,
  bridge: {} as any,
});