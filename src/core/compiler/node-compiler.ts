/**
 * Node Compiler
 * Compiles individual DOM nodes with directives
 */

import { scanDOM, rescanElement, isCompiled } from './dom-scanner';
import { parseDirectives, parseExpression } from './directive-parser';
import { evaluateExpression } from './expression-evaluator';

import type {
  DirectiveContext,
  DirectiveHandler,
  CompiledNode,
  CompiledDirective,
} from '../directives/types';
import type { ControllerInstance } from '../types';

/** Compiled node registry */
const compiledNodes = new WeakMap<Node, CompiledNode>();

/**
 * Compile a node
 * @param node - Node to compile
 * @param context - Directive context
 * @param directives - Available directives
 * @returns Compiled node data
 */
export function compileNode(
  node: Node,
  context: DirectiveContext,
  directives: Map<string, DirectiveHandler>
): CompiledNode | null {
  // Skip text nodes (handled by directives)
  if (node.nodeType === Node.TEXT_NODE) {
    return null;
  }

  // Skip non-element nodes
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const element = node as HTMLElement;

  // Check if already compiled
  if (compiledNodes.has(element)) {
    return compiledNodes.get(element)!;
  }

  // Check for fyr-controller
  if (element.hasAttribute('fyr-controller')) {
    const compiled: CompiledNode = {
      node: element,
      directives: [],
      isController: true,
      controllerName: element.getAttribute('fyr-controller')!,
    };
    compiledNodes.set(element, compiled);
    return compiled;
  }

  // Parse directives from attributes
  const directivesData: CompiledDirective[] = [];
  const attributes = element.attributes;

  for (let i = 0; i < attributes.length; i++) {
    const attr = attributes[i];
    const name = attr.name;

    if (name.startsWith('fyr-')) {
      const directiveName = name.slice(4);
      const expression = attr.value;

      // Skip special directives
      if (directiveName === 'controller' || directiveName === 'app') {
        continue;
      }

      // Parse expression
      const parsed = parseExpression(expression, context);

      directivesData.push({
        name: directiveName,
        expression: expression,
        parsed: parsed,
        attribute: attr,
      });
    }
  }

  // Create compiled node
  const compiled: CompiledNode = {
    node: element,
    directives: directivesData,
    isController: false,
    controllerName: null,
    children: [],
  };

  // Compile children
  if (element.children) {
    for (let i = 0; i < element.children.length; i++) {
      const child = element.children[i];
      if (child instanceof HTMLElement) {
        const childCompiled = compileNode(child, context, directives);
        if (childCompiled) {
          compiled.children.push(childCompiled);
        }
      }
    }
  }

  // Store in cache
  compiledNodes.set(element, compiled);

  return compiled;
}

/**
 * Update a compiled node
 * @param compiled - Compiled node data
 * @param context - Directive context
 * @param directives - Available directives
 */
export function updateNode(
  compiled: CompiledNode,
  context: DirectiveContext,
  directives: Map<string, DirectiveHandler>
): void {
  const { node, directives: compiledDirectives } = compiled;

  // Process each directive
  for (const dir of compiledDirectives) {
    const handler = directives.get(dir.name);

    // Check for fyr-on:event
    if (!handler && dir.name.startsWith('on:')) {
      const onHandler = directives.get('on');
      if (onHandler) {
        try {
          onHandler(node as HTMLElement, dir.expression, context);
        } catch (error) {
          console.error(`Directive '${dir.name}' update error:`, error);
        }
      }
      continue;
    }

    // Check for fyr-bind:attr
    if (!handler && dir.name.startsWith('bind:')) {
      const bindHandler = directives.get('bind');
      if (bindHandler) {
        try {
          bindHandler(node as HTMLElement, dir.expression, context);
        } catch (error) {
          console.error(`Directive '${dir.name}' update error:`, error);
        }
      }
      continue;
    }

    if (handler) {
      try {
        handler(node as HTMLElement, dir.expression, context);
      } catch (error) {
        console.error(`Directive '${dir.name}' update error:`, error);
      }
    }
  }

  // Update children
  for (const child of compiled.children) {
    updateNode(child, context, directives);
  }
}

/**
 * Destroy a compiled node
 * @param compiled - Compiled node data
 */
export function destroyNode(compiled: CompiledNode): void {
  // Remove from cache
  compiledNodes.delete(compiled.node);

  // Destroy children
  for (const child of compiled.children) {
    destroyNode(child);
  }
}

/**
 * Get compiled node data
 * @param node - Node to get data for
 * @returns Compiled node data or null
 */
export function getCompiledNode(node: Node): CompiledNode | null {
  return compiledNodes.get(node) || null;
}

/**
 * Compile a template
 * @param template - Template element
 * @param context - Directive context
 * @param directives - Available directives
 * @returns Compiled template data
 */
export function compileTemplate(
  template: HTMLTemplateElement,
  context: DirectiveContext,
  directives: Map<string, DirectiveHandler>
): CompiledNode | null {
  const content = template.content;
  if (!content) return null;

  return compileNode(content as any, context, directives);
}