/**
 * Directive Parser
 * Parses directive expressions into AST
 */

import type { ParsedExpression, ExpressionType, DirectiveContext } from '../directives/types';

/**
 * Parse a directive expression
 * @param expression - Raw expression string
 * @param context - Directive context
 * @returns Parsed expression
 */
export function parseDirective(
  expression: string,
  context: DirectiveContext
): ParsedExpression {
  const trimmed = expression.trim();

  // Empty expression
  if (!trimmed) {
    return {
      type: 'literal',
      value: undefined,
      raw: expression,
    };
  }

  // Check for literal values
  if (trimmed === 'true') {
    return { type: 'literal', value: true, raw: expression };
  }
  if (trimmed === 'false') {
    return { type: 'literal', value: false, raw: expression };
  }
  if (trimmed === 'null') {
    return { type: 'literal', value: null, raw: expression };
  }
  if (trimmed === 'undefined') {
    return { type: 'literal', value: undefined, raw: expression };
  }

  // Check for number literals
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return { type: 'literal', value: parseFloat(trimmed), raw: expression };
  }

  // Check for string literals (single or double quotes)
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    const value = trimmed.slice(1, -1);
    return { type: 'literal', value, raw: expression };
  }

  // Check for object literals
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return {
      type: 'object',
      value: parseObjectLiteral(trimmed),
      raw: expression,
    };
  }

  // Check for array literals
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return {
      type: 'array',
      value: parseArrayLiteral(trimmed),
      raw: expression,
    };
  }

  // Check for property access (e.g., 'user.name')
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)*$/.test(trimmed)) {
    return {
      type: 'path',
      value: trimmed.split('.'),
      raw: expression,
    };
  }

  // Check for method call (e.g., 'save()')
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*\(\)$/.test(trimmed)) {
    const methodName = trimmed.slice(0, -2);
    return {
      type: 'method',
      value: methodName,
      raw: expression,
    };
  }

  // Check for expression with operators
  if (/[+\-*/%<>!=]/.test(trimmed)) {
    return {
      type: 'expression',
      value: trimmed,
      raw: expression,
    };
  }

  // Default: treat as identifier
  return {
    type: 'identifier',
    value: trimmed,
    raw: expression,
  };
}

/**
 * Parse an object literal
 * @param str - Object literal string
 * @returns Parsed object
 */
function parseObjectLiteral(str: string): Record<string, any> {
  const result: Record<string, any> = {};
  const content = str.slice(1, -1).trim();

  if (!content) return result;

  // Simple parser - splits by commas not in strings
  const pairs = splitByCommas(content);

  for (const pair of pairs) {
    const colonIndex = pair.indexOf(':');
    if (colonIndex === -1) continue;

    const key = pair.slice(0, colonIndex).trim();
    const value = pair.slice(colonIndex + 1).trim();

    // Remove quotes from key
    const cleanKey = key.replace(/^['"]|['"]$/g, '');

    // Parse value
    result[cleanKey] = parseValue(value);
  }

  return result;
}

/**
 * Parse an array literal
 * @param str - Array literal string
 * @returns Parsed array
 */
function parseArrayLiteral(str: string): any[] {
  const result: any[] = [];
  const content = str.slice(1, -1).trim();

  if (!content) return result;

  const items = splitByCommas(content);

  for (const item of items) {
    result.push(parseValue(item.trim()));
  }

  return result;
}

/**
 * Parse a value
 * @param str - Value string
 * @returns Parsed value
 */
function parseValue(str: string): any {
  const trimmed = str.trim();

  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (trimmed === 'undefined') return undefined;

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return parseFloat(trimmed);
  }

  if ((trimmed.startsWith("'") && trimmed.endsWith("'")) ||
      (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
    return trimmed.slice(1, -1);
  }

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return parseObjectLiteral(trimmed);
  }

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return parseArrayLiteral(trimmed);
  }

  // Identifier
  return trimmed;
}

/**
 * Split a string by commas, respecting quotes and brackets
 * @param str - String to split
 * @returns Array of parts
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

    if (char === '{' || char === '[') {
      depth++;
      current += char;
      continue;
    }

    if (char === '}' || char === ']') {
      depth--;
      current += char;
      continue;
    }

    if (char === ',' && depth === 0) {
      result.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  if (current) {
    result.push(current);
  }

  return result;
}

/**
 * Parse all directives on an element
 * @param element - Element to parse
 * @param context - Directive context
 * @returns Map of directive name to parsed expression
 */
export function parseDirectives(
  element: HTMLElement,
  context: DirectiveContext
): Map<string, ParsedExpression> {
  const result = new Map<string, ParsedExpression>();

  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    const name = attr.name;

    if (name.startsWith('fyr-')) {
      const directiveName = name.slice(4);
      const expression = attr.value;
      const parsed = parseDirective(expression, context);
      result.set(directiveName, parsed);
    }
  }

  return result;
}

/**
 * Parse an expression (same as parseDirective but returns simplified)
 * @param expression - Expression string
 * @param context - Directive context
 * @returns Parsed expression data
 */
export function parseExpression(
  expression: string,
  context: DirectiveContext
): ParsedExpression {
  return parseDirective(expression, context);
}