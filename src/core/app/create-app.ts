/**
 * App Creation
 * Creates a new Fyr application instance
 */

import { appRegistry } from './app-registry';
import { createReactiveState } from '../reactivity/reactive-state';
import { compileTemplate } from '../compiler/template-compiler';
import { createController } from '../controllers/controller-factory';
import { deepClone } from '../utilities/object-utils';

import type {
  FyrApp,
  FyrAppOptions,
  FyrControllerDefinition,
  ReactiveState,
} from '../types';

/**
 * Create a new Fyr application
 * @param name - Application name (must be unique)
 * @param options - Application options
 * @returns Application instance
 * @throws {Error} If app name already exists
 */
export function createApp(
  name: string,
  options: FyrAppOptions = {}
): FyrApp {
  // Check for duplicate app name
  if (appRegistry.has(name)) {
    throw new Error(`Fyr app '${name}' is already registered`);
  }

  // Default options
  const {
    el = `[fyr-app="${name}"]`,
    state = {},
    methods = {},
    computed = {},
    watch = {},
    plugins = [],
    mounted,
    beforeDestroy,
    destroyed,
  } = options;

  // Create reactive state
  const reactiveState = createReactiveState(state);

  // Create controller instance
  const controller = createController({
    name,
    state: reactiveState,
    methods,
    computed,
    watch,
    lifecycle: {
      mounted,
      beforeDestroy,
      destroyed,
    },
  });

  // Build app instance
  const app: FyrApp = {
    name,
    el,
    state: reactiveState,
    controller,
    mounted,
    beforeDestroy,
    destroyed,
    plugins,
    _isMounted: false,
    _isDestroyed: false,
    _rootElement: null,
  };

  // Register app
  appRegistry.set(name, app);

  // Install plugins
  for (const plugin of plugins) {
    if (typeof plugin.install === 'function') {
      plugin.install(app);
    }
  }

  return app;
}

/**
 * Application options interface
 */
export interface FyrAppOptions {
  /** DOM selector or element */
  el?: string | HTMLElement;

  /** Initial state */
  state?: Record<string, any>;

  /** Controller methods */
  methods?: Record<string, Function>;

  /** Computed values */
  computed?: Record<string, () => any>;

  /** Watchers */
  watch?: Record<string, (newVal: any, oldVal: any) => void>;

  /** Plugins to install */
  plugins?: Array<{ install: (app: FyrApp) => void }>;

  /** Mounted lifecycle hook */
  mounted?: () => void | Promise<void>;

  /** Before destroy lifecycle hook */
  beforeDestroy?: () => void;

  /** Destroyed lifecycle hook */
  destroyed?: () => void;
}