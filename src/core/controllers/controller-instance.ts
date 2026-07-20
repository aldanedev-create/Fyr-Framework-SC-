/**
 * Controller Instance
 * Represents a running controller instance
 */

import {
  instantiateController,
  getValue,
  setValue,
  hasValue,
  getKeys,
  createScope,
} from './controller';
import { getController, registerInstance, unregisterInstance } from './controller-registry';
import { nextTick } from '../reactivity/scheduler';

import type {
  FyrController,
  ControllerInstance,
  ControllerContext,
  ControllerInstanceOptions,
} from '../types';

/**
 * Create and mount a controller instance
 * @param name - Controller name
 * @param options - Instance options
 * @returns Controller instance
 */
export function createControllerInstance(
  name: string,
  options: ControllerInstanceOptions = {}
): ControllerInstance {
  // Get controller definition
  const controller = getController(name);
  if (!controller) {
    throw new Error(`Fyr controller '${name}' not found`);
  }

  // Create context
  const context: ControllerContext = {
    el: options.el || null,
    parent: options.parent || null,
    props: options.props || {},
  };

  // Instantiate
  const instance = instantiateController(controller, context);

  // Store element reference
  if (options.el) {
    (options.el as any).__fyrController = instance;
  }

  // Register instance
  registerInstance(name, instance);

  return instance;
}

/**
 * Mount a controller instance (call mounted hook)
 * @param instance - Controller instance
 * @returns Promise that resolves when mounted
 */
export async function mountControllerInstance(
  instance: ControllerInstance
): Promise<void> {
  if (instance._isMounted) {
    console.warn(`Controller '${instance.name}' is already mounted`);
    return;
  }

  instance._isMounted = true;

  // Call mounted hook if exists
  if (instance.mounted) {
    try {
      const result = instance.mounted.call(instance);
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      console.error(`Controller '${instance.name}' mounted hook error:`, error);
    }
  }

  // Emit mounted event
  const event = new CustomEvent('fyr-controller-mounted', {
    detail: {
      name: instance.name,
      instance,
    },
  });
  document.dispatchEvent(event);
}

/**
 * Destroy a controller instance
 * @param instance - Controller instance
 * @returns True if destroyed successfully
 */
export function destroyControllerInstance(
  instance: ControllerInstance
): boolean {
  if (instance._isDestroyed) {
    console.warn(`Controller '${instance.name}' is already destroyed`);
    return false;
  }

  // Call beforeDestroy hook
  if (instance.beforeDestroy) {
    try {
      instance.beforeDestroy.call(instance);
    } catch (error) {
      console.error(`Controller '${instance.name}' beforeDestroy hook error:`, error);
    }
  }

  // Stop all watchers
  for (const stop of instance._watchers) {
    try {
      stop();
    } catch (error) {
      console.error(`Controller '${instance.name}' watcher cleanup error:`, error);
    }
  }
  instance._watchers = [];

  // Remove from registry
  unregisterInstance(instance.name, instance);

  // Clear element reference
  if (instance.el) {
    delete (instance.el as any).__fyrController;
  }

  // Mark as destroyed
  instance._isDestroyed = true;
  instance._isMounted = false;

  // Call destroyed hook
  if (instance.destroyed) {
    try {
      instance.destroyed.call(instance);
    } catch (error) {
      console.error(`Controller '${instance.name}' destroyed hook error:`, error);
    }
  }

  // Emit destroyed event
  const event = new CustomEvent('fyr-controller-destroyed', {
    detail: {
      name: instance.name,
      instance,
    },
  });
  document.dispatchEvent(event);

  return true;
}

/**
 * Find a controller instance on an element
 * @param el - DOM element
 * @returns Controller instance or null
 */
export function findControllerInstance(
  el: HTMLElement
): ControllerInstance | null {
  // Check element itself
  if ((el as any).__fyrController) {
    return (el as any).__fyrController;
  }

  // Check parent elements
  let current: HTMLElement | null = el.parentElement;
  while (current) {
    if ((current as any).__fyrController) {
      return (current as any).__fyrController;
    }
    current = current.parentElement;
  }

  return null;
}

/**
 * Find all controller instances in an element
 * @param el - DOM element
 * @returns Array of controller instances
 */
export function findAllControllerInstances(
  el: HTMLElement
): ControllerInstance[] {
  const instances: ControllerInstance[] = [];

  // Check element itself
  if ((el as any).__fyrController) {
    instances.push((el as any).__fyrController);
  }

  // Check children
  const elements = el.querySelectorAll('[fyr-controller]');
  for (const element of elements) {
    if ((element as any).__fyrController) {
      instances.push((element as any).__fyrController);
    }
  }

  return instances;
}

/**
 * Get the controller instance for an element
 * @param el - DOM element
 * @param name - Optional controller name filter
 * @returns Controller instance or null
 */
export function getControllerInstance(
  el: HTMLElement,
  name?: string
): ControllerInstance | null {
  const instance = findControllerInstance(el);
  if (instance && name && instance.name !== name) {
    return null;
  }
  return instance;
}

/**
 * Helper to create a controller instance with automatic mounting
 * @param name - Controller name
 * @param options - Instance options
 * @returns Controller instance
 */
export async function createAndMountController(
  name: string,
  options: ControllerInstanceOptions = {}
): Promise<ControllerInstance> {
  const instance = createControllerInstance(name, options);
  await mountControllerInstance(instance);
  return instance;
}

// Re-export for convenience
export { getValue, setValue, hasValue, getKeys, createScope };
