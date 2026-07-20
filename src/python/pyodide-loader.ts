/**
 * Pyodide Loader
 * Loads Pyodide runtime from CDN
 */

import { PythonError, createPythonError } from './python-errors';

/**
 * Pyodide configuration
 */
export interface PyodideConfig {
  /** Pyodide CDN URL */
  pyodideUrl?: string;
  /** Pyodide index URL */
  indexURL?: string;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Pyodide instance type
 */
export interface PyodideInstance {
  runPythonAsync(code: string): Promise<any>;
  runPython(code: string): any;
  globals: any;
  loadPackage(packages: string[]): Promise<void>;
  loadPackagesFromImports(code: string): Promise<void>;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<PyodideConfig> = {
  pyodideUrl: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.mjs',
  indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/',
  debug: false,
};

/**
 * Pyodide Loader
 */
export class PyodideLoader {
  private config: Required<PyodideConfig>;
  private pyodide: PyodideInstance | null = null;
  private loadingPromise: Promise<void> | null = null;
  private loaded = false;

  constructor(config: PyodideConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Load Pyodide runtime
   */
  async load(): Promise<void> {
    if (this.loaded) {
      return;
    }

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = this._load();
    await this.loadingPromise;
    this.loadingPromise = null;
  }

  /**
   * Internal load method
   */
  private async _load(): Promise<void> {
    try {
      this.log('Loading Pyodide...');

      // Import Pyodide
      const module = await import(this.config.pyodideUrl!);
      const pyodide = await module.loadPyodide({
        indexURL: this.config.indexURL,
      });

      this.pyodide = pyodide;
      this.loaded = true;

      this.log('Pyodide loaded successfully');
    } catch (error) {
      this.log('Failed to load Pyodide:', error);
      throw createPythonError(
        'Failed to load Pyodide: ' + (error instanceof Error ? error.message : String(error)),
        'LOAD_ERROR'
      );
    }
  }

  /**
   * Get Pyodide instance
   */
  getPyodide(): PyodideInstance {
    if (!this.pyodide) {
      throw new PythonError('Pyodide not loaded', 'NOT_LOADED');
    }
    return this.pyodide;
  }

  /**
   * Check if loaded
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Run Python code
   */
  async run(code: string): Promise<any> {
    const pyodide = this.getPyodide();
    try {
      return await pyodide.runPythonAsync(code);
    } catch (error) {
      throw createPythonError(
        error instanceof Error ? error.message : String(error),
        'EXECUTION_ERROR'
      );
    }
  }

  /**
   * Load packages
   */
  async loadPackages(packages: string[]): Promise<void> {
    const pyodide = this.getPyodide();
    try {
      await pyodide.loadPackage(packages);
    } catch (error) {
      throw createPythonError(
        `Failed to load packages: ${error instanceof Error ? error.message : String(error)}`,
        'PACKAGE_ERROR'
      );
    }
  }

  /**
   * Log debug message
   */
  private log(message: string, ...data: any[]): void {
    if (this.config.debug) {
      console.log(`[Pyodide] ${message}`, ...data);
    }
  }

  /**
   * Reset loader
   */
  reset(): void {
    this.pyodide = null;
    this.loaded = false;
    this.loadingPromise = null;
  }
}

/**
 * Default Pyodide loader instance
 */
export const pyodideLoader = new PyodideLoader();
