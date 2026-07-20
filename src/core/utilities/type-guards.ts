/**
 * Type Guards
 * Runtime type checking utilities
 */

export type TypeGuard<T> = (value: unknown) => value is T;

/**
 * Check if a value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Check if a value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Check if a value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Check if a value is an object
 */
export function isObject(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Check if a value is an array
 */
export function isArray<T = any>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Check if a value is a function
 */
export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

/**
 * Check if a value is a promise
 */
export function isPromise<T = any>(value: unknown): value is Promise<T> {
  return isObject(value) && isFunction((value as any).then);
}

/**
 * Check if a value is a date
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Check if a value is a regular expression
 */
export function isRegExp(value: unknown): value is RegExp {
  return value instanceof RegExp;
}

/**
 * Check if a value is an error
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Check if a value is a plain object (not a class instance)
 */
export function isPlainObject(value: unknown): value is Record<string, any> {
  if (!isObject(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
}

/**
 * Check if a value is defined (not undefined)
 */
export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

/**
 * Check if a value is undefined
 */
export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

/**
 * Check if a value is null
 */
export function isNull(value: unknown): value is null {
  return value === null;
}

/**
 * Check if a value is null or undefined
 */
export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Check if a value is empty
 */
export function isEmpty(value: unknown): boolean {
  if (isNil(value)) {
    return true;
  }

  if (isString(value)) {
    return value.trim() === '';
  }

  if (isArray(value)) {
    return value.length === 0;
  }

  if (isObject(value)) {
    return Object.keys(value).length === 0;
  }

  if (isNumber(value)) {
    return value === 0;
  }

  return false;
}

/**
 * Check if a value is a primitive (string, number, boolean, null, undefined)
 */
export function isPrimitive(value: unknown): boolean {
  return (
    isString(value) ||
    isNumber(value) ||
    isBoolean(value) ||
    isNull(value) ||
    isUndefined(value)
  );
}

/**
 * Check if a value is an integer
 */
export function isInteger(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value);
}

/**
 * Check if a value is a positive integer
 */
export function isPositiveInteger(value: unknown): value is number {
  return isInteger(value) && value > 0;
}

/**
 * Check if a value is a non-negative integer
 */
export function isNonNegativeInteger(value: unknown): value is number {
  return isInteger(value) && value >= 0;
}

/**
 * Check if a value is a finite number
 */
export function isFinite(value: unknown): value is number {
  return isNumber(value) && Number.isFinite(value);
}

/**
 * Check if a value is an instance of a class
 */
export function isInstance<T>(value: unknown, constructor: new (...args: any[]) => T): value is T {
  return value instanceof constructor;
}

/**
 * Check if a value is a Map
 */
export function isMap(value: unknown): value is Map<any, any> {
  return value instanceof Map;
}

/**
 * Check if a value is a Set
 */
export function isSet(value: unknown): value is Set<any> {
  return value instanceof Set;
}

/**
 * Check if a value is a WeakMap
 */
export function isWeakMap(value: unknown): value is WeakMap<any, any> {
  return value instanceof WeakMap;
}

/**
 * Check if a value is a WeakSet
 */
export function isWeakSet(value: unknown): value is WeakSet<any> {
  return value instanceof WeakSet;
}

/**
 * Check if a value is a symbol
 */
export function isSymbol(value: unknown): value is symbol {
  return typeof value === 'symbol';
}

/**
 * Check if a value is a blob
 */
export function isBlob(value: unknown): value is Blob {
  return value instanceof Blob;
}

/**
 * Check if a value is a file
 */
export function isFile(value: unknown): value is File {
  return value instanceof File;
}

/**
 * Check if a value is a form data
 */
export function isFormData(value: unknown): value is FormData {
  return value instanceof FormData;
}

/**
 * Check if a value is a URL
 */
export function isURL(value: unknown): value is URL {
  return value instanceof URL;
}

/**
 * Check if a value is an array buffer
 */
export function isArrayBuffer(value: unknown): value is ArrayBuffer {
  return value instanceof ArrayBuffer;
}

/**
 * Check if a value is a typed array
 */
export function isTypedArray(value: unknown): boolean {
  return (
    value instanceof Int8Array ||
    value instanceof Uint8Array ||
    value instanceof Uint8ClampedArray ||
    value instanceof Int16Array ||
    value instanceof Uint16Array ||
    value instanceof Int32Array ||
    value instanceof Uint32Array ||
    value instanceof Float32Array ||
    value instanceof Float64Array
  );
}

/**
 * Assert that a value is of a specific type
 * @throws {TypeError} If assertion fails
 */
export function assertType<T>(
  value: unknown,
  guard: TypeGuard<T>,
  message: string = 'Type assertion failed'
): asserts value is T {
  if (!guard(value)) {
    throw new TypeError(message);
  }
}

/**
 * Assert that a value is a string
 */
export function assertString(value: unknown): asserts value is string {
  assertType(value, isString, 'Expected a string');
}

/**
 * Assert that a value is a number
 */
export function assertNumber(value: unknown): asserts value is number {
  assertType(value, isNumber, 'Expected a number');
}

/**
 * Assert that a value is a boolean
 */
export function assertBoolean(value: unknown): asserts value is boolean {
  assertType(value, isBoolean, 'Expected a boolean');
}

/**
 * Assert that a value is an object
 */
export function assertObject(value: unknown): asserts value is Record<string, any> {
  assertType(value, isObject, 'Expected an object');
}

/**
 * Assert that a value is an array
 */
export function assertArray<T = any>(value: unknown): asserts value is T[] {
  assertType(value, isArray, 'Expected an array');
}

/**
 * Assert that a value is a function
 */
export function assertFunction(value: unknown): asserts value is Function {
  assertType(value, isFunction, 'Expected a function');
}

/**
 * Assert that a value is defined (not undefined)
 */
export function assertDefined<T>(value: T | undefined): asserts value is T {
  assertType(value, isDefined, 'Expected a defined value');
}