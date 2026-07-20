/**
 * Component Definition
 * Defines reusable Fyr components
 */

import type {
  ComponentDefinition,
  ComponentOptions,
  ComponentState,
  ComponentMethods,
  ComponentComputed,
  ComponentLifecycle,
  PropDefinition,
  SlotDefinition,
} from './types';
import { registerComponent } from './component-registry';
import { reactive } from '../reactivity/reactive';
import { computed } from '../reactivity/computed';
import { watch } from '../reactivity/watch';

/**
 * Define a new component
 * @param name - Component name (must be unique)
 * @param options - Component options
 * @returns Component definition
 */
export function defineComponent(
  name: string,
  options: ComponentOptions
): ComponentDefinition {
  // Validate component name
  if (!name || !/^[a-zA-Z][a-zA-Z0-9-]*$/.test(name)) {
    throw new Error(
      `Component name '${name}' is invalid. Use kebab-case or camelCase with letters and numbers.`
    );
  }

  // Validate template
  if (!options.template && !options.templateUrl) {
    throw new Error(`Component '${name}' must have a template or templateUrl.`);
  }

  // Validate props
  const props = options.props || {};

  // Build component definition
  const definition: ComponentDefinition = {
    name,
    props: parsePropsDefinition(props),
    state: options.state || {},
    methods: options.methods || {},
    computed: options.computed || {},
    watch: options.watch || {},
    template: options.template || '',
    templateUrl: options.templateUrl || '',
    slots: options.slots || {},
    mounted: options.mounted,
    beforeDestroy: options.beforeDestroy,
    destroyed: options.destroyed,
    // Store original options for reference
    _options: options,
  };

  // Register the component
  registerComponent(name, definition);

  return definition;
}

/**
 * Parse props definition
 * @param props - Props definition object
 * @returns Parsed props definition
 */
function parsePropsDefinition(
  props: Record<string, any>
): Record<string, PropDefinition> {
  const result: Record<string, PropDefinition> = {};

  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'function') {
      // Prop type only: { propName: String }
      result[key] = {
        type: value,
        required: false,
        default: undefined,
      };
    } else if (typeof value === 'object' && value !== null) {
      // Full prop definition: { propName: { type: String, required: true, default: '' } }
      result[key] = {
        type: value.type || String,
        required: value.required || false,
        default: value.default,
        validator: value.validator,
      };
    } else {
      // Simple prop: { propName: 'default value' }
      result[key] = {
        type: String,
        required: false,
        default: value,
      };
    }
  }

  return result;
}

/**
 * Create a component instance factory
 * @param definition - Component definition
 * @returns Factory function
 */
export function createComponentFactory(definition: ComponentDefinition) {
  return (props?: Record<string, any>, slots?: Record<string, any>) => {
    return {
      definition,
      props: props || {},
      slots: slots || {},
    };
  };
}

// Type exports for convenience
export type {
  ComponentDefinition,
  ComponentOptions,
  ComponentState,
  ComponentMethods,
  ComponentComputed,
  ComponentLifecycle,
  PropDefinition,
  SlotDefinition,
} from './types';