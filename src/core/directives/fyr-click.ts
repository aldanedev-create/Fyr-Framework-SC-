/**
 * fyr-click Directive
 * Handles click events
 */

import type { DirectiveHandler, DirectiveContext } from './types';
import { evaluateExpression } from '../compiler/expression-evaluator';
import { registerCleanup } from '../compiler/cleanup';

/**
 * fyr-click directive handler
 * Executes expression on click
 */
export const fyrClickDirective: DirectiveHandler = (
  element: HTMLElement,
  expression: string,
  context: DirectiveContext
): void => {
  // Skip if already bound
  if ((element as any).__fyrClickBound) {
    return;
  }
  (element as any).__fyrClickBound = true;

  // Create click handler
  const handler = async (event: MouseEvent): Promise<void> => {
    try {
      // Add $event to context
      const result = evaluateExpression(expression, context, { $event: event });
      
      // Handle promises
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      console.error('fyr-click error:', error);
      // Show notification if available
      if (context.controller && (context.controller as any).$notify) {
        (context.controller as any).$notify(
          error instanceof Error ? error.message : 'Action failed',
          'danger'
        );
      }
    }
  };

  // Add event listener
  element.addEventListener('click', handler);

  // Register cleanup
  registerCleanup(element, () => {
    element.removeEventListener('click', handler);
    (element as any).__fyrClickBound = false;
  });
};