/**
 * DOM Scanner
 * Scans DOM for Fyr directives and compiles them
 */

import type { DirectiveHandler, DirectiveContext, FyrDirective } from '../directives/types';
import type { ControllerInstance } from '../types';

/** Cached compiled nodes */
const compiledCache = new WeakMap<Node, boolean>();

/**
 * Scan and compile a DOM tree
 * @param root - Root element to scan
 * @param context - Directive context
 * @param directives - Available directives
 * @param depth - Current depth (for recursion limit)
 */
export function scanDOM(
  root: Node,
  context: DirectiveContext,
  directives: Map<string, DirectiveHandler>,
  depth: number = 0
): void {
  // Protect against infinite recursion
  if (depth > 1000) {
    console.warn('DOM scanner depth limit reached, possible infinite loop');
    return;
  }

  // Skip if already compiled
  if (compiledCache.has(root)) {
    return;
  }

  // Get all elements
  const elements: Element[] = [];

  if (root instanceof Document) {
    // Scan entire document
    const allElements = root.querySelectorAll('*');
    for (let i = 0; i < allElements.length; i++) {
      elements.push(allElements[i]);
    }
  } else if (root instanceof Element) {
    // Scan element and children
    elements.push(root);
    const children = root.querySelectorAll('*');
    for (let i = 0; i < children.length; i++) {
      elements.push(children[i]);
    }
  } else if (root instanceof DocumentFragment) {
    // Scan fragment children
    const children = root.querySelectorAll('*');
    for (let i = 0; i < children.length; i++) {
      elements.push(children[i]);
    }
  }

  // Process each element
  for (const element of elements) {
    if (element instanceof HTMLElement) {
      compileElement(element, context, directives, depth + 1);
    }
  }

  // Mark as compiled
  if (root instanceof Element || root instanceof Document || root instanceof DocumentFragment) {
    compiledCache.set(root as any, true);
  }
}

/**
 * Compile a single element
 * @param element - Element to compile
 * @param context - Directive context
 * @param directives - Available directives
 * @param depth - Current depth
 */
function compileElement(
  element: HTMLElement,
  context: DirectiveContext,
  directives: Map<string, DirectiveHandler>,
  depth: number
): void {
  // Skip if already compiled
  if (compiledCache.has(element)) {
    return;
  }

  // Check for fyr-controller
  if (element.hasAttribute('fyr-controller')) {
    const controllerName = element.getAttribute('fyr-controller')!;
    // Controller will be handled by the mounting system
    // Just mark as compiled
    compiledCache.set(element, true);
    return;
  }

  // Process directives on this element
  const attributes = element.attributes;
  for (let i = 0; i < attributes.length; i++) {
    const attr = attributes[i];
    const name = attr.name;

    // Check if this is a Fyr directive
    if (name.startsWith('fyr-')) {
      const directiveName = name.slice(4); // Remove 'fyr-'
      const expression = attr.value;

      // Skip special directives handled elsewhere
      if (directiveName === 'controller' || directiveName === 'app') {
        continue;
      }

      // Find directive handler
      let handler = directives.get(directiveName);

      // Check for fyr-on:event pattern
      if (!handler && directiveName.startsWith('on:')) {
        handler = directives.get('on');
      }

      // Check for fyr-bind:attr pattern
      if (!handler && directiveName.startsWith('bind:')) {
        handler = directives.get('bind');
      }

      if (handler) {
        try {
          handler(element, expression, context);
        } catch (error) {
          console.error(`Directive '${directiveName}' error:`, error);
        }
      } else {
        // Unknown directive - warn in development
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Unknown Fyr directive: fyr-${directiveName}`);
        }
      }
    }
  }

  // Handle special template elements
  if (element instanceof HTMLTemplateElement) {
    // Compile template content later when used
    compiledCache.set(element, true);
    return;
  }

  // Check for fyr-for on non-template elements (deprecated but supported)
  if (element.hasAttribute('fyr-for') && !(element instanceof HTMLTemplateElement)) {
    // fyr-for should be on template elements for proper behavior
    console.warn('fyr-for should be used on <template> elements');
  }

  // Mark as compiled
  compiledCache.set(element, true);

  // Scan children (if not already scanned)
  const children = element.children;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child instanceof HTMLElement && !compiledCache.has(child)) {
      compileElement(child, context, directives, depth + 1);
    }
  }
}

/**
 * Rescan an element for new directives (for dynamic content)
 * @param element - Element to rescan
 * @param context - Directive context
 * @param directives - Available directives
 */
export function rescanElement(
  element: HTMLElement,
  context: DirectiveContext,
  directives: Map<string, DirectiveHandler>
): void {
  // Clear cache for this element
  compiledCache.delete(element);

  // Rescan
  compileElement(element, context, directives, 0);
}

/**
 * Check if an element has been compiled
 * @param element - Element to check
 * @returns True if compiled
 */
export function isCompiled(element: Node): boolean {
  return compiledCache.has(element);
}

/**
 * Clear compilation cache (for testing)
 */
export function clearCompilationCache(): void {
  // WeakMap cannot be cleared, but we can create a new one
  // This is only for testing
  (compiledCache as any).clear?.();
}