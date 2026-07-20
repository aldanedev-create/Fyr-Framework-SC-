/**
 * App Registry
 * Central registry for all Fyr applications
 */

import type { FyrApp } from '../types';

/** Internal app registry map */
const appRegistry = new Map<string, FyrApp>();

/**
 * Get an application by name
 * @param name - Application name
 * @returns App instance or undefined
 */
export function getApp(name: string): FyrApp | undefined {
  return appRegistry.get(name);
}

/**
 * Check if an application exists
 * @param name - Application name
 * @returns True if exists
 */
export function hasApp(name: string): boolean {
  return appRegistry.has(name);
}

/**
 * Get all registered applications
 * @returns Array of app instances
 */
export function getAllApps(): FyrApp[] {
  return Array.from(appRegistry.values());
}

/**
 * Get all mounted applications
 * @returns Array of mounted app instances
 */
export function getMountedApps(): FyrApp[] {
  return Array.from(appRegistry.values()).filter((app) => app._isMounted);
}

/**
 * Get all destroyed applications
 * @returns Array of destroyed app instances
 */
export function getDestroyedApps(): FyrApp[] {
  return Array.from(appRegistry.values()).filter((app) => app._isDestroyed);
}

/**
 * Clear all applications (for testing)
 */
export function clearAppRegistry(): void {
  appRegistry.clear();
}

// Export the registry map for internal use
export { appRegistry };