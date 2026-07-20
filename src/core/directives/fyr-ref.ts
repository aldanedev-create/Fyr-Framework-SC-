/**
 * fyr-ref Directive
 * Stores a reference to a DOM element on the controller
 */

import type { DirectiveHandler, DirectiveContext } from './types';
import { registerCleanup } from '../compiler/cleanup';

/**
 * fyr-ref directive handler
 * Stores element reference on controller.$refs
 */
export const fyrRefDirective: DirectiveHandler = (
  element: HTMLElement,
  expression: string,
  context: DirectiveContext
): void => {
  const refName = expression.trim();

  if (!refName) {
    console.warn('fyr-ref requires a name');
    return;
  }

  // Get controller
  const controller = context.controller;
  if (!controller) {
    console.warn('fyr-ref must be used inside a controller');
    return;
  }

  // Initialize $refs if not exists
  if (!(controller as any).$refs) {
    (controller as any).$refs = {};
  }

  // Store reference
  (controller as any).$refs[refName] = element;

  // Register cleanup
  registerCleanup(element, () => {
    if ((controller as any).$refs && (controller as any).$refs[refName] === element) {
      delete (controller as any).$refs[refName];
    }
  });
};