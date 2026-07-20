/**
 * App Destruction
 * Cleans up and destroys a Fyr application
 */

import { appRegistry } from './app-registry';
import { cleanupEffect } from '../reactivity/effect';
import { cleanupEvents } from '../events/event-cleanup';

import type { FyrApp } from '../types';

/**
 * Destroy an application by name or instance
 * @param target - App name or app instance
 * @returns True if destroyed successfully
 */
export function destroyApp(target: string | FyrApp): boolean {
  let app: FyrApp | undefined;

  if (typeof target === 'string') {
    app = appRegistry.get(target);
    if (!app) {
      console.warn(`Fyr app '${target}' not found`);
      return false;
    }
  } else {
    app = target;
  }

  // Check if already destroyed
  if (app._isDestroyed) {
    console.warn(`Fyr app '${app.name}' is already destroyed`);
    return false;
  }

  // Call beforeDestroy hook
  if (app.beforeDestroy) {
    try {
      app.beforeDestroy();
    } catch (error) {
      console.error(`Fyr app '${app.name}' beforeDestroy hook error:`, error);
    }
  }

  // Clean up reactive effects
  if ((app as any)._renderEffect) {
    cleanupEffect((app as any)._renderEffect);
  }

  // Clean up event listeners
  if (app._rootElement) {
    cleanupEvents(app._rootElement);
  }

  // Clean up DOM
  if (app._rootElement) {
    // Remove fyr-specific attributes and data
    const elements = app._rootElement.querySelectorAll('[fyr-*]');
    for (const el of elements) {
      // Remove any stored data
      delete (el as any).__fyrScope;
      delete (el as any).__fyrEvents;
      delete (el as any).__fyrNodes;
      delete (el as any).__fyrMarker;
      delete (el as any).__fyrModelBound;
    }
  }

  // Mark as destroyed
  app._isDestroyed = true;
  app._rootElement = null;

  // Remove from registry
  appRegistry.delete(app.name);

  // Call destroyed hook
  if (app.destroyed) {
    try {
      app.destroyed();
    } catch (error) {
      console.error(`Fyr app '${app.name}' destroyed hook error:`, error);
    }
  }

  // Dispatch destroy event
  const event = new CustomEvent('fyr-destroyed', {
    detail: { appName: app.name },
  });
  document.dispatchEvent(event);

  return true;
}

/**
 * Destroy all mounted apps
 */
export function destroyAllApps(): void {
  const apps = Array.from(appRegistry.values());
  for (const app of apps) {
    if (!app._isDestroyed) {
      destroyApp(app);
    }
  }
}
