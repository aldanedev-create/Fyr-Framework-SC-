/**
 * Components System - Main Export
 */

export { defineComponent } from './define-component';
export {
  componentRegistry,
  registerComponent,
  getComponent,
  hasComponent,
  getAllComponents,
  removeComponent,
  clearComponents,
} from './component-registry';
export {
  createComponentInstance,
  mountComponentInstance,
  destroyComponentInstance,
  findComponentInstance,
  getComponentInstance,
} from './component-instance';
export { parseProps, validateProps, mergeProps, type PropDefinition, type PropType } from './props';
export { renderSlots, type SlotRenderer, type SlotContext } from './slots';
export {
  createEventEmitter,
  emitComponentEvent,
  onComponentEvent,
  type ComponentEvent,
  type ComponentEventEmitter,
} from './events';