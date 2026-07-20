/**
 * fyr-if Directive
 * Conditionally renders content
 */

import type { DirectiveHandler, DirectiveContext } from './types';
import { evaluateExpression } from '../compiler/expression-evaluator';
import { createEffect } from '../reactivity/effect';
import { registerCleanup } from '../compiler/cleanup';
import { scanDOM } from '../compiler/dom-scanner';
import { getDirective } from './registry';

/**
 * fyr-if directive handler
 * Adds/removes element from DOM based on expression
 */
export const fyrIfDirective: DirectiveHandler = (
  element: HTMLElement,
  expression: string,
  context: DirectiveContext
): void => {
  // fyr-if should be used with <template>
  if (!(element instanceof HTMLTemplateElement)) {
    console.warn('fyr-if should be used with <template> element');
  }

  // Skip if already bound
  if ((element as any).__fyrIfBound) {
    return;
  }
  (element as any).__fyrIfBound = true;

  // Create placeholder comment for tracking
  const placeholder = document.createComment('fyr-if-placeholder');
  element.parentNode?.insertBefore(placeholder, element);

  // Store the template content
  const template = element as HTMLTemplateElement;
  const content = template.content.cloneNode(true) as DocumentFragment;

  // Track rendered content
  let renderedFragment: DocumentFragment | null = null;
  let renderedElements: HTMLElement[] = [];

  // Get directives for child compilation
  const directives = new Map<string, any>();
  // We'll use the global directive registry

  // Initial render
  const initialValue = evaluateExpression(expression, context);
  if (Boolean(initialValue)) {
    renderContent();
  } else {
    removeContent();
  }

  // Create reactive effect
  const effect = createEffect(() => {
    const value = evaluateExpression(expression, context);
    const shouldShow = Boolean(value);

    if (shouldShow) {
      renderContent();
    } else {
      removeContent();
    }
  });

  /**
   * Render the template content
   */
  function renderContent(): void {
    if (renderedFragment) return;

    // Clone the template content
    const clone = template.content.cloneNode(true) as DocumentFragment;

    // Compile the clone with the current context
    const cloneContext: DirectiveContext = {
      ...context,
    };

    // Scan and compile the clone
    const allDirectives = getAllDirectives();
    scanDOM(clone, cloneContext, allDirectives);

    // Insert after placeholder
    placeholder.parentNode?.insertBefore(clone, placeholder.nextSibling);

    // Store references
    renderedFragment = clone;
    
    // Collect all elements in the fragment
    const elements: HTMLElement[] = [];
    const walker = document.createTreeWalker(clone, NodeFilter.SHOW_ELEMENT);
    let node = walker.nextNode();
    while (node) {
      elements.push(node as HTMLElement);
      node = walker.nextNode();
    }
    renderedElements = elements;
  }

  /**
   * Remove the rendered content
   */
  function removeContent(): void {
    if (!renderedFragment) return;

    // Remove all elements
    for (const el of renderedElements) {
      el.remove();
    }
    renderedElements = [];

    // Remove the fragment
    const childNodes = Array.from(renderedFragment.childNodes);
    for (const child of childNodes) {
      child.remove();
    }
    renderedFragment = null;
  }

  // Register cleanup
  registerCleanup(element, () => {
    removeContent();
    placeholder.remove();
    (element as any).__fyrIfBound = false;
  });
};

// Helper to get all directives (circular dependency resolved at runtime)
function getAllDirectives(): Map<string, any> {
  // Import dynamically to avoid circular dependency
  return require('./registry').getAllDirectives();
}