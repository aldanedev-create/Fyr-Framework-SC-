/**
 * fyr-cloak Directive
 * Prevents flash of unstyled content
 */

import type { DirectiveHandler, DirectiveContext } from './types';
import { registerCleanup } from '../compiler/cleanup';

/**
 * fyr-cloak directive handler
 * Hides element until Fyr is ready
 */
export const fyrCloakDirective: DirectiveHandler = (
  element: HTMLElement,
  expression: string,
  context: DirectiveContext
): void => {
  // Skip if already processed
  if ((element as any).__fyrCloakDone) {
    return;
  }

  // Initially hide the element
  element.style.display = 'none';

  // Show on next tick (after compilation)
  queueMicrotask(() => {
    element.style.display = '';
    (element as any).__fyrCloakDone = true;
  });

  // Register cleanup
  registerCleanup(element, () => {
    element.style.display = '';
    (element as any).__fyrCloakDone = false;
  });
};