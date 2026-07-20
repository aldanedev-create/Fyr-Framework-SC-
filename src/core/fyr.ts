/**
 * Fyr Framework Main Module
 * Provides the public API surface
 */

import { createApp } from './app/create-app';
import { mountApp } from './app/mount-app';
import { destroyApp } from './app/destroy-app';
import { appRegistry } from './app/app-registry';
import { http } from './http/http-client';
import { action } from './http/actions';
import { notify } from './ui/toast';
import { controller } from './controllers/controller-registry';
import { directive } from './directives/directive-registry';
import { plugin } from './plugins/plugin-system';
import { nextTick } from './utilities/scheduler';
import { emit, on } from './events/event-bus';
import { configure } from './config/config';

import type {
  Fyr as FyrInterface,
  FyrConfig,
  FyrControllerDefinition,
  FyrComponentDefinition,
  FyrPlugin,
  HttpOptions,
} from './types';

/**
 * Main Fyr Framework API
 * Exposed as window.Fyr in browser
 */
export class Fyr implements FyrInterface {
  /** Framework version */
  static readonly version: string = '0.1.0';

  /** HTTP client */
  static readonly http = http;

  /** Configuration */
  static configure = configure;

  /** Start the framework */
  static start = mountApp;

  /** Register a controller */
  static controller = controller;

  /** Register a component */
  static component = component;

  /** Register a directive */
  static directive = directive;

  /** Register a plugin */
  static plugin = plugin;

  /** Server action call */
  static action = action;

  /** Toast notification */
  static notify = notify;

  /** Next tick scheduler */
  static nextTick = nextTick;

  /** Event emitter */
  static emit = emit;

  /** Event listener */
  static on = on;

  /** Create an app instance */
  static createApp = createApp;

  /** Destroy an app */
  static destroyApp = destroyApp;

  /** Get app by name */
  static getApp = (name: string) => appRegistry.get(name);

  /** Check if app exists */
  static hasApp = (name: string) => appRegistry.has(name);
}

// Type alias for convenience
export type FyrInstance = typeof Fyr;

// Default export
export default Fyr;

/**
 * Register component (placeholder - will be implemented in Phase 2/3)
 */
function component(name: string, definition: FyrComponentDefinition): void {
  // Placeholder implementation
  console.warn('Component system coming in version 0.3.0');
  // @ts-ignore - will be implemented later
  componentRegistry.set(name, definition);
}

// Global exposure (for browser environment)
if (typeof window !== 'undefined') {
  (window as any).Fyr = Fyr;
}

// AMD/CommonJS support
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Fyr;
}