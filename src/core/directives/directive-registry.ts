import { getDirective, registerDirective } from './registry';
import type { DirectiveHandler } from './types';

/** Register a directive and return its handler for fluent public API use. */
export function directive(name: string, handler: DirectiveHandler): DirectiveHandler {
  registerDirective(name, handler);
  return getDirective(name)!;
}
export * from './registry';
