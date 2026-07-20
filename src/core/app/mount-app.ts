/**
 * App Mounting
 * Mounts a Fyr application to the DOM
 */

import { appRegistry } from './app-registry';
import { renderTree } from '../compiler/renderer';
import { compileTemplate } from '../compiler/template-compiler';
import { createEffect } from '../reactivity/effect';
import { scheduleRender } from '../reactivity/scheduler';
import { getElement } from '../utilities/dom-utils';

import type { FyrApp, FyrController } from '../types';

/**
 * Mount an application by name or element
 * @param target - App name, DOM element, or selector
 * @returns The mounted app instance
 */
export function mountApp(target: string | HTMLElement | Document): FyrApp | null {
  // If target is a string, try to find by app name
  if (typeof target === 'string') {
    const app = appRegistry.get(target);
    if (app) {
      return mountAppInstance(app);
    }

    // If not found, try as selector
    const element = getElement(target);
    if (element) {
      // Auto-detect app from element
      const appName = element.getAttribute('fyr-app');
      if (appName) {
        const foundApp = appRegistry.get(appName);
        if (foundApp) {
          return mountAppInstance(foundApp);
        }
      }
    }

    console.error(`Fyr app '${target}' not found`);
    return null;
  }

  // If target is a document or element, scan for apps
  return mountAppsIn(target);
}

/**
 * Mount all applications found in a container
 * @param container - DOM container (document or element)
 * @returns The last mounted app
 */
function mountAppsIn(container: Document | HTMLElement): FyrApp | null {
  let lastMounted: FyrApp | null = null;

  // Find all fyr-app elements
  const appElements = container.querySelectorAll('[fyr-app]');

  for (const element of appElements) {
    const appName = element.getAttribute('fyr-app');
    if (!appName) continue;

    const app = appRegistry.get(appName);
    if (app) {
      lastMounted = mountAppInstance(app);
    } else {
      console.warn(`Fyr app '${appName}' registered but no controller found`);
    }
  }

  return lastMounted;
}

/**
 * Mount a specific app instance
 * @param app - App instance
 * @returns The mounted app
 */
function mountAppInstance(app: FyrApp): FyrApp {
  // Prevent double mounting
  if (app._isMounted) {
    console.warn(`Fyr app '${app.name}' is already mounted`);
    return app;
  }

  // Find root element
  const root = getElement(app.el);
  if (!root) {
    console.error(`Fyr app '${app.name}' root element not found`);
    return app;
  }

  // Store root reference
  app._rootElement = root;
  app._isMounted = true;

  // Create render effect
  const renderEffect = createEffect(() => {
    if (!app._isDestroyed && app._rootElement) {
      // Compile and render the template
      renderTree(app._rootElement as HTMLElement, app.controller);
    }
  });

  // Store effect reference for cleanup
  (app as any)._renderEffect = renderEffect;

  // Run initial render
  renderEffect.run();

  // Call mounted lifecycle hook
  if (app.mounted) {
    Promise.resolve(app.mounted()).catch((error) => {
      console.error(`Fyr app '${app.name}' mounted hook error:`, error);
    });
  }

  // Dispatch mount event
  const event = new CustomEvent('fyr-mounted', {
    detail: { appName: app.name },
  });
  document.dispatchEvent(event);

  return app;
}

/**
 * Auto-start all apps on DOMContentLoaded
 */
export function autoStartApps(): void {
  if (typeof document === 'undefined') return;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      mountApp(document);
    });
  } else {
    // Already loaded - mount immediately
    queueMicrotask(() => {
      mountApp(document);
    });
  }
}