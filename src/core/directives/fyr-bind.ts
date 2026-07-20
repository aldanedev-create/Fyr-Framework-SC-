/**
 * fyr-bind Directive
 * Binds HTML attributes to state
 */

import type { DirectiveHandler, DirectiveContext } from './types';
import { evaluateExpression } from '../compiler/expression-evaluator';
import { createEffect } from '../reactivity/effect';
import { registerCleanup } from '../compiler/cleanup';

/**
 * fyr-bind directive handler
 * Binds an attribute to a reactive value
 * Usage: fyr-bind:attribute="expression"
 */
export const fyrBindDirective: DirectiveHandler = (
  element: HTMLElement,
  expression: string,
  context: DirectiveContext
): void => {
  // Get the attribute name from the directive
  // Example: fyr-bind:disabled -> attribute = "disabled"
  let attributeName = '';

  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    if (attr.name.startsWith('fyr-bind:')) {
      attributeName = attr.name.slice(10); // Remove 'fyr-bind:'
      break;
    }
  }

  // Skip if already bound
  const boundKey = `__fyrBindBound_${attributeName}`;
  if ((element as any)[boundKey]) {
    return;
  }
  (element as any)[boundKey] = true;

  // Initial render
  const initialValue = evaluateExpression(expression, context);
  setAttribute(element, attributeName, initialValue);

  // Create reactive effect
  const effect = createEffect(() => {
    const value = evaluateExpression(expression, context);
    setAttribute(element, attributeName, value);
  });

  // Register cleanup
  registerCleanup(element, () => {
    (element as any)[boundKey] = false;
  });
};

/**
 * Set an attribute on an element
 */
function setAttribute(element: HTMLElement, name: string, value: any): void {
  // Handle boolean attributes
  if (isBooleanAttribute(name)) {
    if (value) {
      element.setAttribute(name, '');
    } else {
      element.removeAttribute(name);
    }
    return;
  }

  // Handle null/undefined
  if (value === null || value === undefined) {
    element.removeAttribute(name);
    return;
  }

  // Set as string
  element.setAttribute(name, String(value));
}

/**
 * Check if an attribute is boolean
 */
function isBooleanAttribute(name: string): boolean {
  const booleanAttributes = [
    'disabled', 'readonly', 'required', 'checked',
    'selected', 'hidden', 'autofocus', 'multiple',
    'novalidate', 'open', 'async', 'defer',
  ];
  return booleanAttributes.includes(name);
}