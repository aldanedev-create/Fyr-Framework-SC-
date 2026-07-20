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
  // A reactive holder lets consumers track `computed.value` just like ordinary
  // state. The effect tracks getter dependencies and publishes a new value when
  // any of them change.
  const computedObj = reactive({ value: undefined as T });

  createEffect(() => {
    computedObj.value = getter();
  });

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
