/**
 * fyr-style Directive
 * Binds inline CSS styles to state
 */

import type { DirectiveHandler, DirectiveContext } from './types';
import { evaluateExpression } from '../compiler/expression-evaluator';
import { createEffect } from '../reactivity/effect';
import { registerCleanup } from '../compiler/cleanup';

/**
 * fyr-style directive handler
 * Binds inline styles to reactive state
 * Usage: fyr-style="{ color: textColor, fontSize: size + 'px' }"
 */
export const fyrStyleDirective: DirectiveHandler = (
  element: HTMLElement,
  expression: string,
  context: DirectiveContext
): void => {
  // Skip if already bound
  if ((element as any).__fyrStyleBound) {
    return;
  }
  (element as any).__fyrStyleBound = true;

  // Initial render
  updateStyles(element, expression, context);

  // Create reactive effect
  const effect = createEffect(() => {
    updateStyles(element, expression, context);
  });

  // Register cleanup
  registerCleanup(element, () => {
    (element as any).__fyrStyleBound = false;
  });
};

/**
 * Update styles on an element
 */
function updateStyles(element: HTMLElement, expression: string, context: DirectiveContext): void {
  const value = evaluateExpression(expression, context);

  if (!value || typeof value !== 'object') {
    return;
  }

  // Apply each style
  for (const [property, val] of Object.entries(value)) {
    const cleanProperty = property.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
    if (val !== undefined && val !== null) {
      element.style.setProperty(cleanProperty, String(val));
    } else {
      element.style.removeProperty(cleanProperty);
    }
  }
}