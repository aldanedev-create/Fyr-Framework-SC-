/**
 * Computed Values
 * Lazy evaluated values that cache results and auto-update
 */

import { createEffect } from './effect';
import { reactive } from './reactive';

/**
 * Create a computed value
 * @param getter - Function that computes the value
 * @returns Computed value object with value property
 */
export function computed<T>(getter: () => T): { value: T } {
  let value: T;
  let isDirty = true;

  // Create effect that updates when dependencies change
  const effect = createEffect(() => {
    // This runs when dependencies change
    isDirty = true;
  }, { lazy: true });

  // Create getter that computes on access
  const computedObj = {
    get value(): T {
      if (isDirty) {
        // Run the getter with effect tracking
        const trackedGetter = () => {
          value = getter();
        };

        // Use effect to track dependencies
        effect();

        // Now compute the actual value with tracking
        // We need to re-run the getter with active effect
        const currentEffect = effect;
        const prevEffect = (globalThis as any).__fyrActiveEffect;

        // Temporarily set active effect for tracking
        (globalThis as any).__fyrActiveEffect = currentEffect;

        try {
          value = getter();
        } finally {
          (globalThis as any).__fyrActiveEffect = prevEffect;
        }

        isDirty = false;
      }
      return value;
    },
  };

  return computedObj;
}

/**
 * Computed value with write support
 * @param getter - Function that computes the value
 * @param setter - Function that sets the value
 * @returns Computed value object with value property
 */
export function computedWithWrite<T>(
  getter: () => T,
  setter: (value: T) => void
): { value: T } {
  const computedObj = computed(getter);

  // Add setter
  return new Proxy(computedObj, {
    set(target: any, key: string, value: any) {
      if (key === 'value') {
        setter(value);
        return true;
      }
      return Reflect.set(target, key, value);
    },
  });
}

/**
 * Check if a value is a computed
 * @param value - Value to check
 * @returns True if computed
 */
export function isComputed(value: any): boolean {
  return value !== null &&
    typeof value === 'object' &&
    'value' in value &&
    typeof (value as any).value !== 'undefined';
}