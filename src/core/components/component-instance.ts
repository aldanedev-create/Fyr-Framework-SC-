/**
 * Component Instance
 * Creates and manages component instances
 */

import type {
  ComponentDefinition,
  ComponentInstance,
  ComponentContext,
  ComponentState,
  ComponentMethods,
  ComponentComputed,
} from './types';
import { getComponent } from './component-registry';
import { parseProps, validateProps, mergeProps } from './props';
import { renderSlots } from './slots';
import { createEventEmitter } from './events';
import { reactive } from '../reactivity/reactive';
import { computed } from '../reactivity/computed';
import { watch } from '../reactivity/watch';
import { createEffect } from '../reactivity/effect';
import { registerCleanup } from '../compiler/cleanup';
import { scanDOM } from '../compiler/dom-scanner';
import { getDirective, getAllDirectives } from '../directives/registry';

/** Instance registry */
const instanceRegistry = new Map<string, ComponentInstance[]>();

/**
 * Create a component instance
 * @param name - Component name
 * @param props - Component props
 * @param context - Component context
 * @returns Component instance
 */
export function createComponentInstance(
  name: string,
  props: Record<string, any> = {},
  context: ComponentContext = {}
): ComponentInstance {
  // Get component definition
  const definition = getComponent(name);
  if (!definition) {
    throw new Error(`Component '${name}' not found`);
  }

  // Parse and validate props
  const parsedProps = parseProps(definition.props, props);
  validateProps(definition.props, parsedProps);

  // Merge props with defaults
  const mergedProps = mergeProps(definition.props, parsedProps);

  // Create event emitter
  const events = createEventEmitter();

  // Create reactive state
  const state = reactive(definition.state || {});

  // Create computed values
  const computedValues: Record<string, any> = {};
  if (definition.computed) {
    for (const [key, getter] of Object.entries(definition.computed)) {
      computedValues[key] = computed(() => {
        const instance = {
          state,
          props: mergedProps,
          methods: {},
          computed: computedValues,
          emit: events.emit,
        };
        return getter.call(instance);
      });
    }
  }

  // Create methods bound to instance
  const methods: Record<string, Function> = {};
  if (definition.methods) {
    for (const [key, method] of Object.entries(definition.methods)) {
      const instance = {
        state,
        props: mergedProps,
        methods,
        computed: computedValues,
        emit: events.emit,
      };
      methods[key] = method.bind(instance);
    }
  }

  // Create instance
  const instance: ComponentInstance = {
    name,
    definition,
    state,
    props: mergedProps,
    methods,
    computed: computedValues,
    slots: context.slots || {},
    emit: events.emit,
    el: context.el || null,
    parent: context.parent || null,
    _isMounted: false,
    _isDestroyed: false,
    _watchers: [],
    _cleanups: [],
  };

  // Set up watchers
  if (definition.watch) {
    for (const [key, handler] of Object.entries(definition.watch)) {
      const watchFn = () => {
        // Check state first, then computed, then props
        if (key in state) return state[key];
        if (key in computedValues) return computedValues[key]?.value;
        if (key in mergedProps) return mergedProps[key];
        return undefined;
      };

      const stop = watch(watchFn, (newVal, oldVal) => {
        handler.call(instance, newVal, oldVal);
      });

      instance._watchers.push(stop);
    }
  }

  // Register instance
  if (!instanceRegistry.has(name)) {
    instanceRegistry.set(name, []);
  }
  instanceRegistry.get(name)!.push(instance);

  return instance;
}

/**
 * Mount a component instance
 * @param instance - Component instance
 * @param container - Container element to render into
 */
export function mountComponentInstance(
  instance: ComponentInstance,
  container?: HTMLElement
): void {
  if (instance._isMounted) {
    console.warn(`Component '${instance.name}' is already mounted`);
    return;
  }

  // Get the template
  const template = getComponentTemplate(instance.definition);
  if (!template) {
    console.warn(`Component '${instance.name}' has no template`);
    return;
  }

  // Create container if not provided
  const mountEl = container || instance.el || document.createElement('div');
  instance.el = mountEl;

  // Render slots
  const slotContent = renderSlots(instance.definition.slots || {}, instance.slots || {});

  // Render template with slot content
  let templateHtml = template;
  if (slotContent) {
    // Replace slot placeholders with content
    for (const [slotName, content] of Object.entries(slotContent)) {
      const placeholder = `<slot name="${slotName}"></slot>`;
      templateHtml = templateHtml.replace(placeholder, content);
    }
    // Handle default slot
    if (slotContent.default) {
      templateHtml = templateHtml.replace(/<slot><\/slot>/g, slotContent.default);
    }
  }

  // Set inner HTML
  mountEl.innerHTML = templateHtml;

  // Get all directives for compilation
  const directives = getAllDirectives();

  // Compile the component content
  const context = {
    controller: null,
    component: instance,
    rootElement: mountEl,
  };

  // Scan and compile DOM
  scanDOM(mountEl, context, directives);

  // Call mounted hook
  if (instance.definition.mounted) {
    try {
      const result = instance.definition.mounted.call(instance);
      if (result instanceof Promise) {
        result.catch((error) => {
          console.error(`Component '${instance.name}' mounted hook error:`, error);
        });
      }
    } catch (error) {
      console.error(`Component '${instance.name}' mounted hook error:`, error);
    }
  }

  instance._isMounted = true;

  // Emit mounted event
  const event = new CustomEvent('fyr-component-mounted', {
    detail: {
      name: instance.name,
      instance,
    },
  });
  document.dispatchEvent(event);
}

