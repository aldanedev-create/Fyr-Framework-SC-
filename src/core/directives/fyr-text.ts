/**
 * fyr-text Directive
 * Renders text content from state
 */

import type { DirectiveHandler, DirectiveContext } from './types';
import { evaluateExpression } from '../compiler/expression-evaluator';
import { createEffect } from '../reactivity/effect';
import { registerCleanup } from '../compiler/cleanup';

/**
 * fyr-text directive handler
 * Renders escaped text content
 */
export const fyrTextDirective: DirectiveHandler = (
  element: HTMLElement,
  expression: string,
  context: DirectiveContext
): void => {
  // Skip if already bound
  if ((element as any).__fyrTextBound) {
    return;
  }
  (element as any).__fyrTextBound = true;

  // Initial render
  const initialValue = evaluateExpression(expression, context);
  if (initialValue !== undefined && initialValue !== null) {
    element.textContent = String(initialValue);
  }

  // Create reactive effect
  const effect = createEffect(() => {
    const value = evaluateExpression(expression, context);
    const text = value !== undefined && value !== null ? String(value) : '';
    if (element.textContent !== text) {
      element.textContent = text;
    }
  });

  // Register cleanup
  registerCleanup(element, () => {
    (element as any).__fyrTextBound = false;
    // Effect cleanup is handled by the reactivity system
  });
};