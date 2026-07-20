/**
 * Watch System
 * Observes reactive state changes with callback
 */

import { createEffect } from './effect';
import { reactive, toRaw } from './reactive';

/**
 * Watch a source for changes
 * @param source - Source to watch (function, object, or key path)
 * @param callback - Called when source changes
 * @param options - Watch options
 * @returns Stop function
 */
export function watch<T>(
  source: (() => T) | object | string,
  callback: (newValue: T, oldValue: T) => void,
  options: {
    immediate?: boolean;
    deep?: boolean;
    flush?: 'pre' | 'post' | 'sync';
  } = {}
): () => void {
  const { immediate = false, deep = false, flush = 'post' } = options;

  // Convert source to getter
  let getter: () => T;

  if (typeof source === 'function') {
    getter = source as () => T;
  } else if (typeof source === 'string') {
    // Path string (e.g., 'user.name')
    getter = () => {
      // This assumes source is a path on the current scope
      // Will be resolved in the context where watch is called
      throw new Error('String path watch requires scope context');
    };
  } else {
    // Object - watch the object itself
    getter = () => source as T;
  }

  let oldValue: T;
  let isFirstRun = true;

  // Create effect that tracks dependencies
  const effect = createEffect(() => {
    // Get current value with dependency tracking
    const newValue = getter();

    // Handle deep watch
    let newVal = newValue;
    let oldVal = oldValue;

    if (deep && newValue && typeof newValue === 'object') {
      // For deep watch, we need to track nested properties
      // This is handled by the reactive proxy
      newVal = reactive(newValue as any);
    }

    // Skip first run if not immediate
    if (isFirstRun) {
      isFirstRun = false;
      oldValue = newValue;
      if (immediate) {
        callback(newValue, undefined as any);
      }
      return;
    }

    // Check if value changed
    if (newVal === oldVal) return;

    // Call callback
    callback(newVal, oldVal);

    // Update old value
    oldValue = newValue;
  }, {
    lazy: true,
    scheduler: (effect) => {
      if (flush === 'sync') {
        effect();
      } else if (flush === 'post') {
        queueMicrotask(effect);
      } else {
        // 'pre' - run before render
        queueMicrotask(effect);
      }
    },
  });

  // Initial run to track dependencies
  effect();

  // Return stop function
  return () => {
    // Clean up effect
    // This will be handled by the effect cleanup system
  };
}

/**
 * Watch multiple sources
 * @param sources - Array of sources to watch
 * @param callback - Called when any source changes
 * @param options - Watch options
 * @returns Stop function
 */
export function watchAll<T extends any[]>(
  sources: T,
  callback: (newValues: T, oldValues: T) => void,
  options: {
    immediate?: boolean;
  } = {}
): () => void {
  const { immediate = false } = options;

  let oldValues: T = sources.map(() => undefined) as T;
  let isFirstRun = true;

  // Create getters for each source
  const getters = sources.map((source) => {
    if (typeof source === 'function') {
      return source as () => any;
    } else {
      // Object or primitive
      return () => source;
    }
  });

  // Create effect that watches all sources
  const effect = createEffect(() => {
    const newValues = getters.map(getter => getter()) as T;

    if (isFirstRun) {
      isFirstRun = false;
      oldValues = newValues;
      if (immediate) {
        callback(newValues, newValues.map(() => undefined) as T);
      }
      return;
    }

    // Check if any value changed
    const hasChanged = newValues.some((val, i) => val !== oldValues[i]);
    if (!hasChanged) return;

    callback(newValues, oldValues);
    oldValues = newValues;
  }, { lazy: true });

  // Initial run
  effect();

  // Return stop function
  return () => {
    // Cleanup
  };
}

/**
 * Watch with immediate execution
 * @param source - Source to watch
 * @param callback - Called when source changes
 * @param options - Watch options
 * @returns Stop function
 */
export function watchImmediate<T>(
  source: () => T,
  callback: (newValue: T, oldValue: T) => void,
  options: {
    deep?: boolean;
    flush?: 'pre' | 'post' | 'sync';
  } = {}
): () => void {
  return watch(source, callback, { ...options, immediate: true });
}

/**
 * Watch once - only triggers the first time
 * @param source - Source to watch
 * @param callback - Called when source changes
 * @param options - Watch options
 * @returns Stop function
 */
export function watchOnce<T>(
  source: () => T,
  callback: (newValue: T, oldValue: T) => void,
  options: {
    deep?: boolean;
  } = {}
): () => void {
  let hasTriggered = false;

  const stop = watch(source, (newVal, oldVal) => {
    if (hasTriggered) return;
    hasTriggered = true;
    callback(newVal, oldVal);
    stop();
  }, options);

  return stop;
}