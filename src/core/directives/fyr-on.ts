/**
 * fyr-on Directive
 * Handles any DOM event
 */

import type { DirectiveHandler, DirectiveContext } from './types';
import { evaluateExpression } from '../compiler/expression-evaluator';
import { registerCleanup } from '../compiler/cleanup';

/**
 * fyr-on directive handler
 * Handles any DOM event (fyr-on:eventname)
 */
export const fyrOnDirective: DirectiveHandler = (
  element: HTMLElement,
  expression: string,
  context: DirectiveContext
): void => {
  // The event name comes from the attribute
  // Example: fyr-on:input -> eventName = "input"
  // We need to determine the event name from the context
  // This handler is called with the full attribute name
  // The event name is extracted from the attribute

  // Get the event name from the attribute
  let eventName = '';

  // Check if we have the full attribute name
  // We need to look at the element's attributes
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    if (attr.name.startsWith('fyr-on:')) {
      eventName = attr.name.slice(7); // Remove 'fyr-on:'
      // Store for later use
      (element as any).__fyrOnEventName = eventName;
      break;
    }
  }

  // If no event name found, try to get it from stored data
  if (!eventName) {
    eventName = (element as any).__fyrOnEventName || 'click';
  }

  // Skip if already bound
  const boundKey = `__fyrOnBound_${eventName}`;
  if ((element as any)[boundKey]) {
    return;
  }
  (element as any)[boundKey] = true;

  // Parse modifiers (e.g., fyr-on:click.prevent)
  const [cleanEvent, ...modifiers] = eventName.split('.');

  // Create event handler
  const handler = async (event: Event): Promise<void> => {
    try {
      // Apply modifiers
      if (modifiers.includes('prevent')) {
        event.preventDefault();
      }
      if (modifiers.includes('stop')) {
        event.stopPropagation();
      }
      if (modifiers.includes('self') && event.target !== element) {
        return;
      }

      // Add $event to context
      const result = evaluateExpression(expression, context, { $event: event });

      // Handle promises
      if (result instanceof Promise) {
        await result;
      }

      // Handle once modifier
      if (modifiers.includes('once')) {
        element.removeEventListener(cleanEvent, handler);
        (element as any)[boundKey] = false;
      }
    } catch (error) {
      console.error(`fyr-on:${cleanEvent} error:`, error);
    }
  };

  // Add event listener
  element.addEventListener(cleanEvent, handler);

  // Register cleanup
  registerCleanup(element, () => {
    element.removeEventListener(cleanEvent, handler);
    (element as any)[boundKey] = false;
  });
};