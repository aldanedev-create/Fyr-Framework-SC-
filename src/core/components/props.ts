/**
 * Props System
 * Handles component props validation and parsing
 */

export type PropType = String | Number | Boolean | Object | Array | Function | Symbol;

export interface PropDefinition {
  type: PropType | PropType[];
  required?: boolean;
  default?: any;
  validator?: (value: any) => boolean;
}

export interface PropOptions {
  type: PropType | PropType[];
  required?: boolean;
  default?: any;
  validator?: (value: any) => boolean;
}

/**
 * Parse props from definition and input
 * @param propDefs - Prop definitions
 * @param inputProps - Input props
 * @returns Parsed props
 */
export function parseProps(
  propDefs: Record<string, PropDefinition>,
  inputProps: Record<string, any>
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, def] of Object.entries(propDefs)) {
    // Check if prop was provided
    if (key in inputProps) {
      const value = inputProps[key];
      const parsed = parsePropValue(value, def);
      result[key] = parsed;
    } else if (def.required) {
      throw new Error(`Prop '${key}' is required`);
    } else if (def.default !== undefined) {
      // Use default if provided
      result[key] = typeof def.default === 'function' ? def.default() : def.default;
    }
  }

  return result;
}

/**
 * Validate props
 * @param propDefs - Prop definitions
 * @param parsedProps - Parsed props
 * @returns True if valid
 */
export function validateProps(
  propDefs: Record<string, PropDefinition>,
  parsedProps: Record<string, any>
): boolean {
  for (const [key, def] of Object.entries(propDefs)) {
    if (!(key in parsedProps)) {
      if (def.required) {
        console.warn(`Prop '${key}' is required but not provided`);
        return false;
      }
      continue;
    }

    const value = parsedProps[key];

    // Run validator if provided
    if (def.validator && !def.validator(value)) {
      console.warn(`Prop '${key}' failed validation`);
      return false;
    }

    // Type check
    if (def.type && !checkType(value, def.type)) {
      console.warn(`Prop '${key}' has invalid type`);
      return false;
    }
  }

  return true;
}

/**
 * Parse a single prop value
 * @param value - Raw value
 * @param def - Prop definition
 * @returns Parsed value
 */
function parsePropValue(value: any, def: PropDefinition): any {
  // If value is undefined and default exists, use default
  if (value === undefined && def.default !== undefined) {
    return typeof def.default === 'function' ? def.default() : def.default;
  }
  return value;
}

/**
 * Check if a value matches a type
 * @param value - Value to check
 * @param type - Type to check against
 * @returns True if matches
 */
function checkType(value: any, type: PropType | PropType[]): boolean {
  const types = Array.isArray(type) ? type : [type];

  for (const t of types) {
    if (t === String && typeof value === 'string') return true;
    if (t === Number && typeof value === 'number') return true;
    if (t === Boolean && typeof value === 'boolean') return true;
    if (t === Object && typeof value === 'object' && value !== null) return true;
    if (t === Array && Array.isArray(value)) return true;
    if (t === Function && typeof value === 'function') return true;
    if (t === Symbol && typeof value === 'symbol') return true;
    if (value instanceof t) return true;
  }

  return false;
}

/**
 * Merge props with defaults
 * @param propDefs - Prop definitions
 * @param parsedProps - Parsed props
 * @returns Merged props
 */
export function mergeProps(
  propDefs: Record<string, PropDefinition>,
  parsedProps: Record<string, any>
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, def] of Object.entries(propDefs)) {
    if (key in parsedProps) {
      result[key] = parsedProps[key];
    } else if (def.default !== undefined) {
      result[key] = typeof def.default === 'function' ? def.default() : def.default;
    }
  }

  return result;
}

/**
 * Create a prop definition helper
 */
export function prop(
  type: PropType | PropType[],
  options: Partial<PropOptions> = {}
): PropDefinition {
  return {
    type,
    required: options.required || false,
    default: options.default,
    validator: options.validator,
  };
}

/**
 * Prop type helpers
 */
export const PropTypes = {
  string: (options?: Partial<PropOptions>) => prop(String, options),
  number: (options?: Partial<PropOptions>) => prop(Number, options),
  boolean: (options?: Partial<PropOptions>) => prop(Boolean, options),
  object: (options?: Partial<PropOptions>) => prop(Object, options),
  array: (options?: Partial<PropOptions>) => prop(Array, options),
  func: (options?: Partial<PropOptions>) => prop(Function, options),
  any: (options?: Partial<PropOptions>) => prop([String, Number, Boolean, Object, Array, Function], options),
};