/**
 * Expression Evaluator
 * Safely evaluates expressions in a scoped context
 */

import { parseExpressionSafe } from './expression-parser';
import { getValue, createScope } from '../controllers/controller';
import type { ParsedExpression, DirectiveContext } from '../directives/types';
import type { ControllerInstance } from '../types';

/**
 * Evaluate an expression in a given scope
 * @param expression - Expression string
 * @param context - Directive context
 * @param extras - Extra values to include in scope
 * @returns Evaluated result
 */
export function evaluateExpression(
  expression: string,
  context: DirectiveContext,
  extras: Record<string, any> = {}
): any {
  // If expression is empty, return undefined
  if (!expression || expression.trim() === '') {
    return undefined;
  }

  // Create scope
  const scope = createEvaluationScope(context, extras);

  // Parse expression
  const parsed = parseExpressionSafe(expression, scope);

  if (!parsed) {
    console.warn(`Invalid expression: ${expression}`);
    return undefined;
  }

  // Evaluate based on type
  return evaluateParsed(parsed, scope, context);
}

/**
 * Evaluate a parsed expression
 * @param parsed - Parsed expression
 * @param scope - Evaluation scope
 * @param context - Directive context
 * @returns Evaluated result
 */
function evaluateParsed(
  parsed: ParsedExpression,
  scope: Record<string, any>,
  context: DirectiveContext
): any {
  switch (parsed.type) {
    case 'literal':
      return parsed.value;

    case 'identifier':
      return getScopedValue(parsed.value as string, scope);

    case 'path':
      return getPathValue(parsed.value as string[], scope);

    case 'method':
      return callMethod(parsed.value as string, parsed.args || [], scope);

    case 'expression':
      return evaluateOperatorExpression(parsed.value as any, scope);

    case 'object':
      return evaluateObjectLiteral(parsed.value as string, scope);

    case 'array':
      return evaluateArrayLiteral(parsed.value as string, scope);

    default:
      return undefined;
  }
}

/**
 * Get a value from the scope (with fallback)
 * @param key - Key to get
 * @param scope - Scope object
 * @returns Value or undefined
 */
function getScopedValue(key: string, scope: Record<string, any>): any {
  // Check if key exists in scope
  if (key in scope) {
    return scope[key];
  }

  // Check if it's a special value
  if (key === '$index') return scope.$index;
  if (key === '$event') return scope.$event;
  if (key === '$root') return scope.$root;

  return undefined;
}

/**
 * Get a value from a path
 * @param path - Path array
 * @param scope - Scope object
 * @returns Value or undefined
 */
function getPathValue(path: string[], scope: Record<string, any>): any {
  let current: any = scope;

  for (const key of path) {
    if (current === null || current === undefined) {
      return undefined;
    }

    // Check if current is a function (method call)
    if (typeof current === 'function') {
      current = current();
    }

    // Get the value
    current = current[key];
  }

  return current;
}

/**
 * Call a method
 * @param methodName - Method name
 * @param args - Method arguments
 * @param scope - Scope object
 * @returns Method result
 */
function callMethod(
  methodName: string,
  args: string[],
  scope: Record<string, any>
): any {
  // Get the method from scope
  const method = scope[methodName];

  if (typeof method !== 'function') {
    console.warn(`Method '${methodName}' not found in scope`);
    return undefined;
  }

  // Evaluate arguments
  const evaluatedArgs = args.map(arg => evaluateString(arg, scope));

  // Call method
  return method.apply(scope, evaluatedArgs);
}

/**
 * Evaluate an operator expression
 * @param expr - Operator expression object
 * @param scope - Scope object
 * @returns Evaluated result
 */
function evaluateOperatorExpression(
  expr: any,
  scope: Record<string, any>
): any {
  // For complex expressions, we need to evaluate tokens
  // This is a simplified implementation
  if (typeof expr === 'string') {
    // Try to evaluate as a simple expression
    try {
      // Build a safe evaluation function
      const keys = Object.keys(scope);
      const values = Object.values(scope);
      const body = `return (${expr});`;
      const fn = new Function(...keys, body);
      return fn(...values);
    } catch {
      return undefined;
    }
  }

  // If it's an object with tokens, evaluate token by token
  if (expr && typeof expr === 'object' && 'tokens' in expr) {
    // Simplified evaluation - concatenate tokens
    let result = '';
    for (const token of expr.tokens) {
      if (typeof token === 'string') {
        // Try to resolve as scope value
        const value = getScopedValue(token, scope);
        if (value !== undefined) {
          result += String(value);
        } else {
          result += token;
        }
      } else if (token && typeof token === 'object' && 'operator' in token) {
        result += token.operator;
      }
    }
    return result;
  }

  return expr;
}

