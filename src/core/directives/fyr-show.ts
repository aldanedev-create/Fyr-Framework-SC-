/**
 * fyr-show Directive
 * Toggles element visibility
 */

import type { DirectiveHandler, DirectiveContext } from './types';
import { evaluateExpression } from '../compiler/expression-evaluator';
import { createEffect } from '../reactivity/effect';
import { registerCleanup } from '../compiler/cleanup';

/**
 * fyr-show directive handler
 * Shows/hides element based on expression
 */
export const fyrShowDirective: DirectiveHandler = (
  element: HTMLElement,
  expression: string,
  context: DirectiveContext
): void => {
  // Skip if already bound
  if ((element as any).__fyrShowBound) {
    return;
  }
  (element as any).__fyrShowBound = true;

  // Store original display style
  const originalDisplay = element.style.display || getComputedStyle(element).display;

  // Initial render
  const initialValue = evaluateExpression(expression, context);
  element.hidden = !Boolean(initialValue);

  // Create reactive effect
  const effect = createEffect(() => {
    const value = evaluateExpression(expression, context);
    const shouldShow = Boolean(value);
    
    if (shouldShow) {
      element.hidden = false;
      // Restore display if it was hidden
      if (element.style.display === 'none') {
        element.style.display = originalDisplay || '';
      }
    } else {
      element.hidden = true;
      // Optionally hide with display:none for better performance
      // element.style.display = 'none';
    }
  });

  // Register cleanup
  registerCleanup(element, () => {
    (element as any).__fyrShowBound = false;
    element.hidden = false;
  });
};