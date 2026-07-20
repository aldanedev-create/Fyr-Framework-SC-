/**
 * Fyr Framework Core
 * CDN-first reactive web framework
 * 
 * @module Fyr
 */

export { Fyr } from './fyr';
export { createApp } from './app/create-app';
export { mountApp } from './app/mount-app';
export { destroyApp } from './app/destroy-app';
export { appRegistry, getApp, hasApp, getAllApps } from './app/app-registry';

// Core types
export type {
  FyrConfig,
  FyrController,
  FyrControllerDefinition,
  FyrComponent,
  FyrComponentDefinition,
  FyrDirective,
  FyrDirectiveHandler,
  FyrPlugin,
  FyrPluginInstall,
  ReactiveState,
  ComputedValue,
  Watcher,
  LifecycleHook,
} from './types';

// HTTP types
export type {
  HttpOptions,
  HttpMethod,
  HttpHeaders,
  HttpError,
  HttpInterceptor,
  FyrHttpError,
} from './http/types';

// Directive types
export type {
  DirectiveRegistry,
  DirectiveHandler,
  DirectiveContext,
} from './directives/types';

// Utility types
export type {
  DeepPartial,
  DeepReadonly,
  AnyFunction,
  AnyObject,
  Path,
  PathValue,
  NestedKey,
  NestedValue,
} from './utilities/types';