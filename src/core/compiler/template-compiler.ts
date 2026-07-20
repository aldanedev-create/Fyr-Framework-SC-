import { compileNode } from './node-compiler';
import { getAllDirectives } from '../directives/registry';
import type { CompiledNode, DirectiveContext } from '../directives/types';

/** Compile an element or template into the runtime's directive tree. */
export function compileTemplate(
  template: HTMLElement | HTMLTemplateElement,
  context: DirectiveContext
): CompiledNode | null {
  const root = template instanceof HTMLTemplateElement ? template.content.firstElementChild : template;
  return root ? compileNode(root, context, getAllDirectives()) : null;
}
