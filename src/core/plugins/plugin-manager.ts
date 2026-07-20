/**
 * Plugin Manager
 * Manages plugin registration, lifecycle, and dependencies
 */

import type { Plugin, PluginContext } from './plugin';
import { createPluginContext } from './plugin-context';
import type { Fyr } from '../fyr';

/**
 * Plugin manager configuration
 */
export interface PluginManagerConfig {
  /** Enable debug logging */
  debug?: boolean;
  /** Allow plugins to be installed multiple times */
  allowDuplicates?: boolean;
}

/**
 * Plugin manager
 */
export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private instances: Map<string, any> = new Map();
  private config: PluginManagerConfig;
  private fyr: typeof Fyr;

  constructor(fyr: typeof Fyr, config: PluginManagerConfig = {}) {
    this.fyr = fyr;
    this.config = {
      debug: false,
      allowDuplicates: false,
      ...config,
    };
  }

  /**
   * Install a plugin
   */
  async install(plugin: Plugin, options?: any): Promise<void> {
    // Check if already installed
    if (this.plugins.has(plugin.name) && !this.config.allowDuplicates) {
      throw new Error(`Plugin '${plugin.name}' is already installed`);
    }

    // Check dependencies
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.plugins.has(dep)) {
          throw new Error(`Plugin '${plugin.name}' depends on '${dep}' which is not installed`);
        }
      }
    }

    // Create context
    const context = createPluginContext(this.fyr, plugin, options);

    // Install the plugin
    try {
      await plugin.install(context);

      // Store plugin
      this.plugins.set(plugin.name, plugin);
      this.instances.set(plugin.name, context.api);

      // Initialize if available
      if (plugin.init) {
        await plugin.init(context);
      }

      if (this.config.debug) {
        console.log(`[Fyr] Plugin installed: ${plugin.name}`);
      }
    } catch (error) {
      console.error(`[Fyr] Failed to install plugin '${plugin.name}':`, error);
      throw error;
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstall(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin '${name}' is not installed`);
    }

    // Check if any other plugin depends on this
    for (const [otherName, otherPlugin] of this.plugins) {
      if (otherName !== name && otherPlugin.dependencies?.includes(name)) {
        throw new Error(`Cannot uninstall '${name}' - plugin '${otherName}' depends on it`);
      }
    }

    // Uninstall the plugin
    if (plugin.uninstall) {
      try {
        await plugin.uninstall();
      } catch (error) {
        console.error(`[Fyr] Error uninstalling plugin '${name}':`, error);
      }
    }

    this.plugins.delete(name);
    this.instances.delete(name);

    if (this.config.debug) {
      console.log(`[Fyr] Plugin uninstalled: ${name}`);
    }
  }

  /**
   * Get a plugin instance
   */
  get(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get plugin API
   */
  getAPI(name: string): any {
    return this.instances.get(name);
  }

  /**
   * Get all installed plugins
   */
  getAll(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugin names
   */
  getNames(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Check if a plugin is installed
   */
  has(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Enable debug mode
   */
  setDebug(enabled: boolean): void {
    this.config.debug = enabled;
  }

  /**
   * Get plugin count
   */
  count(): number {
    return this.plugins.size;
  }

  /**
   * Clear all plugins
   */
  async clear(): Promise<void> {
    for (const name of this.getNames()) {
      try {
        await this.uninstall(name);
      } catch {
        // Ignore errors during clear
      }
    }
  }
}

/**
 * Create a plugin manager
 */
export function createPluginManager(fyr: typeof Fyr, config?: PluginManagerConfig): PluginManager {
  return new PluginManager(fyr, config);
}