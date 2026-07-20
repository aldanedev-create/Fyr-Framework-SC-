/**
 * Scheduler
 * Controls when reactive updates occur
 */

/** Pending render tasks */
const pendingRenders = new Set<() => void>();

/** Is a render already scheduled */
let isRenderScheduled = false;

/** Render queue for microtask batching */
const renderQueue: Array<() => void> = [];

/** Current flush state */
let isFlushing = false;

/**
 * Schedule a render/update
 * @param fn - Render function to schedule
 */
export function scheduleRender(fn?: () => void): void {
  if (fn) {
    pendingRenders.add(fn);
  }

  if (!isRenderScheduled) {
    isRenderScheduled = true;

    if (typeof queueMicrotask !== 'undefined') {
      queueMicrotask(() => {
        flushRenders();
      });
    } else {
      // Fallback for older browsers
      Promise.resolve().then(() => {
        flushRenders();
      });
    }
  }
}

/**
 * Flush all pending renders
 */
export function flushRenders(): void {
  if (isFlushing) return;

  isFlushing = true;
  isRenderScheduled = false;

  // Collect all pending renders
  const renders = Array.from(pendingRenders);
  pendingRenders.clear();

  // Execute each render
  for (const render of renders) {
    try {
      render();
    } catch (error) {
      console.error('Render error:', error);
    }
  }

  isFlushing = false;
}

/**
 * Schedule a render at the end of the current event loop
 * @param fn - Render function
 */
export function schedulePostRender(fn: () => void): void {
  if (typeof queueMicrotask !== 'undefined') {
    queueMicrotask(fn);
  } else {
    Promise.resolve().then(fn);
  }
}

/**
 * Schedule a render with animation frame
 * @param fn - Render function
 */
export function scheduleAnimationFrame(fn: () => void): void {
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(fn);
  } else {
    setTimeout(fn, 16); // ~60fps fallback
  }
}

/**
 * Next tick - runs after current microtask queue
 * @param fn - Function to run
 */
export function nextTick(fn: () => void): void {
  if (typeof queueMicrotask !== 'undefined') {
    queueMicrotask(fn);
  } else {
    Promise.resolve().then(fn);
  }
}

/**
 * Wait for next tick (promise version)
 * @returns Promise that resolves on next tick
 */
export function nextTickPromise(): Promise<void> {
  return new Promise((resolve) => {
    nextTick(resolve);
  });
}

/**
 * Check if renders are currently being flushed
 */
export function isFlushingRenders(): boolean {
  return isFlushing;
}

/**
 * Clear pending renders (for testing)
 */
export function clearPendingRenders(): void {
  pendingRenders.clear();
  isRenderScheduled = false;
}

/**
 * Get number of pending renders (for testing)
 */
export function getPendingRenderCount(): number {
  return pendingRenders.size;
}