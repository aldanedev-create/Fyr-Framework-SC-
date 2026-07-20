import { scanDOM } from './dom-scanner';
import { getAllDirectives } from '../directives/registry';
import { ensureBuiltInDirectives } from '../directives/builtins';
import type { ControllerInstance } from '../types';

/** Apply registered directives to a rendered application tree. */
export function renderTree(root: HTMLElement, controller: ControllerInstance): void {
  ensureBuiltInDirectives();
  scanDOM(root, { controller, rootElement: root }, getAllDirectives());
}
