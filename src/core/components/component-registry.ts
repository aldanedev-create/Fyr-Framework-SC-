/**
 * Component Registry
 * Central registry for all Fyr components
 */

import type { ComponentDefinition } from './types';

/** Internal component registry */
const componentRegistry = new Map<string, ComponentDefinition>();

/**
 * Register a component
 * @param name - Component name
 * @param definition - Component definition
 * @throws {Error} If component already registered
 */
export function registerComponent(
  name: string,
  definition: ComponentDefinition
): void {
  if (componentRegistry.has(name)) {
    throw new Error(`Component '${name}' is already registered`);
  }
  componentRegistry.set(name, definition);
}

/**
 * Get a component by name
 * @param name - Component name
 * @returns Component definition or undefined
 */
export function getComponent(name: string): ComponentDefinition | undefined {
  return componentRegistry.get(name);
}

/**
 * Check if a component exists
 * @param name - Component name
 * @returns True if exists
 */
export function hasComponent(name: string): boolean {
  return componentRegistry.has(name);
}

/**
 * Get all registered components
 * @returns Array of component names
 */
export function getComponentNames(): string[] {
  return Array.from(componentRegistry.keys());
}

/**
 * Get all component definitions
 * @returns Array of component definitions
 */
export function getAllComponents(): ComponentDefinition[] {
  return Array.from(componentRegistry.values());
}

/**
 * Remove a component
 * @param name - Component name
 * @returns True if removed
 */
export function removeComponent(name: string): boolean {
  return componentRegistry.delete(name);
}

/**
 * Clear all components (for testing)
 */
export function clearComponents(): void {
  componentRegistry.clear();
}

/**
 * Get the number of registered components
 */
export function getComponentCount(): number {
  return componentRegistry.size;
}

// Export the registry for internal use
export { componentRegistry };