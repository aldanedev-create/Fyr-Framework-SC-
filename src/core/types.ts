/** Shared public contracts used by the core runtime. */

export type AnyFunction = (...args: any[]) => any;
export type AnyObject = Record<string, any>;
export type DeepPartial<T> = { [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P] };
export type DeepReadonly<T> = { readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P] };
export type Path<T> = Extract<keyof T, string>;
export type PathValue<T, P extends keyof T> = T[P];
export type NestedKey<T> = Extract<keyof T, string>;
export type NestedValue<T, P extends keyof T> = T[P];

export type ReactiveState = Record<string, any>;
export interface ComputedValue<T = any> { readonly value: T; }
export type Watcher<T = any> = (value: T, previous: T | undefined) => void;
export type LifecycleHook = (this: ControllerInstance, ...args: any[]) => void | Promise<void>;

export interface FyrConfig {
  debug?: boolean;
  warnHandler?: (message: string, error?: unknown) => void;
  errorHandler?: (error: unknown, context?: string) => void;
  [key: string]: unknown;
}

export interface HttpOptions {
  baseURL?: string;
  headers?: Record<string, string>;
  timeout?: number;
  credentials?: RequestCredentials;
}

export interface FyrControllerDefinition {
  state?: ReactiveState;
  methods?: Record<string, AnyFunction>;
  computed?: Record<string, (this: ControllerInstance) => any>;
  watch?: Record<string, Watcher>;
  mounted?: LifecycleHook;
  beforeDestroy?: LifecycleHook;
  destroyed?: LifecycleHook;
}

export interface FyrController extends FyrControllerDefinition {
  name: string;
  state: ReactiveState;
  methods: Record<string, AnyFunction>;
  computed: Record<string, (this: ControllerInstance) => any>;
  watch: Record<string, Watcher>;
}

export interface ControllerContext {
  el?: HTMLElement | null;
  parent?: ControllerInstance | null;
  props?: Record<string, any>;
}

export interface ControllerInstanceOptions extends ControllerContext {}

export interface ControllerInstance {
  name: string;
  state: ReactiveState;
  props: Record<string, any>;
  methods: Record<string, AnyFunction>;
  computed: Record<string, ComputedValue>;
  el: HTMLElement | null | undefined;
  parent: ControllerInstance | null | undefined;
  mounted?: LifecycleHook;
  beforeDestroy?: LifecycleHook;
  destroyed?: LifecycleHook;
  _isMounted: boolean;
  _isDestroyed: boolean;
  _watchers: Array<() => void>;
}

export interface FyrApp {
  name: string;
  el: string | HTMLElement;
  state: ReactiveState;
  controller: ControllerInstance;
  mounted?: () => void | Promise<void>;
  beforeDestroy?: () => void;
  destroyed?: () => void;
  plugins: Array<{ install: (app: FyrApp) => void | Promise<void> }>;
  _isMounted: boolean;
  _isDestroyed: boolean;
  _rootElement: HTMLElement | null;
  _renderEffect?: (() => void) | undefined;
}

export interface FyrComponentDefinition { name?: string; [key: string]: any; }
export interface FyrComponent { name: string; [key: string]: any; }
export type FyrDirective = (element: HTMLElement, expression: string, context: any) => void;
export type FyrDirectiveHandler = FyrDirective;

export interface FyrPlugin {
  name: string;
  install: (context: any) => void | Promise<void>;
  uninstall?: () => void | Promise<void>;
  dependencies?: string[];
}
export type FyrPluginInstall = FyrPlugin['install'];

/** Marker interface for the static Fyr API. */
export interface Fyr {}
