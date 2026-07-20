/**
 * Throttle
 * Ensures a function is called at most once in a specified time period
 */

/**
 * Throttle options
 */
export interface ThrottleOptions {
  /** Whether to call the function on the leading edge */
  leading?: boolean;
  /** Whether to call the function on the trailing edge */
  trailing?: boolean;
}

/**
 * Default throttle options
 */
const DEFAULT_OPTIONS: Required<ThrottleOptions> = {
  leading: true,
  trailing: true,
};

/**
 * Throttle a function
 * @param fn - Function to throttle
 * @param limit - Time limit in milliseconds
 * @param options - Throttle options
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number = 300,
  options: ThrottleOptions = {}
): T & { cancel: () => void; flush: () => void } {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;
  let lastCallTime: number = 0;
  let result: ReturnType<T>;

  const invoke = () => {
    const args = lastArgs!;
    const context = lastThis!;
    lastArgs = null;
    lastThis = null;
    lastCallTime = Date.now();
    result = fn.apply(context, args);
    return result;
  };

  const throttled = function (this: any, ...args: Parameters<T>): ReturnType<T> {
    const now = Date.now();

    if (lastCallTime === 0 && opts.leading !== false) {
      lastCallTime = now;
      result = fn.apply(this, args);
      return result;
    }

    const remaining = limit - (now - lastCallTime);

    lastArgs = args;
    lastThis = this;

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCallTime = now;
      result = fn.apply(this, args);
      return result;
    }

    if (opts.trailing !== false && !timeoutId) {
      timeoutId = setTimeout(() => {
        timeoutId = null;
        if (lastArgs) {
          invoke();
        }
      }, remaining);
    }

    return result;
  };

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
    lastThis = null;
    lastCallTime = 0;
  };

  throttled.flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      if (lastArgs) {
        invoke();
      }
    }
  };

  return throttled as T & { cancel: () => void; flush: () => void };
}

/**
 * Throttle an async function
 * @param fn - Async function to throttle
 * @param limit - Time limit in milliseconds
 * @param options - Throttle options
 * @returns Throttled async function
 */
export function throttleAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  limit: number = 300,
  options: ThrottleOptions = {}
): T & { cancel: () => void; flush: () => void } {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;
  let lastCallTime: number = 0;
  let pendingPromise: Promise<any> | null = null;
  let resolveList: Array<(value: any) => void> = [];
  let rejectList: Array<(reason: any) => void> = [];

  const invoke = async () => {
    const args = lastArgs!;
    const context = lastThis!;
    lastArgs = null;
    lastThis = null;
    lastCallTime = Date.now();

    try {
      const result = await fn.apply(context, args);
      for (const resolve of resolveList) {
        resolve(result);
      }
      return result;
    } catch (error) {
      for (const reject of rejectList) {
        reject(error);
      }
      throw error;
    } finally {
      pendingPromise = null;
      resolveList = [];
      rejectList = [];
    }
  };

  const throttled = function (this: any, ...args: Parameters<T>): Promise<ReturnType<T>> {
    const now = Date.now();

    if (lastCallTime === 0 && opts.leading !== false) {
      lastCallTime = now;
      return fn.apply(this, args);
    }

    const remaining = limit - (now - lastCallTime);

    lastArgs = args;
    lastThis = this;

    if (pendingPromise) {
      // Return existing promise
      return pendingPromise;
    }

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCallTime = now;
      pendingPromise = invoke();
      return pendingPromise;
    }

    if (opts.trailing !== false && !timeoutId) {
      timeoutId = setTimeout(() => {
        timeoutId = null;
        if (lastArgs) {
          pendingPromise = invoke();
        }
      }, remaining);
    }

    // Create a promise that will be resolved when the throttled function runs
    if (!pendingPromise) {
      pendingPromise = new Promise((resolve, reject) => {
        resolveList.push(resolve);
        rejectList.push(reject);
      });
    }

    return pendingPromise;
  };

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
    lastThis = null;
    lastCallTime = 0;
    if (pendingPromise) {
      for (const reject of rejectList) {
        reject(new Error('Throttled function cancelled'));
      }
      pendingPromise = null;
      resolveList = [];
      rejectList = [];
    }
  };

  throttled.flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      if (lastArgs) {
        pendingPromise = invoke();
      }
    }
  };

  return throttled as T & { cancel: () => void; flush: () => void };
}

/**
 * Create a throttled function with default options
 */
export function createThrottle(
  limit: number = 300,
  options: ThrottleOptions = {}
): <T extends (...args: any[]) => any>(fn: T) => T & { cancel: () => void; flush: () => void } {
  return (fn: any) => throttle(fn, limit, options);
}