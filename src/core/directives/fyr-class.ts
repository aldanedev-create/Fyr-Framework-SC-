/**
 * fyr-class Directive
 * Toggles CSS classes based on state
 */

import type { DirectiveHandler, DirectiveContext } from './types';
import { evaluateExpression } from '../compiler/expression-evaluator';
import { createEffect } from '../reactivity/effect';
import { registerCleanup } from '../compiler/cleanup';

/**
 * fyr-class directive handler
 * Toggles CSS classes based on an object or expression
 * Usage: fyr-class="{ active: isActive, 'text-danger': hasError }"
 *        fyr-class="isActive ? 'active' : 'inactive'"
 */
export const fyrClassDirective: DirectiveHandler = (
  element: HTMLElement,
  expression: string,
  context: DirectiveContext
): void => {
  // Skip if already bound
  if ((element as any).__fyrClassBound) {
    return;
  }
  (element as any).__fyrClassBound = true;

  // Initial render
  updateClasses(element, expression, context);

  // Create reactive effect
  const effect = createEffect(() => {
    updateClasses(element, expression, context);
  });

  // Register cleanup
  registerCleanup(element, () => {
    (element as any).__fyrClassBound = false;
  });
};

/**
 * Update classes on an element
 */
function updateClasses(element: HTMLElement, expression: string, context: DirectiveContext): void {
  const value = evaluateExpression(expression, context);

  // Handle string: "active inactive"
  if (typeof value === 'string') {
    element.className = value;
    return;
  }

  // Handle object: { active: true, 'text-danger': false }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [className, shouldAdd] of Object.entries(value)) {
      if (shouldAdd) {
        element.classList.add(className);
      } else {
        element.classList.remove(className);
      }
    }
    return;
  }

  // Handle array: ['active', 'inactive']
  if (Array.isArray(value)) {
    element.className = value.join(' ');
    return;
  }

  // If expression returns a string from ternary: isActive ? 'active' : 'inactive'
  if (typeof value === 'string') {
    // Already handled above
  }
}