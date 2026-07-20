/**
 * fyr-model Directive
 * Two-way binding for form inputs
 */

import type { DirectiveHandler, DirectiveContext } from './types';
import { evaluateExpression } from '../compiler/expression-evaluator';
import { createEffect } from '../reactivity/effect';
import { registerCleanup } from '../compiler/cleanup';

/**
 * fyr-model directive handler
 * Two-way data binding for form inputs
 */
export const fyrModelDirective: DirectiveHandler = (
  element: HTMLElement,
  expression: string,
  context: DirectiveContext
): void => {
  // Skip if not a form element
  if (!isFormElement(element)) {
    console.warn('fyr-model should only be used on form elements');
    return;
  }

  // Skip if already bound
  if ((element as any).__fyrModelBound) {
    return;
  }
  (element as any).__fyrModelBound = true;

  const input = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

  // Get initial value from state
  const initialValue = evaluateExpression(expression, context);
  if (initialValue !== undefined) {
    setElementValue(input, initialValue);
  }

  // Listen for input changes (view -> model)
  const eventName = getEventName(input);
  const handler = createInputHandler(input, expression, context);
  input.addEventListener(eventName, handler);

  // Create reactive effect (model -> view)
  const effect = createEffect(() => {
    const value = evaluateExpression(expression, context);
    const currentValue = getElementValue(input);
    
    // Only update if different (avoid infinite loops)
    if (currentValue !== value) {
      setElementValue(input, value);
    }
  });

  // Register cleanup
  registerCleanup(element, () => {
    input.removeEventListener(eventName, handler);
    (element as any).__fyrModelBound = false;
  });
};

/**
 * Check if element is a form element
 */
function isFormElement(element: HTMLElement): boolean {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  );
}

/**
 * Get the appropriate event name for the element
 */
function getEventName(element: HTMLElement): string {
  if (element instanceof HTMLInputElement) {
    return element.type === 'checkbox' || element.type === 'radio' ? 'change' : 'input';
  }
  return 'input';
}

/**
 * Get the value from a form element
 */
function getElementValue(element: HTMLElement): any {
  if (element instanceof HTMLInputElement) {
    if (element.type === 'checkbox') {
      return element.checked;
    }
    if (element.type === 'radio') {
      return element.checked ? element.value : undefined;
    }
    return element.value;
  }
  if (element instanceof HTMLSelectElement) {
    return element.value;
  }
  if (element instanceof HTMLTextAreaElement) {
    return element.value;
  }
  return (element as any).value;
}

/**
 * Set the value on a form element
 */
function setElementValue(element: HTMLElement, value: any): void {
  if (element instanceof HTMLInputElement) {
    if (element.type === 'checkbox') {
      element.checked = Boolean(value);
      return;
    }
    if (element.type === 'radio') {
      element.checked = String(value) === element.value;
      return;
    }
    element.value = value !== undefined && value !== null ? String(value) : '';
    return;
  }
  if (element instanceof HTMLSelectElement) {
    element.value = value !== undefined && value !== null ? String(value) : '';
    return;
  }
  if (element instanceof HTMLTextAreaElement) {
    element.value = value !== undefined && value !== null ? String(value) : '';
    return;
  }
  (element as any).value = value;
}

/**
 * Create an input handler (view -> model)
 */
function createInputHandler(
  element: HTMLElement,
  expression: string,
  context: DirectiveContext
): (event: Event) => void {
  return (event: Event): void => {
    const value = getElementValue(element);
    
    // Update the state
    // We need to set the value on the scope
    const parts = expression.trim().split('.');
    if (parts.length === 1) {
      // Simple property
      if (context.controller) {
        context.controller.state[parts[0]] = value;
      }
    } else {
      // Nested path
      let target = context.controller?.state;
      if (!target) return;
      
      for (let i = 0; i < parts.length - 1; i++) {
        if (!target[parts[i]]) {
          target[parts[i]] = {};
        }
        target = target[parts[i]];
      }
      target[parts[parts.length - 1]] = value;
    }
  };
}