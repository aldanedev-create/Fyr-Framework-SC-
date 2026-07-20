/**
 * fyr-html Directive
 * Renders raw HTML content (use with caution!)
 * 
 * ⚠️ SECURITY WARNING: Only use with trusted content!
 * Never use with user input without sanitization.
 */

import type { DirectiveHandler, DirectiveContext } from './types';
import { evaluateExpression } from '../compiler/expression-evaluator';
import { createEffect } from '../reactivity/effect';
import { registerCleanup } from '../compiler/cleanup';

/**
 * fyr-html directive handler
 * Renders raw HTML (trusted content only!)
 */
export const fyrHtmlDirective: DirectiveHandler = (
  element: HTMLElement,
  expression: string,
  context: DirectiveContext
): void => {
  // Skip if already bound
  if ((element as any).__fyrHtmlBound) {
    return;
  }
  (element as any).__fyrHtmlBound = true;

  // Check if content is trusted (warning in development)
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    console.warn(
      'fyr-html renders raw HTML. Only use with trusted content. ' +
      'Never use with user input without sanitization.'
    );
  }

  // Initial render
  const initialValue = evaluateExpression(expression, context);
  if (initialValue !== undefined && initialValue !== null) {
    element.innerHTML = String(initialValue);
  }

  // Create reactive effect
  const effect = createEffect(() => {
    const value = evaluateExpression(expression, context);
    const html = value !== undefined && value !== null ? String(value) : '';
    if (element.innerHTML !== html) {
      element.innerHTML = html;
    }
  });

  // Register cleanup
  registerCleanup(element, () => {
    (element as any).__fyrHtmlBound = false;
  });
};
