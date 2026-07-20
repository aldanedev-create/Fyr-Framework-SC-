/**
 * fyr-submit Directive
 * Handles form submission
 */

import type { DirectiveHandler, DirectiveContext } from './types';
import { evaluateExpression } from '../compiler/expression-evaluator';
import { registerCleanup } from '../compiler/cleanup';

/**
 * fyr-submit directive handler
 * Intercepts form submission and runs expression
 */
export const fyrSubmitDirective: DirectiveHandler = (
  element: HTMLElement,
  expression: string,
  context: DirectiveContext
): void => {
  // Should be used on form elements
  if (!(element instanceof HTMLFormElement)) {
    console.warn('fyr-submit should be used on <form> elements');
    return;
  }

  // Skip if already bound
  if ((element as any).__fyrSubmitBound) {
    return;
  }
  (element as any).__fyrSubmitBound = true;

  // Create submit handler
  const handler = async (event: SubmitEvent): Promise<void> => {
    // Prevent default form submission
    event.preventDefault();

    try {
      // Add $event to context
      const result = evaluateExpression(expression, context, { $event: event });

      // Handle promises
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      console.error('fyr-submit error:', error);
      // Show notification if available
      if (context.controller && (context.controller as any).$notify) {
        (context.controller as any).$notify(
          error instanceof Error ? error.message : 'Form submission failed',
          'danger'
        );
      }
    }
  };

  // Add event listener
  element.addEventListener('submit', handler);

  // Register cleanup
  registerCleanup(element, () => {
    element.removeEventListener('submit', handler);
    (element as any).__fyrSubmitBound = false;
  });
};