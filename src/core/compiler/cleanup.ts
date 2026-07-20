/**
 * Cleanup
 * Cleans up compiled nodes and removes event listeners
 */

import type { CompiledNode, DirectiveContext } from '../directives/types';

/** Cleanup registry */
const cleanupRegistry = new WeakMap<Element, Array<() => void>>();

/**
 * Register a cleanup function for an element
 * @param element - Element to clean up
 * @param cleanupFn - Cleanup function
 */
export function registerCleanup(
  element: Element,
  cleanupFn: () => void
): void {
  if (!cleanupRegistry.has(element)) {
    cleanupRegistry.set(element, []);
  }
  cleanupRegistry.get(element)!.push(cleanupFn);
}

/**
 * Clean up an element
 * @param element - Element to clean up
 */
export function cleanupElement(element: Element): void {
  const cleanups = cleanupRegistry.get(element);
  if (cleanups) {
    for (const fn of cleanups) {
      try {
        fn();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }
    cleanupRegistry.delete(element);
  }

  // Clean up children
  const children = element.querySelectorAll('*');
  for (const child of children) {
    cleanupElement(child);
  }
}

/**
 * Clean up a compiled node
 * @param compiled - Compiled node
 */
export function cleanupCompiledNode(compiled: CompiledNode): void {
  // Clean up element
  if (compiled.node instanceof Element) {
    cleanupElement(compiled.node);
  }

  // Clean up children
  if (compiled.children) {
    for (const child of compiled.children) {
      cleanupCompiledNode(child);
    }
  }
}

/**
 * Clean up DOM with event listeners
 * @param element - Element to clean up
 */
export function cleanupDOM(element: Element): void {
  cleanupElement(element);
}

/**
 * Clean up all elements with Fyr data
 * @param root - Root element
 */
export function cleanupFyrElements(root: Element | Document): void {
  const elements = root.querySelectorAll('[fyr-*]');
  for (const el of elements) {
    cleanupElement(el);
    // Remove fyr attributes
    const attrs = el.getAttributeNames();
    for (const attr of attrs) {
      if (attr.startsWith('fyr-')) {
        el.removeAttribute(attr);
      }
    }
    // Remove stored data
    delete (el as any).__fyrScope;
    delete (el as any).__fyrEvents;
    delete (el as any).__fyrNodes;
    delete (el as any).__fyrMarker;
    delete (el as any).__fyrModelBound;
  }
}

/**
 * Clean up MutationObserver if used
 * @param observer - MutationObserver to disconnect
 */
export function cleanupObserver(observer: MutationObserver): void {
  if (observer) {
    observer.disconnect();
  }
}
