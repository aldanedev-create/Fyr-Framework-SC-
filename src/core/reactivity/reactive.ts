/**
 * Reactive State System
 * Creates reactive proxies that track dependencies and trigger updates
 */

import { activeEffect, getDependencies, track, trigger } from './effect';
import { scheduleRender } from './scheduler';

/** WeakMap cache for reactive proxies */
const proxyCache = new WeakMap<object, object>();

/** Tracked keys per target for dependency management */
export const targetMap = new WeakMap<object, Map<string | symbol, Set<() => void>>>();

/**
 * Create a reactive proxy for an object
 * @param target - The object to make reactive
 * @param notify - Optional custom notify function
 * @returns Reactive proxy
 */
export function reactive<T extends object>(
  target: T,
  notify: () => void = () => scheduleRender()
): T {
  // Return primitive values as-is
  if (target === null || typeof target !== 'object') {
    return target;
  }

  // Return cached proxy if exists
  if (proxyCache.has(target)) {
    return proxyCache.get(target) as T;
  }

  // Create proxy
  const proxy = new Proxy(target, {
    get(target: T, key: string | symbol, receiver: any) {
      const value = Reflect.get(target, key, receiver);

      // Track dependency if effect is active
      if (activeEffect) {
        track(target, key);
      }

      // Deep reactive for nested objects
      if (value !== null && typeof value === 'object') {
        return reactive(value, notify);
      }

      return value;
    },

    set(target: T, key: string | symbol, value: any, receiver: any) {
      const oldValue = Reflect.get(target, key, receiver);

      // Check if value actually changed
      if (oldValue === value) {
        return true;
      }

      // Set the new value
      const result = Reflect.set(target, key, value, receiver);

      // Trigger updates
      trigger(target, key);

      // Notify scheduler
      notify();

      return result;
    },

    deleteProperty(target: T, key: string | symbol) {
      const result = Reflect.deleteProperty(target, key);
      trigger(target, key);
      notify();
      return result;
    },

    has(target: T, key: string | symbol) {
      const result = Reflect.has(target, key);
      if (activeEffect) {
        track(target, key);
      }
      return result;
    },

    ownKeys(target: T) {
      if (activeEffect) {
        // Track all keys for iteration
        track(target, 'length' as any);
      }
      return Reflect.ownKeys(target);
    },
  });

  // Cache proxy
  proxyCache.set(target, proxy);

  return proxy;
}

/**
 * Mark an object as reactive (for arrays)
 * @param target - The array to make reactive
 * @param notify - Custom notify function
 * @returns Reactive array
 */
export function reactiveArray<T extends any[]>(
  target: T,
  notify: () => void = () => scheduleRender()
): T {
  // Wrap array methods to trigger updates
  const arrayMethods = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'] as const;

  const proxy = reactive(target, notify);

  // Override array methods to trigger updates
  for (const method of arrayMethods) {
    const original = target[method];
    (proxy as any)[method] = function (...args: any[]) {
      const result = original.apply(this, args);
      notify();
      return result;
    };
  }

  return proxy;
}

/**
 * Check if a value is reactive
 * @param value - Value to check
 * @returns True if reactive
 */
export function isReactive(value: any): boolean {
  return value !== null && typeof value === 'object' && proxyCache.has(value);
}

/**
 * Get the original target from a reactive proxy
 * @param proxy - Reactive proxy
 * @returns Original target
 */
export function toRaw<T extends object>(proxy: T): T {
  // Try to find in cache
  for (const [target, cached] of proxyCache) {
    if (cached === proxy) {
      return target as T;
    }
  }
  return proxy;
}

/**
 * Create a shallow reactive proxy (only top-level properties are reactive)
 * @param target - Object to make shallow reactive
 * @param notify - Custom notify function
 * @returns Shallow reactive proxy
 */
export function shallowReactive<T extends object>(
  target: T,
  notify: () => void = () => scheduleRender()
): T {
  if (target === null || typeof target !== 'object') {
    return target;
  }

  // Don't use cache for shallow
  return new Proxy(target, {
    get(target: T, key: string | symbol, receiver: any) {
      const value = Reflect.get(target, key, receiver);
      if (activeEffect) {
        track(target, key);
      }
      return value; // Don't deep proxy
    },

    set(target: T, key: string | symbol, value: any, receiver: any) {
      const oldValue = Reflect.get(target, key, receiver);
      if (oldValue === value) return true;
      const result = Reflect.set(target, key, value, receiver);
      trigger(target, key);
      notify();
      return result;
    },

    deleteProperty(target: T, key: string | symbol) {
      const result = Reflect.deleteProperty(target, key);
      trigger(target, key);
      notify();
      return result;
    },
  });
}