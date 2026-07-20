/**
 * Directives System - Main Export
 * Exports all built-in directives and the registry
 */

export { directiveRegistry, registerDirective, getDirective, hasDirective, getAllDirectives } from './registry';

export { fyrAppDirective } from './fyr-app';
export { fyrControllerDirective } from './fyr-controller';
export { fyrTextDirective } from './fyr-text';
export { fyrHtmlDirective } from './fyr-html';
export { fyrModelDirective } from './fyr-model';
export { fyrClickDirective } from './fyr-click';
export { fyrOnDirective } from './fyr-on';
export { fyrShowDirective } from './fyr-show';
export { fyrIfDirective } from './fyr-if';
export { fyrForDirective } from './fyr-for';
export { fyrSubmitDirective } from './fyr-submit';
export { fyrBindDirective } from './fyr-bind';
export { fyrClassDirective } from './fyr-class';
export { fyrStyleDirective } from './fyr-style';
export { fyrRefDirective } from './fyr-ref';
export { fyrInitDirective } from './fyr-init';
export { fyrCloakDirective } from './fyr-cloak';
export { fyrTransitionDirective } from './fyr-transition';

// Router directives (for SPA support)
export { fyrRouterDirective } from './fyr-router';
export { fyrRouteDirective } from './fyr-route';
export { fyrLinkDirective } from './fyr-link';

// Types
export type {
  DirectiveHandler,
  DirectiveContext,
  DirectiveRegistry,
  ParsedExpression,
  ExpressionType,
} from './types';