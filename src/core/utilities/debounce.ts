/**
 * Debounce
 * Limits the rate at which a function can be called
 */

/**
 * Debounce options
 */
export interface DebounceOptions {
  /** Whether to call the function on the leading edge */
  leading?: boolean;
  /** Whether to call the function on the trailing edge */
  trailing?: boolean;
  /** Maximum wait time before the function is called */
  maxWait?: number;
}

/**
 * Default debounce options
 */
const DEFAULT_OPTIONS: Required<DebounceOptions> = {
  leading: false,
  trailing: true,
  maxWait: 0,
};

/**
 * Debounce a function
 * @param fn - Function to debounce
 * @param wait - Wait time in milliseconds
 * @param options - Debounce options
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number = 300,
  options: DebounceOptions = {}
): T & { cancel: () => void; flush: () => void } {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;
  let lastCallTime: number = 0;
  let lastInvokeTime: number = 0;
  let result: ReturnType<T>;

  const invoke = () => {
    const args = lastArgs!;
    const context = lastThis!;
    lastArgs = null;
    lastThis = null;
    lastInvokeTime = Date.now();
    result = fn.apply(context, args);
    return result;
  };

  const startTimer = (pending: boolean) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const remaining = wait - (Date.now() - lastCallTime);

    if (remaining <= 0 || remaining > wait) {
      if (pending) {
        timeoutId = null;
        invoke();
      }
      return;
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (opts.trailing && lastArgs) {
        invoke();
      }
    }, remaining);
  };

  const debounced = function (this: any, ...args: Parameters<T>): ReturnType<T> {
    lastArgs = args;
    lastThis = this;
    lastCallTime = Date.now();

    const isInvoking = opts.leading && !timeoutId;

    if (isInvoking) {
      lastInvokeTime = Date.now();
      timeoutId = setTimeout(() => {
        timeoutId = null;
        if (opts.trailing && lastArgs) {
          invoke();
        }
      }, wait);
      result = fn.apply(this, args);
      return result;
    }

    if (timeoutId === null) {
      timeoutId = setTimeout(() => {
        timeoutId = null;
        if (opts.trailing && lastArgs) {
          invoke();
        }
      }, wait);
    }

    return result;
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = null;
    lastArgs = null;
    lastThis = null;
    lastCallTime = 0;
    lastInvokeTime = 0;
  };

  debounced.flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      if (lastArgs) {
        invoke();
      }
    }
  };

  return debounced as T & { cancel: () => void; flush: () => void };
}

/**
 * Debounce an async function
 * @param fn - Async function to debounce
 * @param wait - Wait time in milliseconds
 * @param options - Debounce options
 * @returns Debounced async function
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  wait: number = 300,
  options: DebounceOptions = {}
): T & { cancel: () => void; flush: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;
  let pendingPromise: Promise<any> | null = null;
  let resolveList: Array<(value: any) => void> = [];
  let rejectList: Array<(reason: any) => void> = [];

  const invoke = async () => {
    const args = lastArgs!;
    const context = lastThis!;
    lastArgs = null;
    lastThis = null;

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

  const startTimer = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (lastArgs) {
        pendingPromise = invoke();
      }
    }, wait);
  };

  const debounced = function (this: any, ...args: Parameters<T>): Promise<ReturnType<T>> {
    lastArgs = args;
    lastThis = this;

    if (!pendingPromise) {
      startTimer();
      pendingPromise = new Promise((resolve, reject) => {
        resolveList.push(resolve);
        rejectList.push(reject);
      });
    } else {
      // Reset timer
      startTimer();
      // Add to existing promise
      return new Promise((resolve, reject) => {
        resolveList.push(resolve);
        rejectList.push(reject);
      });
    }

    return pendingPromise;
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
    lastThis = null;
    if (pendingPromise) {
      for (const reject of rejectList) {
        reject(new Error('Debounced function cancelled'));
      }
      pendingPromise = null;
      resolveList = [];
      rejectList = [];
    }
  };

  debounced.flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      if (lastArgs) {
        pendingPromise = invoke();
      }
    }
  };

  return debounced as T & { cancel: () => void; flush: () => void };
}

/**
 * Create a debounced function with default options
 */
export function createDebounce(
  wait: number = 300,
  options: DebounceOptions = {}
): <T extends (...args: any[]) => any>(fn: T) => T & { cancel: () => void; flush: () => void } {
  return (fn: any) => debounce(fn, wait, options);
}