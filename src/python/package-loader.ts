/**
 * Package Loader
 * Loads and manages Python packages
 */

import { PythonError, createPythonError } from './python-errors';

/**
 * Package configuration
 */
export interface PackageConfig {
  /** Package name */
  name: string;
  /** Package version */
  version?: string;
  /** Package source URL */
  url?: string;
  /** Package dependencies */
  dependencies?: string[];
}

/**
 * Package loader options
 */
export interface PackageLoaderOptions {
  /** Allowed packages list */
  allowedPackages?: string[];
  /** Enable debug logging */
  debug?: boolean;
  /** Package index URL */
  indexURL?: string;
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: Required<PackageLoaderOptions> = {
  allowedPackages: ['micropip', 'numpy', 'pandas', 'math', 'json', 'random'],
  debug: false,
  indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/',
};

/**
 * Package Loader
 */
export class PackageLoader {
  private options: Required<PackageLoaderOptions>;
  private installedPackages: Set<string> = new Set();
  private loadingPackages: Map<string, Promise<void>> = new Map();

  constructor(options: PackageLoaderOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Install a package
   */
  async install(packageName: string, pyodide: any): Promise<void> {
    // Check if allowed
    if (!this.isAllowed(packageName)) {
      throw createPythonError(
        `Package '${packageName}' is not allowed`,
        'PACKAGE_NOT_ALLOWED'
      );
    }

    // Check if already installed
    if (this.installedPackages.has(packageName)) {
      this.log(`Package '${packageName}' already installed`);
      return;
    }

    // Check if currently loading
    if (this.loadingPackages.has(packageName)) {
      return this.loadingPackages.get(packageName);
    }

    this.log(`Installing package: ${packageName}`);

    const installPromise = this._install(packageName, pyodide);
    this.loadingPackages.set(packageName, installPromise);

    try {
      await installPromise;
      this.installedPackages.add(packageName);
      this.log(`Package '${packageName}' installed successfully`);
    } finally {
      this.loadingPackages.delete(packageName);
    }
  }

  /**
   * Internal install
   */
  private async _install(packageName: string, pyodide: any): Promise<void> {
    try {
      // Use Pyodide's loadPackage
      await pyodide.loadPackage([packageName]);
    } catch (error) {
      // Try using micropip as fallback
      try {
        await pyodide.runPythonAsync(`
          import micropip
          await micropip.install('${packageName}')
        `);
      } catch (fallbackError) {
        throw createPythonError(
          `Failed to install package '${packageName}': ${error instanceof Error ? error.message : String(error)}`,
          'PACKAGE_INSTALL_ERROR'
        );
      }
    }
  }

  /**
   * Check if package is allowed
   */
  isAllowed(packageName: string): boolean {
    // Check exact match
    if (this.options.allowedPackages.includes(packageName)) {
      return true;
    }

    // Check wildcard patterns
    for (const pattern of this.options.allowedPackages) {
      if (pattern.endsWith('*') && packageName.startsWith(pattern.slice(0, -1))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if package is installed
   */
  isInstalled(packageName: string): boolean {
    return this.installedPackages.has(packageName);
  }

  /**
   * Get installed packages
   */
  getInstalledPackages(): string[] {
    return Array.from(this.installedPackages);
  }

  /**
   * Log debug message
   */
  private log(message: string, ...data: any[]): void {
    if (this.options.debug) {
      console.log(`[Package Loader] ${message}`, ...data);
    }
  }

  /**
   * Reset loader
   */
  reset(): void {
    this.installedPackages.clear();
    this.loadingPackages.clear();
  }
}

/**
 * Default package loader instance
 */
export const packageLoader = new PackageLoader();