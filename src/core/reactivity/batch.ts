/**
 * Batch Updates
 * Groups multiple state changes into a single update
 */

/** Pending updates queue */
let pendingUpdates: Array<() => void> = [];

/** Is update already scheduled */
let isScheduled = false;

/** Batch depth for nested batches */
let batchDepth = 0;

/**
 * Batch multiple updates together
 * @param fn - Function that performs updates
 * @returns Result of the function
 */
export function batch<T>(fn: () => T): T {
  batchDepth++;

  try {
    const result = fn();
    return result;
  } finally {
    batchDepth--;

    // Flush when no more nested batches
    if (batchDepth === 0) {
      flushUpdates();
    }
  }
}

/**
 * Schedule an update function
 * @param update - Update function
 */
export function scheduleUpdate(update: () => void): void {
  pendingUpdates.push(update);

  if (!isScheduled) {
    isScheduled = true;

    // Use microtask for async batching
    if (typeof queueMicrotask !== 'undefined') {
      queueMicrotask(() => {
        flushUpdates();
      });
    } else {
      // Fallback for older browsers
      setTimeout(() => {
        flushUpdates();
      }, 0);
    }
  }
}

/**
 * Flush all pending updates
 */
export function flushUpdates(): void {
  if (pendingUpdates.length === 0) {
    isScheduled = false;
    return;
  }

  const updates = pendingUpdates;
  pendingUpdates = [];
  isScheduled = false;

  // Execute all updates
  for (const update of updates) {
    try {
      update();
    } catch (error) {
      console.error('Batch update error:', error);
    }
  }
}

/**
 * Check if currently in a batch
 */
export function isBatching(): boolean {
  return batchDepth > 0;
}

/**
 * Get number of pending updates (for testing/debugging)
 */
export function getPendingUpdateCount(): number {
  return pendingUpdates.length;
}

/**
 * Clear pending updates (for testing)
 */
export function clearPendingUpdates(): void {
  pendingUpdates = [];
  isScheduled = false;
}