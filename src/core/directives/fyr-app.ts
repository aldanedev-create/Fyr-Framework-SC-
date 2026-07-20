/**
 * fyr-app Directive
 * Marks the root element of a Fyr application
 */

import type { DirectiveHandler, DirectiveContext } from './types';

/**
 * fyr-app directive handler
 * Marks the element as the root of a Fyr app
 */
export const fyrAppDirective: DirectiveHandler = (
  element: HTMLElement,
  expression: string,
  context: DirectiveContext
): void => {
  // The app name is the expression value
  const appName = expression.trim() || 'default';

  // Store app name on element
  element.setAttribute('data-fyr-app', appName);
  (element as any).__fyrApp = appName;

  // Mark as mounted (will be handled by mount system)
  // The mount system will look for this marker
  if (!(element as any).__fyrMounted) {
    (element as any).__fyrMounted = false;
  }

  // Set up cleanup
  const cleanup = () => {
    delete (element as any).__fyrApp;
    delete (element as any).__fyrMounted;
  };

  // Register cleanup (will be called on destroy)
  if (typeof (element as any).__fyrCleanups === 'undefined') {
    (element as any).__fyrCleanups = [];
  }
  (element as any).__fyrCleanups.push(cleanup);
};