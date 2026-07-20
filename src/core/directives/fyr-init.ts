/**
 * fyr-init Directive
 * Runs code when the element is initialized
 */

import type { DirectiveHandler, DirectiveContext } from './types';
import { evaluateExpression } from '../compiler/expression-evaluator';
import { registerCleanup } from '../compiler/cleanup';

/**
 * fyr-init directive handler
 * Runs expression once when the element mounts
 */
export const fyrInitDirective: DirectiveHandler = (
  element: HTMLElement,
  expression: string,
  context: DirectiveContext
): void => {
  // Skip if already initialized
  if ((element as any).__fyrInitDone) {
    return;
  }
  (element as any).__fyrInitDone = true;

  // Run the expression
  try {
    const result = evaluateExpression(expression, context);
    if (result instanceof Promise) {
      result.catch((error) => {
        console.error('fyr-init error:', error);
      });
    }
  } catch (error) {
    console.error('fyr-init error:', error);
  }

  // No cleanup needed, but mark for cleanup
  registerCleanup(element, () => {
    (element as any).__fyrInitDone = false;
  });
};