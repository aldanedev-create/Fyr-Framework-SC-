/**
 * Controller System
 * Manages controller definitions and instances
 */

import { reactive } from '../reactivity/reactive';
import { computed } from '../reactivity/computed';
import { watch } from '../reactivity/watch';
import { batch } from '../reactivity/batch';
import { nextTick } from '../reactivity/scheduler';

import type {
  FyrController,
  FyrControllerDefinition,
  ReactiveState,
  ControllerInstance,
  ControllerContext,
} from '../types';

/**
 * Create a controller definition
 * @param name - Controller name
 * @param definition - Controller definition
 * @returns Controller definition object
 */
export function createController(
  name: string,
  definition: FyrControllerDefinition
): FyrController {
  return {
    name,
    state: definition.state || {},
    methods: definition.methods || {},
    computed: definition.computed || {},
    watch: definition.watch || {},
    mounted: definition.mounted,
    beforeDestroy: definition.beforeDestroy,
    destroyed: definition.destroyed,
  };
}

/**
 * Instantiate a controller
 * @param controller - Controller definition
 * @param context - Controller context (element, parent, etc.)
 * @returns Controller instance
 */
export function instantiateController(
  controller: FyrController,
  context: ControllerContext = {}
): ControllerInstance {
  const { el, parent, props = {} } = context;

  // Create reactive state
  const state = reactive(controller.state || {});

  // Create computed values
  const computedValues: Record<string, any> = {};
  if (controller.computed) {
    for (const [key, getter] of Object.entries(controller.computed)) {
      computedValues[key] = computed(getter.bind({ state, props }));
    }
  }

  // Create methods bound to instance
  const methods: Record<string, Function> = {};
  if (controller.methods) {
    for (const [key, method] of Object.entries(controller.methods)) {
      methods[key] = method.bind(instance);
    }
  }

  // Create instance
  const instance: ControllerInstance = {
    name: controller.name,
    state,
    props,
    methods,
    computed: computedValues,
    el,
    parent,
    _isMounted: false,
    _isDestroyed: false,
    _watchers: [],
  };

  // Set up watchers
  if (controller.watch) {
    for (const [key, handler] of Object.entries(controller.watch)) {
      const watchFn = () => {
        // Get value from state or computed
        const value = getValue(instance, key);
        return value;
      };

      const stop = watch(watchFn, (newVal, oldVal) => {
        handler.call(instance, newVal, oldVal);
      });

      instance._watchers.push(stop);
    }
  }

  // Return instance
  return instance;
}

/**
 * Get a value from the instance (state, computed, or props)
 * @param instance - Controller instance
 * @param key - Key to get
 * @returns Value
 */
export function getValue(instance: ControllerInstance, key: string): any {
  // Check state
  if (key in instance.state) {
    return instance.state[key];
  }

  // Check computed
  if (key in instance.computed) {
    return instance.computed[key]?.value;
  }

  // Check props
  if (key in instance.props) {
    return instance.props[key];
  }

  // Check methods (for expressions)
  if (key in instance.methods) {
    return instance.methods[key];
  }

  return undefined;
}

/**
 * Set a value on the instance
 * @param instance - Controller instance
 * @param key - Key to set
 * @param value - Value to set
 */
export function setValue(instance: ControllerInstance, key: string, value: any): void {
  // Check state
  if (key in instance.state) {
    instance.state[key] = value;
    return;
  }

  // Check props (should be read-only)
  if (key in instance.props) {
    console.warn(`Cannot set prop '${key}' on controller '${instance.name}'`);
    return;
  }

  // Check computed (should be read-only)
  if (key in instance.computed) {
    console.warn(`Cannot set computed '${key}' on controller '${instance.name}'`);
    return;
  }
}

/**
 * Check if a key exists on the instance
 * @param instance - Controller instance
 * @param key - Key to check
 * @returns True if exists
 */
export function hasValue(instance: ControllerInstance, key: string): boolean {
  return (
    key in instance.state ||
    key in instance.computed ||
    key in instance.props ||
    key in instance.methods
  );
}

/**
 * Get all keys on the instance
 * @param instance - Controller instance
 * @returns Array of keys
 */
export function getKeys(instance: ControllerInstance): string[] {
  const keys = new Set<string>();

  for (const key of Object.keys(instance.state)) keys.add(key);
  for (const key of Object.keys(instance.computed)) keys.add(key);
  for (const key of Object.keys(instance.props)) keys.add(key);
  for (const key of Object.keys(instance.methods)) keys.add(key);

  return Array.from(keys);
}

/**
 * Create a scope object for expression evaluation
 * @param instance - Controller instance
 * @param extras - Extra values to include in scope
 * @returns Scope object
 */
export function createScope(
  instance: ControllerInstance,
  extras: Record<string, any> = {}
): Record<string, any> {
  const scope: Record<string, any> = {};

  // Add state
  for (const [key, value] of Object.entries(instance.state)) {
    scope[key] = value;
  }

  // Add computed
  for (const [key, value] of Object.entries(instance.computed)) {
    scope[key] = value?.value;
  }

  // Add props
  for (const [key, value] of Object.entries(instance.props)) {
    scope[key] = value;
  }

  // Add methods
  for (const [key, value] of Object.entries(instance.methods)) {
    scope[key] = value;
  }

  // Add extras
  for (const [key, value] of Object.entries(extras)) {
    scope[key] = value;
  }

  return scope;
}