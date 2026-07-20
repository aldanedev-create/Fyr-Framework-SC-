/**
 * Memory Manager
 * Manages WASM memory allocation and deallocation
 */

import { WasmError, createWasmError } from './wasm-errors';

/**
 * Memory manager options
 */
export interface MemoryManagerOptions {
  /** Max memory in MB */
  maxMemory?: number;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Memory allocation
 */
export interface MemoryAllocation {
  /** Pointer address */
  ptr: number;
  /** Size in bytes */
  size: number;
  /** Allocated timestamp */
  allocatedAt: number;
  /** Last used timestamp */
  lastUsed: number;
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: Required<MemoryManagerOptions> = {
  maxMemory: 256,
  debug: false,
};

/**
 * Memory Manager
 */
export class MemoryManager {
  private options: Required<MemoryManagerOptions>;
  private allocations: Map<number, MemoryAllocation> = new Map();
  private moduleMemories: Map<string, WebAssembly.Memory> = new Map();
  private totalAllocated = 0;

  constructor(options: MemoryManagerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Register a memory for a module
   */
  registerMemory(name: string, memory: WebAssembly.Memory): void {
    this.moduleMemories.set(name, memory);
    this.log(`Registered memory for module: ${name}`);
  }

  /**
   * Unregister a memory for a module
   */
  unregisterMemory(name: string): void {
    this.moduleMemories.delete(name);
    this.log(`Unregistered memory for module: ${name}`);
  }

  /**
   * Get memory for a module
   */
  getMemory(name: string): WebAssembly.Memory | undefined {
    return this.moduleMemories.get(name);
  }

  /**
   * Allocate memory
   */
  allocate(module: string, size: number): number {
    const memory = this.moduleMemories.get(module);
    if (!memory) {
      throw createWasmError(
        `No memory found for module: ${module}`,
        'MEMORY_NOT_FOUND'
      );
    }

    // Check memory limit
    if (this.totalAllocated + size > this.options.maxMemory * 1024 * 1024) {
      throw createWasmError(
        `Memory limit exceeded: ${this.options.maxMemory}MB`,
        'MEMORY_LIMIT_EXCEEDED'
      );
    }

    // Allocate pointer
    const ptr = this.findFreeMemory(size);
    const allocation: MemoryAllocation = {
      ptr,
      size,
      allocatedAt: Date.now(),
      lastUsed: Date.now(),
    };

    this.allocations.set(ptr, allocation);
    this.totalAllocated += size;

    this.log(`Allocated ${size} bytes at pointer ${ptr} for module ${module}`);
    return ptr;
  }

  /**
   * Free allocated memory
   */
  free(ptr: number): boolean {
    const allocation = this.allocations.get(ptr);
    if (!allocation) {
      this.log(`Attempted to free invalid pointer: ${ptr}`);
      return false;
    }

    this.totalAllocated -= allocation.size;
    this.allocations.delete(ptr);

    this.log(`Freed ${allocation.size} bytes at pointer ${ptr}`);
    return true;
  }

  /**
   * Find free memory space
   */
  private findFreeMemory(size: number): number {
    // Simple implementation - just use the next available address
    // In a real implementation, this would use a more sophisticated allocator
    let ptr = 0;
    const sorted = Array.from(this.allocations.keys()).sort((a, b) => a - b);

    for (const allocated of sorted) {
      const alloc = this.allocations.get(allocated)!;
      if (allocated - ptr >= size) {
        break;
      }
      ptr = allocated + alloc.size;
    }

    return ptr;
  }

  /**
   * Read memory
   */
  read(module: string, ptr: number, length: number): Uint8Array {
    const memory = this.moduleMemories.get(module);
    if (!memory) {
      throw createWasmError(
        `No memory found for module: ${module}`,
        'MEMORY_NOT_FOUND'
      );
    }

    const buffer = new Uint8Array(memory.buffer, ptr, length);
    return buffer.slice();
  }

  /**
   * Write memory
   */
  write(module: string, ptr: number, data: Uint8Array): void {
    const memory = this.moduleMemories.get(module);
    if (!memory) {
      throw createWasmError(
        `No memory found for module: ${module}`,
        'MEMORY_NOT_FOUND'
      );
    }

    const buffer = new Uint8Array(memory.buffer);
    buffer.set(data, ptr);

    // Update last used
    const allocation = this.allocations.get(ptr);
    if (allocation) {
      allocation.lastUsed = Date.now();
    }
  }

  /**
   * Read a string from memory
   */
  readString(module: string, ptr: number): string {
    const memory = this.moduleMemories.get(module);
    if (!memory) {
      throw createWasmError(
        `No memory found for module: ${module}`,
        'MEMORY_NOT_FOUND'
      );
    }

    const buffer = new Uint8Array(memory.buffer);
    const bytes: number[] = [];

    for (let i = ptr; i < buffer.length; i++) {
      if (buffer[i] === 0) break;
      bytes.push(buffer[i]);
    }

    return new TextDecoder().decode(new Uint8Array(bytes));
  }

  /**
   * Write a string to memory
   */
  writeString(module: string, ptr: number, str: string): void {
    const memory = this.moduleMemories.get(module);
    if (!memory) {
      throw createWasmError(
        `No memory found for module: ${module}`,
        'MEMORY_NOT_FOUND'
      );
    }

    const data = new TextEncoder().encode(str + '\0');
    const buffer = new Uint8Array(memory.buffer);
    buffer.set(data, ptr);

    // Update last used
    const allocation = this.allocations.get(ptr);
    if (allocation) {
      allocation.lastUsed = Date.now();
    }
  }

  /**
   * Get memory stats
   */
  getStats(): {
    totalAllocated: number;
    maxMemory: number;
    allocationCount: number;
    moduleCount: number;
  } {
    return {
      totalAllocated: this.totalAllocated,
      maxMemory: this.options.maxMemory * 1024 * 1024,
      allocationCount: this.allocations.size,
      moduleCount: this.moduleMemories.size,
    };
  }

  /**
   * Clean up old allocations
   */
  cleanup(maxAge: number = 60000): void {
    const now = Date.now();
    const toRemove: number[] = [];

    for (const [ptr, allocation] of this.allocations) {
      if (now - allocation.lastUsed > maxAge) {
        toRemove.push(ptr);
      }
    }

    for (const ptr of toRemove) {
      this.free(ptr);
    }

    this.log(`Cleaned up ${toRemove.length} old allocations`);
  }

  /**
   * Log debug message
   */
  private log(message: string, ...data: any[]): void {
    if (this.options.debug) {
      console.log(`[Memory Manager] ${message}`, ...data);
    }
  }
}

/**
 * Default memory manager instance
 */
export const memoryManager = new MemoryManager();