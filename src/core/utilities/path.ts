/**
 * Path Utilities
 * Safely get, set, and manipulate nested object paths
 */

export type Path = string | string[];

/**
 * Get a value from an object using a path string
 * @param obj - Object to get value from
 * @param path - Path string (e.g., 'user.name' or 'users[0].email')
 * @param defaultValue - Default value if path not found
 * @returns Value at path or default value
 */
export function getPath<T = any>(
  obj: any,
  path: Path,
  defaultValue?: T
): T | undefined {
  if (!obj || typeof obj !== 'object') {
    return defaultValue;
  }

  const keys = parsePath(path);
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return defaultValue;
    }

    // Handle array index (e.g., '0' in 'users[0]')
    if (typeof key === 'number' && Array.isArray(current)) {
      current = current[key];
    } else if (typeof key === 'string' && typeof current === 'object') {
      current = current[key];
    } else {
      return defaultValue;
    }
  }

  return current as T;
}

/**
 * Set a value at a path in an object
 * @param obj - Object to set value in
 * @param path - Path string (e.g., 'user.name')
 * @param value - Value to set
 * @returns The updated object
 */
export function setPath<T extends object>(
  obj: T,
  path: Path,
  value: any
): T {
  const keys = parsePath(path);
  const lastKey = keys.pop();
  let current: any = obj;

  for (const key of keys) {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }

  if (lastKey !== undefined) {
    current[lastKey] = value;
  }

  return obj;
}

/**
 * Check if a path exists in an object
 * @param obj - Object to check
 * @param path - Path string
 * @returns True if path exists
 */
export function hasPath(obj: any, path: Path): boolean {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const keys = parsePath(path);
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return false;
    }

    if (typeof key === 'number' && Array.isArray(current)) {
      current = current[key];
    } else if (typeof key === 'string' && typeof current === 'object') {
      current = current[key];
    } else {
      return false;
    }
  }

  return true;
}

/**
 * Delete a value at a path in an object
 * @param obj - Object to delete from
 * @param path - Path string
 * @returns True if deleted
 */
export function deletePath(obj: any, path: Path): boolean {
  const keys = parsePath(path);
  const lastKey = keys.pop();
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return false;
    }

    if (typeof key === 'number' && Array.isArray(current)) {
      current = current[key];
    } else if (typeof key === 'string' && typeof current === 'object') {
      current = current[key];
    } else {
      return false;
    }
  }

  if (lastKey !== undefined && current) {
    delete current[lastKey];
    return true;
  }

  return false;
}

/**
 * Parse a path string into an array of keys
 * @param path - Path string (e.g., 'user.name' or 'users[0].email')
 * @returns Array of keys
 */
export function parsePath(path: Path): (string | number)[] {
  if (Array.isArray(path)) {
    return path.map(key => {
      const num = Number(key);
      return !isNaN(num) && String(num) === key ? num : key;
    });
  }

  if (typeof path !== 'string') {
    return [];
  }

  const keys: (string | number)[] = [];
  let current = '';
  let inBrackets = false;

  for (let i = 0; i < path.length; i++) {
    const char = path[i];

    if (char === '[') {
      inBrackets = true;
      if (current) {
        keys.push(current);
        current = '';
      }
    } else if (char === ']') {
      inBrackets = false;
      if (current) {
        const num = Number(current);
        keys.push(!isNaN(num) && String(num) === current ? num : current);
        current = '';
      }
    } else if (char === '.') {
      if (!inBrackets) {
        if (current) {
          keys.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    } else {
      current += char;
    }
  }

  if (current) {
    keys.push(current);
  }

  return keys;
}

/**
 * Create a path string from keys
 * @param keys - Array of keys
 * @returns Path string
 */
export function stringifyPath(keys: (string | number)[]): string {
  return keys.map(key => {
    if (typeof key === 'number' || /^\d+$/.test(key)) {
      return `[${key}]`;
    }
    return key;
  }).join('.');
}

/**
 * Get the parent path of a path
 * @param path - Path string
 * @returns Parent path or null
 */
export function getParentPath(path: Path): string | null {
  const keys = parsePath(path);
  if (keys.length <= 1) {
    return null;
  }
  const parentKeys = keys.slice(0, -1);
  return stringifyPath(parentKeys);
}

/**
 * Get the last key of a path
 * @param path - Path string
 * @returns Last key or null
 */
export function getLastKey(path: Path): string | number | null {
  const keys = parsePath(path);
  if (keys.length === 0) {
    return null;
  }
  return keys[keys.length - 1];
}

/**
 * Normalize a path string
 * @param path - Path string
 * @returns Normalized path string
 */
export function normalizePath(path: Path): string {
  const keys = parsePath(path);
  return stringifyPath(keys);
}