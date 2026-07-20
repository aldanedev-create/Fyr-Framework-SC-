/**
 * JavaScript Bridge
 * Bridges between JavaScript and Python
 */

import { PythonError, createPythonError } from './python-errors';

/**
 * Bridge function
 */
export type BridgeFunction = (...args: any[]) => any;

/**
 * Bridge options
 */
export interface BridgeOptions {
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: Required<BridgeOptions> = {
  debug: false,
};

/**
 * JavaScript Bridge
 */
export class JavaScriptBridge {
  private options: Required<BridgeOptions>;
  private functions: Map<string, BridgeFunction> = new Map();
  private initialized = false;

  constructor(options: BridgeOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Initialize the bridge
   */
  initialize(): void {
    if (this.initialized) {
      return;
    }

    // Register default functions
    this.register('console.log', (...args: any[]) => {
      console.log('[Python]', ...args);
    });

    this.register('console.warn', (...args: any[]) => {
      console.warn('[Python]', ...args);
    });

    this.register('console.error', (...args: any[]) => {
      console.error('[Python]', ...args);
    });

    this.register('document.getElementById', (id: string) => {
      if (typeof document !== 'undefined') {
        return document.getElementById(id);
      }
      return null;
    });

    this.register('document.querySelector', (selector: string) => {
      if (typeof document !== 'undefined') {
        return document.querySelector(selector);
      }
      return null;
    });

    this.initialized = true;
    this.log('JavaScript bridge initialized');
  }

  /**
   * Register a JavaScript function
   */
  register(name: string, fn: BridgeFunction): void {
    this.functions.set(name, fn);
    this.log(`Registered function: ${name}`);
  }

  /**
   * Call a JavaScript function
   */
  call(name: string, ...args: any[]): any {
    const fn = this.functions.get(name);
    if (!fn) {
      throw createPythonError(
        `JavaScript function '${name}' not found`,
        'BRIDGE_FUNCTION_NOT_FOUND'
      );
    }

    try {
      return fn(...args);
    } catch (error) {
      throw createPythonError(
        `Error calling JavaScript function '${name}': ${error instanceof Error ? error.message : String(error)}`,
        'BRIDGE_CALL_ERROR'
      );
    }
  }

  /**
   * Get bridge code for Python
   */
  getBridgeCode(): string {
    return `
import json

class FyrBridge:
    def __init__(self):
        self._functions = {}
        self._register_functions()

    def _register_functions(self):
        # These will be overridden by JavaScript
        pass

    def call(self, name, *args):
        # This will be overridden by JavaScript
        print(f"Calling JavaScript function: {name}")
        return None

    def log(self, *args):
        return self.call('console.log', *args)

    def warn(self, *args):
        return self.call('console.warn', *args)

    def error(self, *args):
        return self.call('console.error', *args)

    def get_element_by_id(self, id):
        return self.call('document.getElementById', id)

    def query_selector(self, selector):
        return self.call('document.querySelector', selector)

    def to_js(self, obj):
        """Convert Python object to JavaScript"""
        return obj

    def to_py(self, obj):
        """Convert JavaScript object to Python"""
        return obj

# Global bridge instance
fyr = FyrBridge()

# Helper functions
def js(obj):
    """Convert Python object to JavaScript"""
    return fyr.to_js(obj)

def py(obj):
    """Convert JavaScript object to Python"""
    return fyr.to_py(obj)
    `;
  }

  /**
   * Log debug message
   */
  private log(message: string, ...data: any[]): void {
    if (this.options.debug) {
      console.log(`[JS Bridge] ${message}`, ...data);
    }
  }

  /**
   * Get registered functions
   */
  getFunctions(): string[] {
    return Array.from(this.functions.keys());
  }

  /**
   * Check if a function is registered
   */
  hasFunction(name: string): boolean {
    return this.functions.has(name);
  }

  /**
   * Remove a registered function
   */
  unregister(name: string): boolean {
    return this.functions.delete(name);
  }

  /**
   * Clear all registered functions
   */
  clear(): void {
    this.functions.clear();
  }
}

/**
 * Default JavaScript bridge instance
 */
export const javaScriptBridge = new JavaScriptBridge();