/**
 * Destroy a component instance
 * @param instance - Component instance
 * @returns True if destroyed
 */
export function destroyComponentInstance(instance: ComponentInstance): boolean {
  if (instance._isDestroyed) {
    return false;
  }

  // Call beforeDestroy hook
  if (instance.definition.beforeDestroy) {
    try {
      instance.definition.beforeDestroy.call(instance);
    } catch (error) {
      console.error(`Component '${instance.name}' beforeDestroy hook error:`, error);
    }
  }

  // Stop all watchers
  for (const stop of instance._watchers) {
    try {
      stop();
    } catch (error) {
      console.error(`Component '${instance.name}' watcher cleanup error:`, error);
    }
  }
  instance._watchers = [];

  // Run all cleanups
  for (const cleanup of instance._cleanups) {
    try {
      cleanup();
    } catch (error) {
      console.error(`Component '${instance.name}' cleanup error:`, error);
    }
  }
  instance._cleanups = [];

  // Remove from registry
  const instances = instanceRegistry.get(instance.name);
  if (instances) {
    const index = instances.indexOf(instance);
    if (index !== -1) {
      instances.splice(index, 1);
    }
    if (instances.length === 0) {
      instanceRegistry.delete(instance.name);
    }
  }

  // Clear element
  if (instance.el) {
    instance.el.innerHTML = '';
    delete (instance.el as any).__fyrComponent;
  }

  // Mark as destroyed
  instance._isDestroyed = true;
  instance._isMounted = false;

  // Call destroyed hook
  if (instance.definition.destroyed) {
    try {
      instance.definition.destroyed.call(instance);
    } catch (error) {
      console.error(`Component '${instance.name}' destroyed hook error:`, error);
    }
  }

  // Emit destroyed event
  const event = new CustomEvent('fyr-component-destroyed', {
    detail: {
      name: instance.name,
      instance,
    },
  });
  document.dispatchEvent(event);

  return true;
}

/**
 * Get component template
 * @param definition - Component definition
 * @returns Template string or null
 */
function getComponentTemplate(definition: ComponentDefinition): string | null {
  if (definition.template) {
    return definition.template;
  }

  if (definition.templateUrl) {
    // In a real implementation, we would fetch the template
    // For now, warn and return null
    console.warn(`Template URL loading not implemented: ${definition.templateUrl}`);
    return null;
  }

  return null;
}

/**
 * Find a component instance on an element
 * @param el - DOM element
 * @returns Component instance or null
 */
export function findComponentInstance(el: HTMLElement): ComponentInstance | null {
  if ((el as any).__fyrComponent) {
    return (el as any).__fyrComponent;
  }

  let current: HTMLElement | null = el.parentElement;
  while (current) {
    if ((current as any).__fyrComponent) {
      return (current as any).__fyrComponent;
    }
    current = current.parentElement;
  }

  return null;
}

/**
 * Get component instance by name
 * @param name - Component name
 * @param index - Instance index (default: 0)
 * @returns Component instance or null
 */
export function getComponentInstance(name: string, index: number = 0): ComponentInstance | null {
  const instances = instanceRegistry.get(name);
  if (!instances || instances.length <= index) {
    return null;
  }
  return instances[index];
}

/**
 * Get all instances of a component
 * @param name - Component name
 * @returns Array of instances
 */
export function getComponentInstances(name: string): ComponentInstance[] {
  return instanceRegistry.get(name) || [];
}

/**
 * Get all component instances
 * @returns Array of all instances
 */
export function getAllComponentInstances(): ComponentInstance[] {
  const all: ComponentInstance[] = [];
  for (const instances of instanceRegistry.values()) {
    all.push(...instances);
  }
  return all;
}