/**
 * Evaluate an object literal
 * @param str - Object literal string
 * @param scope - Scope object
 * @returns Evaluated object
 */
function evaluateObjectLiteral(str: string, scope: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  const content = str.slice(1, -1).trim();

  if (!content) return result;

  // Simple parsing - splits by commas not in quotes
  const pairs = splitByCommas(content);

  for (const pair of pairs) {
    const colonIndex = pair.indexOf(':');
    if (colonIndex === -1) continue;

    const key = pair.slice(0, colonIndex).trim();
    const value = pair.slice(colonIndex + 1).trim();

    const cleanKey = key.replace(/^['"]|['"]$/g, '');
    result[cleanKey] = evaluateString(value, scope);
  }

  return result;
}

/**
 * Evaluate an array literal
 * @param str - Array literal string
 * @param scope - Scope object
 * @returns Evaluated array
 */
function evaluateArrayLiteral(str: string, scope: Record<string, any>): any[] {
  const result: any[] = [];
  const content = str.slice(1, -1).trim();

  if (!content) return result;

  const items = splitByCommas(content);

  for (const item of items) {
    result.push(evaluateString(item.trim(), scope));
  }

  return result;
}

/**
 * Evaluate a string as an expression
 * @param str - String to evaluate
 * @param scope - Scope object
 * @returns Evaluated value
 */
function evaluateString(str: string, scope: Record<string, any>): any {
  const trimmed = str.trim();

  // Literals
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (trimmed === 'undefined') return undefined;

  // Numbers
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return parseFloat(trimmed);
  }

  // Strings
  if ((trimmed.startsWith("'") && trimmed.endsWith("'")) ||
      (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
    return trimmed.slice(1, -1);
  }

  // Objects
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return evaluateObjectLiteral(trimmed, scope);
  }

  // Arrays
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return evaluateArrayLiteral(trimmed, scope);
  }

  // Path or identifier
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)*$/.test(trimmed)) {
    const parts = trimmed.split('.');
    return getPathValue(parts, scope);
  }

  // Method call
  const methodMatch = trimmed.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\(([^)]*)\)$/);
  if (methodMatch) {
    const [, methodName, argsStr] = methodMatch;
    const args = argsStr ? argsStr.split(',').map(a => a.trim()) : [];
    return callMethod(methodName, args, scope);
  }

  // Return as-is
  return trimmed;
}

/**
 * Split by commas respecting quotes and brackets
 */
function splitByCommas(str: string): string[] {
  const result: string[] = [];
  let current = '';
  let depth = 0;
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (char === '"' || char === "'") {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
      current += char;
      continue;
    }

    if (inString) {
      current += char;
      continue;
    }

    if (char === '{' || char === '[') depth++;
    if (char === '}' || char === ']') depth--;

    if (char === ',' && depth === 0) {
      result.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  if (current) result.push(current);
  return result;
}

/**
 * Create an evaluation scope
 * @param context - Directive context
 * @param extras - Extra values
 * @returns Scope object
 */
function createEvaluationScope(
  context: DirectiveContext,
  extras: Record<string, any>
): Record<string, any> {
  const scope: Record<string, any> = {};

  // Add controller instance values
  if (context.controller) {
    const instance = context.controller;
    // Add state
    for (const [key, value] of Object.entries(instance.state || {})) {
      scope[key] = value;
    }
    // Add computed
    for (const [key, value] of Object.entries(instance.computed || {})) {
      scope[key] = value?.value;
    }
    // Add methods
    for (const [key, value] of Object.entries(instance.methods || {})) {
      scope[key] = value;
    }
    // Add props
    for (const [key, value] of Object.entries(instance.props || {})) {
      scope[key] = value;
    }
  }

  // Add extras
  for (const [key, value] of Object.entries(extras)) {
    scope[key] = value;
  }

  // Add special values
  scope.$index = extras.$index ?? context.index ?? 0;
  scope.$event = extras.$event ?? null;
  scope.$root = context.rootElement ?? document;

  return scope;
}