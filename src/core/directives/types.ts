/**
 * Directives - Type Definitions
 */

import type { ControllerInstance } from '../types';

/**
 * Directive handler function
 * @param element - The DOM element with the directive
 * @param expression - The directive expression
 * @param context - Directive context
 */
export type DirectiveHandler = (
  element: HTMLElement,
  expression: string,
  context: DirectiveContext
) => void;

/** A named directive definition for plugins and custom registries. */
export interface FyrDirective {
  name: string;
  handler: DirectiveHandler;
}

/**
 * Directive context
 */
export interface DirectiveContext {
  /** The controller instance (if any) */
  controller: ControllerInstance | null;
  /** Current index (for loops) */
  index?: number;
  /** Extra data (for loops) */
  extra?: Record<string, any>;
  /** Parent context */
  parent?: DirectiveContext | null;
  /** Root element of the app */
  rootElement?: HTMLElement;
}

/**
 * Directive registry
 */
export type DirectiveRegistry = Map<string, DirectiveHandler>;

/**
 * Parsed expression
 */
export interface ParsedExpression {
  type: ExpressionType;
  value: any;
  raw: string;
  args?: string[];
}

/**
 * Expression types
 */
export type ExpressionType =
  | 'literal'
  | 'identifier'
  | 'path'
  | 'method'
  | 'expression'
  | 'object'
  | 'array';

/**
 * Compiled directive
 */
export interface CompiledDirective {
  name: string;
  expression: string;
  parsed: ParsedExpression;
  attribute: Attr;
}

/**
 * Compiled node
 */
export interface CompiledNode {
  node: Node;
  directives: CompiledDirective[];
  isController: boolean;
  controllerName: string | null;
  children: CompiledNode[];
}
