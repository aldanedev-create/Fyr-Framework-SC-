/**
 * Template Cloner
 * Clones and compiles template elements for fyr-for
 */

import { compileNode, updateNode } from './node-compiler';
import { scanDOM } from './dom-scanner';
import { evaluateExpression } from './expression-evaluator';

import type {
  DirectiveContext,
  DirectiveHandler,
  CompiledNode,
} from '../directives/types';
import type { ControllerInstance } from '../types';

/**
 * Clone a template with data
 * @param template - Template element
 * @param data - Data to bind to the template
 * @param context - Directive context
 * @param directives - Available directives
 * @returns Cloned and compiled content
 */
export function cloneTemplate(
  template: HTMLTemplateElement,
  data: Record<string, any>,
  context: DirectiveContext,
  directives: Map<string, DirectiveHandler>
): DocumentFragment {
  // Clone content
  const content = template.content.cloneNode(true) as DocumentFragment;

  // Create new context for this clone
  const cloneContext: DirectiveContext = {
    ...context,
    index: data.$index ?? 0,
    extra: data,
  };

  // Compile the cloned content
  scanDOM(content, cloneContext, directives);

  return content;
}

/**
 * Create a template renderer
 * @param template - Template element
 * @param context - Directive context
 * @param directives - Available directives
 * @returns Render function
 */
export function createTemplateRenderer(
  template: HTMLTemplateElement,
  context: DirectiveContext,
  directives: Map<string, DirectiveHandler>
): (data: any) => DocumentFragment {
  return (data: any) => {
    return cloneTemplate(template, data, context, directives);
  };
}

/**
 * Create a keyed template renderer (for efficient updates)
 * @param template - Template element
 * @param keyFn - Function to extract key from data
 * @param context - Directive context
 * @param directives - Available directives
 * @returns Keyed render function
 */
export function createKeyedTemplateRenderer<T>(
  template: HTMLTemplateElement,
  keyFn: (item: T) => string | number,
  context: DirectiveContext,
  directives: Map<string, DirectiveHandler>
): {
  render: (items: T[]) => DocumentFragment;
  update: (container: HTMLElement, items: T[]) => void;
} {
  const render = (items: T[]): DocumentFragment => {
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const key = keyFn(item);
      const data = { ...item, $index: i, $key: key };
      const clone = cloneTemplate(template, data, context, directives);
      fragment.appendChild(clone);
    }

    return fragment;
  };

  const update = (container: HTMLElement, items: T[]): void => {
    // Get existing items
    const existingItems = container.querySelectorAll('[data-fyr-key]');
    const existingMap = new Map<string | number, HTMLElement>();

    for (const el of existingItems) {
      const key = el.getAttribute('data-fyr-key');
      if (key) {
        existingMap.set(key, el as HTMLElement);
      }
    }

    // Render new items
    const fragment = render(items);

    // Clear container
    container.innerHTML = '';
    container.appendChild(fragment);
  };

  return { render, update };
}