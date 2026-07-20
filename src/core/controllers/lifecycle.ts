/**
 * Lifecycle Management
 * Handles controller lifecycle hooks and cleanup
 */

import type { ControllerInstance, LifecycleHook } from '../types';

/** Lifecycle hook names */
export type LifecycleHookName =
  | 'mounted'
  | 'beforeDestroy'
  | 'destroyed'
  | 'beforeUpdate'
  | 'updated'
  | 'activated'
  | 'deactivated';

/** Lifecycle hook registry */
const lifecycleHooks = new Map<
  string,
  Record<LifecycleHookName, Array<LifecycleHook>>
>();

/**
 * Register a lifecycle hook for a controller
 * @param controllerName - Controller name
 * @param hook - Hook name
 * @param handler - Hook handler
 */
export function registerLifecycleHook(
  controllerName: string,
  hook: LifecycleHookName,
  handler: LifecycleHook
): void {
  if (!lifecycleHooks.has(controllerName)) {
    lifecycleHooks.set(controllerName, {} as any);
  }

  const hooks = lifecycleHooks.get(controllerName)!;
  if (!hooks[hook]) {
    hooks[hook] = [];
  }

  hooks[hook].push(handler);
}

/**
 * Run lifecycle hooks for a controller instance
 * @param instance - Controller instance
 * @param hook - Hook name
 * @param context - Context for the hook
 */
export function runLifecycleHooks(
  instance: ControllerInstance,
  hook: LifecycleHookName,
  context?: any
): void {
  const hooks = lifecycleHooks.get(instance.name);
  if (!hooks) return;

  const handlers = hooks[hook];
  if (!handlers || handlers.length === 0) return;

  for (const handler of handlers) {
    try {
      handler.call(instance, context);
    } catch (error) {
      console.error(
        `Lifecycle hook '${hook}' error on controller '${instance.name}':`,
        error
      );
    }
  }
}

/**
 * Run async lifecycle hooks
 * @param instance - Controller instance
 * @param hook - Hook name
 * @param context - Context for the hook
 * @returns Promise that resolves when all hooks complete
 */
export async function runAsyncLifecycleHooks(
  instance: ControllerInstance,
  hook: LifecycleHookName,
  context?: any
): Promise<void> {
  const hooks = lifecycleHooks.get(instance.name);
  if (!hooks) return;

  const handlers = hooks[hook];
  if (!handlers || handlers.length === 0) return;

  for (const handler of handlers) {
    try {
      const result = handler.call(instance, context);
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      console.error(
        `Async lifecycle hook '${hook}' error on controller '${instance.name}':`,
        error
      );
    }
  }
}

/**
 * Clear all lifecycle hooks for a controller
 * @param controllerName - Controller name
 */
export function clearLifecycleHooks(controllerName: string): void {
  lifecycleHooks.delete(controllerName);
}

/**
 * Get lifecycle hooks for a controller
 * @param controllerName - Controller name
 * @returns Lifecycle hooks
 */
export function getLifecycleHooks(
  controllerName: string
): Record<LifecycleHookName, Array<LifecycleHook>> | undefined {
  return lifecycleHooks.get(controllerName);
}

/**
 * Lifecycle manager for a controller instance
 */
export class LifecycleManager {
  private instance: ControllerInstance;
  private hooks: Map<LifecycleHookName, Array<LifecycleHook>>;

  constructor(instance: ControllerInstance) {
    this.instance = instance;
    this.hooks = new Map();

    // Set up lifecycle hooks
    this.hooks.set('mounted', []);
    this.hooks.set('beforeDestroy', []);
    this.hooks.set('destroyed', []);
    this.hooks.set('beforeUpdate', []);
    this.hooks.set('updated', []);
    this.hooks.set('activated', []);
    this.hooks.set('deactivated', []);
  }

  /**
   * Add a lifecycle hook
   * @param hook - Hook name
   * @param handler - Hook handler
   */
  addHook(hook: LifecycleHookName, handler: LifecycleHook): void {
    const handlers = this.hooks.get(hook);
    if (handlers) {
      handlers.push(handler);
    }
  }

  /**
   * Remove a lifecycle hook
   * @param hook - Hook name
   * @param handler - Hook handler to remove
   */
  removeHook(hook: LifecycleHookName, handler: LifecycleHook): void {
    const handlers = this.hooks.get(hook);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Run a lifecycle hook
   * @param hook - Hook name
   * @param context - Context for the hook
   */
  runHook(hook: LifecycleHookName, context?: any): void {
    const handlers = this.hooks.get(hook);
    if (!handlers) return;

    for (const handler of handlers) {
      try {
        handler.call(this.instance, context);
      } catch (error) {
        console.error(
          `Lifecycle hook '${hook}' error on controller '${this.instance.name}':`,
          error
        );
      }
    }

    // Also run instance-specific hooks
    const instanceHook = this.instance[hook as keyof ControllerInstance];
    if (typeof instanceHook === 'function') {
      try {
        (instanceHook as LifecycleHook).call(this.instance, context);
      } catch (error) {
        console.error(
          `Instance lifecycle hook '${hook}' error on controller '${this.instance.name}':`,
          error
        );
      }
    }
  }

  /**
   * Run an async lifecycle hook
   * @param hook - Hook name
   * @param context - Context for the hook
   * @returns Promise
   */
  async runAsyncHook(hook: LifecycleHookName, context?: any): Promise<void> {
    const handlers = this.hooks.get(hook);
    if (!handlers) return;

    for (const handler of handlers) {
      try {
        const result = handler.call(this.instance, context);
        if (result instanceof Promise) {
          await result;
        }
      } catch (error) {
        console.error(
          `Async lifecycle hook '${hook}' error on controller '${this.instance.name}':`,
          error
        );
      }
    }

    // Also run instance-specific hooks
    const instanceHook = this.instance[hook as keyof ControllerInstance];
    if (typeof instanceHook === 'function') {
      try {
        const result = (instanceHook as LifecycleHook).call(this.instance, context);
        if (result instanceof Promise) {
          await result;
        }
      } catch (error) {
        console.error(
          `Instance lifecycle hook '${hook}' error on controller '${this.instance.name}':`,
          error
        );
      }
    }
  }

  /**
   * Clear all hooks
   */
  clear(): void {
    this.hooks.clear();
  }
}
