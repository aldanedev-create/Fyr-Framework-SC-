/**
 * Plugin System
 * Defines plugin interface and base classes
 */

import type { Fyr } from '../fyr';
import type { FyrApp } from '../app/types';
import type { ControllerInstance } from '../controllers/types';

/**
 * Plugin interface
 */
export interface Plugin<T = any> {
  /** Plugin name (must be unique) */
  name: string;
  /** Plugin version */
  version?: string;
  /** Plugin description */
  description?: string;
  /** Plugin author */
  author?: string;
  /** Plugin license */
  license?: string;
  /** Plugin dependencies */
  dependencies?: string[];
  /** Plugin options */
  options?: T;

  /** Install the plugin */
  install(context: PluginContext): void | Promise<void>;

  /** Initialize the plugin */
  init?(context: PluginContext): void | Promise<void>;

  /** Called when plugin is uninstalled */
  uninstall?(): void | Promise<void>;

  /** Called when an app mounts */
  onAppMount?(app: FyrApp): void | Promise<void>;

  /** Called when an app unmounts */
  onAppUnmount?(app: FyrApp): void | Promise<void>;

  /** Called when a controller mounts */
  onControllerMount?(controller: ControllerInstance): void | Promise<void>;

  /** Called when a controller unmounts */
  onControllerUnmount?(controller: ControllerInstance): void | Promise<void>;
}

/**
 * Plugin context
 */
export interface PluginContext {
  /** Fyr instance */
  fyr: typeof Fyr;
  /** Plugin name */
  pluginName: string;
  /** Plugin options */
  options: any;
  /** Plugin API (exposed to other plugins) */
  api: Record<string, any>;
  /** Register a directive */
  registerDirective: (name: string, handler: any) => void;
  /** Register a component */
  registerComponent: (name: string, definition: any) => void;
  /** Register a controller */
  registerController: (name: string, definition: any) => void;
  /** Register a service */
  registerService: (name: string, service: any) => void;
  /** Get a service */
  getService: (name: string) => any;
  /** Emit an event */
  emit: (event: string, data?: any) => void;
  /** Listen to an event */
  on: (event: string, handler: (data: any) => void) => void;
}

/**
 * Plugin base class
 */
export abstract class BasePlugin<T = any> implements Plugin<T> {
  public readonly name: string;
  public readonly version?: string;
  public readonly description?: string;
  public readonly author?: string;
  public readonly license?: string;
  public readonly options?: T;

  constructor(options: {
    name: string;
    version?: string;
    description?: string;
    author?: string;
    license?: string;
    options?: T;
  }) {
    this.name = options.name;
    this.version = options.version;
    this.description = options.description;
    this.author = options.author;
    this.license = options.license;
    this.options = options.options;
  }

  abstract install(context: PluginContext): void | Promise<void>;

  init?(context: PluginContext): void | Promise<void>;

  uninstall?(): void | Promise<void>;

  onAppMount?(app: FyrApp): void | Promise<void>;

  onAppUnmount?(app: FyrApp): void | Promise<void>;

  onControllerMount?(controller: ControllerInstance): void | Promise<void>;

  onControllerUnmount?(controller: ControllerInstance): void | Promise<void>;
}

/**
 * Simple plugin creator
 */
export function createPlugin<T = any>(
  name: string,
  install: (context: PluginContext, options?: T) => void | Promise<void>,
  options?: {
    version?: string;
    description?: string;
    author?: string;
    license?: string;
    dependencies?: string[];
  }
): Plugin<T> {
  return {
    name,
    version: options?.version,
    description: options?.description,
    author: options?.author,
    license: options?.license,
    dependencies: options?.dependencies,
    install(context: PluginContext) {
      return install(context, (context as any).options);
    },
  };
}