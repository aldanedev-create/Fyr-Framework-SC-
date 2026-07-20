/**
 * Plugin Context
 * Provides context and API to plugins
 */

import type { Plugin, PluginContext } from './plugin';
import type { Fyr } from '../fyr';
import { registerDirective } from '../directives/registry';
import { registerComponent } from '../components/component-registry';
import { registerController } from '../controllers/controller-registry';

/**
 * Plugin context creator
 */
export function createPluginContext(
  fyr: typeof Fyr,
  plugin: Plugin,
  options?: any
): PluginContext {
  const api: Record<string, any> = {};

  const context: PluginContext = {
    fyr,
    pluginName: plugin.name,
    options: options || plugin.options || {},
    api,

    registerDirective(name: string, handler: any): void {
      registerDirective(name, handler);
    },

    registerComponent(name: string, definition: any): void {
      registerComponent(name, definition);
    },

    registerController(name: string, definition: any): void {
      registerController(name, definition);
    },

    registerService(name: string, service: any): void {
      api[name] = service;
    },

    getService(name: string): any {
      return api[name];
    },

    emit(event: string, data?: any): void {
      const customEvent = new CustomEvent(`fyr-plugin:${event}`, {
        detail: { plugin: plugin.name, data },
        bubbles: true,
      });
      document.dispatchEvent(customEvent);
    },

    on(event: string, handler: (data: any) => void): void {
      document.addEventListener(`fyr-plugin:${event}`, (e: Event) => {
        const customEvent = e as CustomEvent;
        handler(customEvent.detail?.data);
      });
    },
  };

  return context;
}

/**
 * Plugin context utilities
 */
export const PluginUtils = {
  /**
   * Create a plugin context from a plugin
   */
  createContext(
    fyr: typeof Fyr,
    plugin: Plugin,
    options?: any
  ): PluginContext {
    return createPluginContext(fyr, plugin, options);
  },

  /**
   * Merge plugin contexts
   */
  mergeContexts(contexts: PluginContext[]): PluginContext {
    const merged: Record<string, any> = {};

    for (const context of contexts) {
      for (const [key, value] of Object.entries(context.api)) {
        if (!(key in merged)) {
          merged[key] = value;
        }
      }
    }

    // Create a combined context
    const baseContext = contexts[0];
    if (!baseContext) {
      throw new Error('No contexts to merge');
    }

    return {
      ...baseContext,
      api: merged,
    };
  },

  /**
   * Check if a plugin is installed
   */
  isPluginInstalled(fyr: typeof Fyr, name: string): boolean {
    // @ts-ignore - access internal plugin manager
    return fyr.__plugins?.has(name) || false;
  },

  /**
   * Get plugin API
   */
  getPluginAPI(fyr: typeof Fyr, name: string): any {
    // @ts-ignore - access internal plugin manager
    return fyr.__plugins?.getAPI(name);
  },
};