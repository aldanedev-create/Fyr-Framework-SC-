/**
 * Effect System
 * Tracks dependencies and runs side effects when dependencies change
 */

import { targetMap } from './reactive';
import { scheduleRender } from './scheduler';

/** Currently active effect (for dependency tracking) */
export let activeEffect: (() => void) | null = null;

/** Stack for nested effects */
const effectStack: Array<() => void> = [];

/** Set of effects scheduled to run */
const scheduledEffects = new Set<() => void>();

/** Map of effect to its dependencies for cleanup */
const effectDepsMap = new WeakMap<() => void, Set<[object, string | symbol]>>();

/**
 * Create a reactive effect
 * @param fn - Function to run with dependencies tracked
 * @param options - Effect options
 * @returns Effect control object
 */
export function createEffect(
  fn: () => void,
  options: {
    lazy?: boolean;
    scheduler?: (effect: () => void) => void;
    onError?: (error: Error) => void;
  } = {}
): () => void {
  const { lazy = false, scheduler, onError } = options;

  let isDirty = true;
  let isRunning = false;

  const effect = function () {
    if (isRunning) return;

    isRunning = true;

    try {
      // Clean up old dependencies
      cleanupEffect(effect);

      // Set active effect for tracking
      activeEffect = effect;
      effectStack.push(effect);

      // Run the function
      fn();

      isDirty = false;
    } catch (error) {
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      } else {
        console.error('Effect error:', error);
      }
    } finally {
      // Restore active effect
      effectStack.pop();
      activeEffect = effectStack[effectStack.length - 1] || null;
      isRunning = false;
    }
  };

  // Store deps for cleanup
  effectDepsMap.set(effect, new Set());

  // Run immediately if not lazy
  if (!lazy) {
    effect();
  }

  // Return effect runner
  return effect;
}

/**
 * Track a dependency for the current effect
 * @param target - The object being accessed
 * @param key - The key being accessed
 */
export function track(target: object, key: string | symbol): void {
  if (!activeEffect) return;

  // Get or create target map
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  // Get or create dependency set
  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }

  // Add current effect to dependencies
  dep.add(activeEffect);

  // Store dependency for cleanup
  const effectDeps = effectDepsMap.get(activeEffect);
  if (effectDeps) {
    effectDeps.add([target, key]);
  }
}

/**
 * Trigger all effects for a target/key
 * @param target - The object being changed
 * @param key - The key being changed
 */
export function trigger(target: object, key: string | symbol): void {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  const deps = depsMap.get(key);
  if (!deps) return;

  // Run all effects
  for (const effect of deps) {
    scheduleEffect(effect);
  }
}

/**
 * Schedule an effect to run (with deduplication)
 * @param effect - Effect to schedule
 */
function scheduleEffect(effect: () => void): void {
  if (!scheduledEffects.has(effect)) {
    scheduledEffects.add(effect);

    // Use microtask for batching
    queueMicrotask(() => {
      for (const scheduled of scheduledEffects) {
        scheduled();
      }
      scheduledEffects.clear();
    });
  }
}

/**
 * Clean up all effects for a target
 * @param target - Target to clean up
 */
export function cleanupEffectsForTarget(target: object): void {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  for (const [key, deps] of depsMap) {
    for (const effect of deps) {
      cleanupEffect(effect);
    }
    deps.clear();
  }
  depsMap.clear();
  targetMap.delete(target);
}

/**
 * Clean up a specific effect
 * @param effect - Effect to clean up
 */
export function cleanupEffect(effect: () => void): void {
  const deps = effectDepsMap.get(effect);
  if (!deps) return;

  for (const [target, key] of deps) {
    const depsMap = targetMap.get(target);
    if (depsMap) {
      const dep = depsMap.get(key);
      if (dep) {
        dep.delete(effect);
        if (dep.size === 0) {
          depsMap.delete(key);
        }
      }
    }
  }

  deps.clear();
  scheduledEffects.delete(effect);
  effectDepsMap.delete(effect);
}

/**
 * Get current active effect (for debugging)
 */
export function getActiveEffect(): (() => void) | null {
  return activeEffect;
}

/**
 * Get all dependencies for an effect (for debugging)
 */
export function getEffectDeps(effect: () => void): Array<[object, string | symbol]> {
  const deps = effectDepsMap.get(effect);
  return deps ? Array.from(deps) : [];
}

/** Backwards-compatible name used by the reactivity debugger. */
export const getDependencies = getEffectDeps;
