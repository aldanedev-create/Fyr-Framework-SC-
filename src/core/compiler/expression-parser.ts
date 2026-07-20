/**
 * Expression Parser
 * Parses and validates expressions with a safe subset of JavaScript
 */

import type { ParsedExpression, ExpressionType } from '../directives/types';

/** Allowed operators */
const ALLOWED_OPERATORS = [
  '+', '-', '*', '/', '%',
  '==', '===', '!=', '!==',
  '<', '>', '<=', '>=',
  '&&', '||', '!',
  '?', ':',
];

/** Allowed keywords */
const ALLOWED_KEYWORDS = [
  'true', 'false', 'null', 'undefined',
  'this',
];

/** Forbidden patterns (security) */
const FORBIDDEN_PATTERNS = [
  /\bwindow\b/,
  /\bdocument\b/,
  /\bglobalThis\b/,
  /\bFunction\b/,
  /\beval\b/,
  /\bconstructor\b/,
  /\b__proto__\b/,
  /\bprototype\b/,
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
  /\bcookie\b/,
  /\bimport\s*\(/,
  /\brequire\s*\(/,
];

/**
 * Parse and validate an expression
 * @param expression - Expression string
 * @param scope - Available variables in scope
 * @returns Validated expression or null if invalid
 */
export function parseExpressionSafe(
  expression: string,
  scope: Record<string, any>
): ParsedExpression | null {
  const trimmed = expression.trim();

  // Empty expression
  if (!trimmed) {
    return {
      type: 'literal',
      value: undefined,
      raw: expression,
    };
  }

  // Security check - reject forbidden patterns
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(trimmed)) {
      console.warn(`Expression contains forbidden pattern: ${trimmed}`);
      return null;
    }
  }

  // Check for valid syntax
  if (!isValidExpression(trimmed)) {
    return null;
  }

  // Parse based on type
  return parseExpressionType(trimmed, scope);
}

/**
 * Check if an expression has valid syntax
 * @param expression - Expression string
 * @returns True if valid
 */
function isValidExpression(expression: string): boolean {
  // Check for balanced parentheses
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];

    if (char === '"' || char === "'") {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
      continue;
    }

    if (inString) continue;

    if (char === '(') parenDepth++;
    if (char === ')') parenDepth--;
    if (char === '[') bracketDepth++;
    if (char === ']') bracketDepth--;
    if (char === '{') braceDepth++;
    if (char === '}') braceDepth--;

    if (parenDepth < 0 || bracketDepth < 0 || braceDepth < 0) {
      return false;
    }
  }

  return parenDepth === 0 && bracketDepth === 0 && braceDepth === 0;
}

/**
 * Parse expression type
 * @param expression - Expression string
 * @param scope - Available variables
 * @returns Parsed expression
 */
function parseExpressionType(
  expression: string,
  scope: Record<string, any>
): ParsedExpression {
  const trimmed = expression.trim();

  // Literals
  if (trimmed === 'true') return { type: 'literal', value: true, raw: expression };
  if (trimmed === 'false') return { type: 'literal', value: false, raw: expression };
  if (trimmed === 'null') return { type: 'literal', value: null, raw: expression };
  if (trimmed === 'undefined') return { type: 'literal', value: undefined, raw: expression };

  // Number literals
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return { type: 'literal', value: parseFloat(trimmed), raw: expression };
  }

  // String literals
  if ((trimmed.startsWith("'") && trimmed.endsWith("'")) ||
      (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
    return { type: 'literal', value: trimmed.slice(1, -1), raw: expression };
  }

  // Property access path
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)*$/.test(trimmed)) {
    return {
      type: 'path',
      value: trimmed.split('.'),
      raw: expression,
    };
  }

  // Method call with no args
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*\(\)$/.test(trimmed)) {
    return {
      type: 'method',
      value: trimmed.slice(0, -2),
      raw: expression,
    };
  }

  // Method call with args (simple)
  const methodMatch = trimmed.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\(([^)]*)\)$/);
  if (methodMatch) {
    const [, methodName, argsStr] = methodMatch;
    const args = argsStr ? argsStr.split(',').map(a => a.trim()) : [];
    return {
      type: 'method',
      value: methodName,
      raw: expression,
      args,
    };
  }

  // Object literal
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return { type: 'object', value: trimmed, raw: expression };
  }

  // Array literal
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return { type: 'array', value: trimmed, raw: expression };
  }

  // Expression with operators
  if (/[+\-*/%<>!=]/.test(trimmed)) {
    return {
      type: 'expression',
      value: parseOperatorExpression(trimmed),
      raw: expression,
    };
  }

  // Default: identifier
  return {
    type: 'identifier',
    value: trimmed,
    raw: expression,
  };
}

/**
 * Parse an operator expression
 * @param expression - Expression string
 * @returns Parsed operator expression
 */
function parseOperatorExpression(expression: string): any {
  // Simple tokenization - split by operators
  const tokens: Array<string | { operator: string }> = [];
  let current = '';
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];

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

    // Check for multi-character operators
    const remaining = expression.slice(i);
    let operatorLength = 0;
    let operator = '';

    if (remaining.startsWith('===')) { operator = '==='; operatorLength = 3; }
    else if (remaining.startsWith('!==')) { operator = '!=='; operatorLength = 3; }
    else if (remaining.startsWith('&&')) { operator = '&&'; operatorLength = 2; }
    else if (remaining.startsWith('||')) { operator = '||'; operatorLength = 2; }
    else if (remaining.startsWith('==')) { operator = '=='; operatorLength = 2; }
    else if (remaining.startsWith('!=')) { operator = '!='; operatorLength = 2; }
    else if (remaining.startsWith('<=')) { operator = '<='; operatorLength = 2; }
    else if (remaining.startsWith('>=')) { operator = '>='; operatorLength = 2; }
    else if (remaining.startsWith('+')) { operator = '+'; operatorLength = 1; }
    else if (remaining.startsWith('-')) { operator = '-'; operatorLength = 1; }
    else if (remaining.startsWith('*')) { operator = '*'; operatorLength = 1; }
    else if (remaining.startsWith('/')) { operator = '/'; operatorLength = 1; }
    else if (remaining.startsWith('%')) { operator = '%'; operatorLength = 1; }
    else if (remaining.startsWith('<')) { operator = '<'; operatorLength = 1; }
    else if (remaining.startsWith('>')) { operator = '>'; operatorLength = 1; }
    else if (remaining.startsWith('!')) { operator = '!'; operatorLength = 1; }
    else if (remaining.startsWith('?')) { operator = '?'; operatorLength = 1; }
    else if (remaining.startsWith(':')) { operator = ':'; operatorLength = 1; }
    else if (remaining.startsWith('(')) { operator = '('; operatorLength = 1; }
    else if (remaining.startsWith(')')) { operator = ')'; operatorLength = 1; }
    else if (remaining.startsWith('[')) { operator = '['; operatorLength = 1; }
    else if (remaining.startsWith(']')) { operator = ']'; operatorLength = 1; }

    if (operator) {
      if (current) {
        tokens.push(current.trim());
        current = '';
      }
      tokens.push({ operator });
      i += operatorLength - 1;
    } else {
      current += char;
    }
  }

  if (current) {
    tokens.push(current.trim());
  }

  // Build expression object
  return {
    type: 'operator-expression',
    tokens,
    raw: expression,
  };
}