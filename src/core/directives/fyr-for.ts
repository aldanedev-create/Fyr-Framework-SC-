/**
 * fyr-for Directive
 * Repeats content for each item in a collection
 */

import type { DirectiveHandler, DirectiveContext } from './types';
import { evaluateExpression } from '../compiler/expression-evaluator';
import { createEffect } from '../reactivity/effect';
import { registerCleanup } from '../compiler/cleanup';
import { scanDOM } from '../compiler/dom-scanner';
import { getAllDirectives } from './registry';

/**
 * fyr-for directive handler
 * Renders a template for each item in a collection
 */
export const fyrForDirective: DirectiveHandler = (
  element: HTMLElement,
  expression: string,
  context: DirectiveContext
): void => {
  // fyr-for should be used with <template>
  if (!(element instanceof HTMLTemplateElement)) {
    console.warn('fyr-for should be used with <template> element');
    return;
  }

  // Skip if already bound
  if ((element as any).__fyrForBound) {
    return;
  }
  (element as any).__fyrForBound = true;

  // Parse the expression: "item in collection"
  const match = expression.match(/^\s*([A-Za-z_$][\w$]*)\s+in\s+(.+)$/);
  if (!match) {
    console.warn('Invalid fyr-for syntax. Expected: "item in collection"');
    return;
  }

  const [, itemName, collectionExpression] = match;

  // Get key expression if present
  const keyAttr = element.getAttribute('fyr-key');
  const hasKey = keyAttr !== null && keyAttr.trim() !== '';

  // Create placeholder
  const placeholder = document.createComment('fyr-for-placeholder');
  element.parentNode?.insertBefore(placeholder, element);

  const template = element as HTMLTemplateElement;

  // Track rendered items
  let renderedItems: Map<string | number, { element: HTMLElement; data: any }> = new Map();
  let currentItems: any[] = [];

  // Initial render
  const initialCollection = evaluateExpression(collectionExpression, context);
  if (Array.isArray(initialCollection)) {
    renderCollection(initialCollection);
  }

  // Create reactive effect
  const effect = createEffect(() => {
    const collection = evaluateExpression(collectionExpression, context);
    if (Array.isArray(collection)) {
      renderCollection(collection);
    } else {
      // Clear if not an array
      clearRenderedItems();
      currentItems = [];
    }
  });

  /**
   * Render a collection of items
   */
  function renderCollection(items: any[]): void {
    // Store current items
    currentItems = items;

    // If items are empty, clear and return
    if (items.length === 0) {
      clearRenderedItems();
      return;
    }

    // If we have keys, use keyed reconciliation
    if (hasKey) {
      renderKeyed(items);
    } else {
      renderSimple(items);
    }
  }

  /**
   * Simple rendering (no keys)
   */
  function renderSimple(items: any[]): void {
    // Clear existing
    clearRenderedItems();

    // Render each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const clone = cloneTemplateForItem(item, i);
      
      // Insert before placeholder
      placeholder.parentNode?.insertBefore(clone, placeholder);
      
      // Store reference
      renderedItems.set(i, {
        element: clone as HTMLElement,
        data: item,
      });
    }
  }

  /**
   * Keyed rendering (with keys)
   */
  function renderKeyed(items: any[]): void {
    // Get keys for all items
    const newKeys = items.map((item, index) => {
      const keyContext = { ...context, extra: { [itemName]: item, $index: index } };
      const key = evaluateExpression(keyAttr!, keyContext);
      return String(key);
    });

    // Find items to remove
    const toRemove: string[] = [];
    for (const [key] of renderedItems) {
      if (!newKeys.includes(String(key))) {
        toRemove.push(String(key));
      }
    }

    // Remove items not in new list
    for (const key of toRemove) {
      const rendered = renderedItems.get(key);
      if (rendered) {
        rendered.element.remove();
        renderedItems.delete(key);
      }
    }

    // Render or update items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const key = newKeys[i];
      const rendered = renderedItems.get(key);

      if (rendered) {
        // Update existing item
        // Update the data in the scope
        const scope = (rendered.element as any).__fyrScope;
        if (scope) {
          scope[itemName] = item;
          scope.$index = i;
        }
        // Re-render the element
        const directives = getAllDirectives();
        const cloneContext: DirectiveContext = {
          ...context,
          controller: context.controller,
          extra: { [itemName]: item, $index: i },
        };
        scanDOM(rendered.element, cloneContext, directives);
        // Update stored data
        rendered.data = item;
      } else {
        // Create new item
        const clone = cloneTemplateForItem(item, i);
        
        // Find position to insert
        // Insert before placeholder or before next item
        let insertBefore: Node = placeholder;
        for (const [otherKey, otherRendered] of renderedItems) {
          const otherIndex = newKeys.indexOf(String(otherKey));
          if (otherIndex > i) {
            insertBefore = otherRendered.element;
            break;
          }
        }
        
        insertBefore.parentNode?.insertBefore(clone, insertBefore);
        renderedItems.set(key, {
          element: clone as HTMLElement,
          data: item,
        });
      }
    }
  }

  /**
   * Clone template for a single item
   */
  function cloneTemplateForItem(item: any, index: number): Node {
    const clone = template.content.cloneNode(true) as DocumentFragment;

    // Create context for this item
    const cloneContext: DirectiveContext = {
      ...context,
      index,
      extra: {
        [itemName]: item,
        $index: index,
      },
    };

    // Compile the clone
    const directives = getAllDirectives();
    scanDOM(clone, cloneContext, directives);

    // Get the first element (the actual rendered item). `firstChild` can be
    // a whitespace text node when the template is formatted across lines.
    const firstChild = clone.firstElementChild;
    if (!firstChild) {
      const fallback = document.createElement('div');
      fallback.textContent = 'Empty template';
      return fallback;
    }

    // Store scope on element for updates
    if (firstChild instanceof HTMLElement) {
      (firstChild as any).__fyrScope = cloneContext.extra;
      if (hasKey) {
        const key = evaluateExpression(keyAttr!, cloneContext);
        firstChild.setAttribute('data-fyr-key', String(key));
      }
    }

    return firstChild;
  }

  /**
   * Clear all rendered items
   */
  function clearRenderedItems(): void {
    for (const [key, rendered] of renderedItems) {
      rendered.element.remove();
    }
    renderedItems.clear();
  }

  // Register cleanup
  registerCleanup(element, () => {
    clearRenderedItems();
    placeholder.remove();
    (element as any).__fyrForBound = false;
  });
};
