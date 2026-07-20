import { hasDirective, registerDirective } from './registry';
import { fyrAppDirective } from './fyr-app';
import { fyrBindDirective } from './fyr-bind';
import { fyrClassDirective } from './fyr-class';
import { fyrClickDirective } from './fyr-click';
import { fyrCloakDirective } from './fyr-cloak';
import { fyrControllerDirective } from './fyr-controller';
import { fyrForDirective } from './fyr-for';
import { fyrHtmlDirective } from './fyr-html';
import { fyrIfDirective } from './fyr-if';
import { fyrInitDirective } from './fyr-init';
import { fyrModelDirective } from './fyr-model';
import { fyrOnDirective } from './fyr-on';
import { fyrRefDirective } from './fyr-ref';
import { fyrShowDirective } from './fyr-show';
import { fyrStyleDirective } from './fyr-style';
import { fyrSubmitDirective } from './fyr-submit';
import { fyrTextDirective } from './fyr-text';
import { fyrTransitionDirective } from './fyr-transition';
import type { DirectiveHandler } from './types';

const builtins: ReadonlyArray<readonly [string, DirectiveHandler]> = [
  ['app', fyrAppDirective], ['bind', fyrBindDirective], ['class', fyrClassDirective],
  ['click', fyrClickDirective], ['cloak', fyrCloakDirective], ['controller', fyrControllerDirective],
  ['for', fyrForDirective], ['html', fyrHtmlDirective], ['if', fyrIfDirective], ['init', fyrInitDirective],
  ['model', fyrModelDirective], ['on', fyrOnDirective], ['ref', fyrRefDirective], ['show', fyrShowDirective],
  ['style', fyrStyleDirective], ['submit', fyrSubmitDirective], ['text', fyrTextDirective], ['transition', fyrTransitionDirective],
];

/** Registers each core directive once while preserving application overrides. */
export function ensureBuiltInDirectives(): void {
  for (const [name, handler] of builtins) {
    if (!hasDirective(name)) registerDirective(name, handler);
  }
}
