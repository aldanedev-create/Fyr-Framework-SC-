/**
 * Controller Registry
 * Central registry for all Fyr controllers
 */

import type { FyrController, FyrControllerDefinition } from '../types';
import { createController } from './controller';

/** Internal controller registry */
const controllerRegistry = new Map<string, FyrController>();

/** Internal instance registry */
const instanceRegistry = new Map<string, ControllerInstance[]>();

import type { ControllerInstance } from '../types';

/**
 * Register a controller
 * @param name - Controller name
 * @param definition - Controller definition
 * @throws {Error} If controller already registered
 */
export function registerController(
  name: string,
  definition: FyrControllerDefinition
): void {
  // Check for duplicates
  if (controllerRegistry.has(name)) {
    throw new Error(`Fyr controller '${name}' is already registered`);
  }

  // Create and store controller
  const controller = createController(name, definition);
  controllerRegistry.set(name, controller);

  // Initialize instance registry
  if (!instanceRegistry.has(name)) {
    instanceRegistry.set(name, []);
  }
}

/**
 * Get a controller by name
 * @param name - Controller name
 * @returns Controller or undefined
 */
export function getController(name: string): FyrController | undefined {
  return controllerRegistry.get(name);
}

/**
 * Check if a controller exists
 * @param name - Controller name
 * @returns True if exists
 */
export function hasController(name: string): boolean {
  return controllerRegistry.has(name);
}

/**
 * Get all registered controllers
 * @returns Array of controller names
 */
export function getControllerNames(): string[] {
  return Array.from(controllerRegistry.keys());
}

/**
 * Get all controller definitions
 * @returns Array of controllers
 */
export function getAllControllers(): FyrController[] {
  return Array.from(controllerRegistry.values());
}

/**
 * Register a controller instance
 * @param name - Controller name
 * @param instance - Controller instance
 */
export function registerInstance(
  name: string,
  instance: ControllerInstance
): void {
  if (!instanceRegistry.has(name)) {
    instanceRegistry.set(name, []);
  }
  instanceRegistry.get(name)!.push(instance);
}

/**
 * Get all instances of a controller
 * @param name - Controller name
 * @returns Array of instances
 */
export function getInstances(name: string): ControllerInstance[] {
  return instanceRegistry.get(name) || [];
}

/**
 * Get all controller instances
 * @returns Array of all instances
 */
export function getAllInstances(): ControllerInstance[] {
  const all: ControllerInstance[] = [];
  for (const instances of instanceRegistry.values()) {
    all.push(...instances);
  }
  return all;
}

/**
 * Remove a controller instance
 * @param name - Controller name
 * @param instance - Controller instance to remove
 */
export function unregisterInstance(
  name: string,
  instance: ControllerInstance
): void {
  const instances = instanceRegistry.get(name);
  if (instances) {
    const index = instances.indexOf(instance);
    if (index !== -1) {
      instances.splice(index, 1);
    }
    if (instances.length === 0) {
      instanceRegistry.delete(name);
    }
  }
}

/**
 * Unregister all instances of a controller
 * @param name - Controller name
 */
export function unregisterAllInstances(name: string): void {
  instanceRegistry.delete(name);
}

/**
 * Clear all controllers (for testing)
 */
export function clearControllerRegistry(): void {
  controllerRegistry.clear();
  instanceRegistry.clear();
}

/**
 * Check if a controller has any instances
 * @param name - Controller name
 * @returns True if has instances
 */
export function hasInstances(name: string): boolean {
  const instances = instanceRegistry.get(name);
  return instances !== undefined && instances.length > 0;
}

/**
 * Get the number of instances for a controller
 * @param name - Controller name
 * @returns Number of instances
 */
export function getInstanceCount(name: string): number {
  const instances = instanceRegistry.get(name);
  return instances ? instances.length : 0;
}