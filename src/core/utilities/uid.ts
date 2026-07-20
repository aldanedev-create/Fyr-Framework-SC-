/**
 * UID Generator
 * Generates unique identifiers
 */

/**
 * UID options
 */
export interface UIDOptions {
  /** Prefix for the ID */
  prefix?: string;
  /** Length of the ID (for short IDs) */
  length?: number;
  /** Character set to use */
  charset?: string;
  /** Whether to include timestamp */
  timestamp?: boolean;
}

/**
 * Default UID options
 */
const DEFAULT_OPTIONS: Required<UIDOptions> = {
  prefix: '',
  length: 8,
  charset: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  timestamp: false,
};

/**
 * Generate a unique ID
 * @param options - UID options
 * @returns Unique ID
 */
export function uid(options: UIDOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  let id = '';

  if (opts.timestamp) {
    id += Date.now().toString(36) + '_';
  }

  const { length, charset } = opts;
  const charsetLength = charset.length;

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charsetLength);
    id += charset[randomIndex];
  }

  return opts.prefix ? `${opts.prefix}${id}` : id;
}

/**
 * Generate a short ID (alphanumeric, 8 characters)
 * @param length - Length of the ID
 * @returns Short ID
 */
export function shortId(length: number = 8): string {
  return uid({ length, prefix: '' });
}

/**
 * Generate a UUID (v4)
 * @returns UUID string
 */
export function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.random() * 16 | 0;
    const value = char === 'x' ? random : (random & 0x3 | 0x8);
    return value.toString(16);
  });
}

/**
 * Generate a cryptographically secure ID
 * @param length - Length of the ID
 * @returns Secure ID
 */
export function secureId(length: number = 16): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);

    for (let i = 0; i < length; i++) {
      result += charset[array[i] % charset.length];
    }
    return result;
  }

  // Fallback for non-crypto environments
  return uid({ length, prefix: '' });
}

/**
 * Generate a sequential ID
 * @param prefix - Prefix for the ID
 * @param start - Starting number
 * @returns Generator function
 */
export function sequentialId(prefix: string = '', start: number = 0): () => string {
  let counter = start;

  return () => {
    counter++;
    return prefix ? `${prefix}${counter}` : String(counter);
  };
}

/**
 * Generate a nanoid-style ID
 * @param size - Size of the ID
 * @returns NanoID
 */
export function nanoid(size: number = 21): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  let id = '';

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(size);
    crypto.getRandomValues(bytes);

    for (let i = 0; i < size; i++) {
      id += alphabet[bytes[i] % alphabet.length];
    }
    return id;
  }

  // Fallback
  return uid({ length: size, charset: alphabet, prefix: '' });
}

/**
 * Generate a timestamp-based ID
 * @param prefix - Prefix for the ID
 * @returns Timestamp ID
 */
export function timestampId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 6);
  const id = `${timestamp}${random}`;
  return prefix ? `${prefix}${id}` : id;
}

/**
 * Generate a ULID (Universally Unique Lexicographically Sortable Identifier)
 * @returns ULID string
 */
export function ulid(): string {
  const timestamp = Date.now();
  const random = uid({ length: 16, charset: '0123456789ABCDEFGHJKMNPQRSTVWXYZ', prefix: '' });
  return encodeULIDTimestamp(timestamp) + random;
}

/**
 * Encode timestamp for ULID
 */
function encodeULIDTimestamp(timestamp: number): string {
  const chars = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  let result = '';
  let value = timestamp;

  for (let i = 9; i >= 0; i--) {
    const index = value % chars.length;
    result = chars[index] + result;
    value = Math.floor(value / chars.length);
  }

  return result;
}

/**
 * Check if a string is a valid UUID
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Check if a string is a valid ULID
 */
export function isValidULID(id: string): boolean {
  const ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/;
  return ulidRegex.test(id);
}

// Export default generator
export const generateId = uid;