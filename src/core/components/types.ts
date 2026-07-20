/**
 * Components - Type Definitions
 */

import type { ControllerInstance } from '../types';

/**
 * Component definition
 */
export interface ComponentDefinition {
  name: string;
  props: Record<string, PropDefinition>;
  state: ComponentState;
  methods: ComponentMethods;
  computed: ComponentComputed;
  watch: ComponentWatch;
  template: string;
  templateUrl: string;
  slots: Record<string, SlotDefinition>;
  mounted?: (this: ComponentInstance) => void | Promise<void>;
  beforeDestroy?: (this: ComponentInstance) => void;
  destroyed?: (this: ComponentInstance) => void;
  _options?: ComponentOptions;
}

/**
 * Component options (user-defined)
 */
export interface ComponentOptions {
  props?: Record<string, PropDefinition | PropType | any>;
  state?: ComponentState;
  methods?: ComponentMethods;
  computed?: ComponentComputed;
  watch?: ComponentWatch;
  template?: string;
  templateUrl?: string;
  slots?: Record<string, SlotDefinition>;
  mounted?: (this: ComponentInstance) => void | Promise<void>;
  beforeDestroy?: (this: ComponentInstance) => void;
  destroyed?: (this: ComponentInstance) => void;
}

/**
 * Component state
 */
export interface ComponentState {
  [key: string]: any;
}

/**
 * Component methods
 */
export interface ComponentMethods {
  [key: string]: Function;
}

/**
 * Component computed values
 */
export interface ComponentComputed {
  [key: string]: (this: ComponentInstance) => any;
}

/**
 * Component watchers
 */
export interface ComponentWatch {
  [key: string]: (this: ComponentInstance, newVal: any, oldVal: any) => void;
}

/**
 * Component instance
 */
export interface ComponentInstance {
  name: string;
  definition: ComponentDefinition;
  state: ComponentState;
  props: Record<string, any>;
  methods: ComponentMethods;
  computed: Record<string, { value: any }>;
  slots: Record<string, string>;
  emit: <T>(event: string, detail?: T) => ComponentEvent<T>;
  el: HTMLElement | null;
  parent: ControllerInstance | ComponentInstance | null;
  _isMounted: boolean;
  _isDestroyed: boolean;
  _watchers: Array<() => void>;
  _cleanups: Array<() => void>;
}

/**
 * Component context
 */
export interface ComponentContext {
  el?: HTMLElement;
  parent?: ControllerInstance | ComponentInstance;
  slots?: Record<string, string>;
  props?: Record<string, any>;
}

/**
 * Prop definition
 */
export interface PropDefinition {
  type: PropType | PropType[];
  required?: boolean;
  default?: any;
  validator?: (value: any) => boolean;
}

/**
 * Prop type
 */
export type PropType = StringConstructor | NumberConstructor | BooleanConstructor | ObjectConstructor | ArrayConstructor | FunctionConstructor | SymbolConstructor;

/** Lifecycle hooks accepted by a component definition. */
export interface ComponentLifecycle {
  mounted?: (this: ComponentInstance) => void | Promise<void>;
  beforeDestroy?: (this: ComponentInstance) => void;
  destroyed?: (this: ComponentInstance) => void;
}

/**
 * Slot definition
 */
export interface SlotDefinition {
  name: string;
  defaultContent?: string;
}

/**
 * Component event
 */
export interface ComponentEvent<T = any> {
  type: string;
  detail: T;
  target?: any;
  bubbles?: boolean;
  cancelable?: boolean;
  defaultPrevented?: boolean;
}

/**
 * Component event listener
 */
export type ComponentEventListener<T = any> = (event: ComponentEvent<T>) => void;
