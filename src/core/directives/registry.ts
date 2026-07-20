/**
 * Directive Registry
 * Central registry for all Fyr directives
 */

import type { DirectiveHandler, DirectiveRegistry } from './types';

/** Internal directive registry */
const registry: DirectiveRegistry = new Map<string, DirectiveHandler>();

/**
 * Register a directive
 * @param name - Directive name (without 'fyr-' prefix)
 * @param handler - Directive handler function
 * @throws {Error} If directive already registered
 */
export function registerDirective(name: string, handler: DirectiveHandler): void {
  if (registry.has(name)) {
    throw new Error(`Directive '${name}' is already registered`);
  }
  registry.set(name, handler);
}

/**
 * Get a directive handler
 * @param name - Directive name
 * @returns Handler or undefined
 */
export function getDirective(name: string): DirectiveHandler | undefined {
  return registry.get(name);
}

/**
 * Check if a directive exists
 * @param name - Directive name
 * @returns True if exists
 */
export function hasDirective(name: string): boolean {
  return registry.has(name);
}

/**
 * Get all registered directives
 * @returns Map of all directives
 */
export function getAllDirectives(): DirectiveRegistry {
  return new Map(registry);
}

/**
 * Remove a directive
 * @param name - Directive name
 * @returns True if removed
 */
export function removeDirective(name: string): boolean {
  return registry.delete(name);
}

/**
 * Clear all directives (for testing)
 */
export function clearDirectives(): void {
  registry.clear();
}

/**
 * Get the number of registered directives
 */
export function getDirectiveCount(): number {
  return registry.size;
}

// Export the registry for internal use
export const directiveRegistry = registry;