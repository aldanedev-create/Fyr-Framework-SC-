import { createController as createControllerDefinition, instantiateController } from './controller';
import type { ControllerInstance, FyrControllerDefinition } from '../types';

export type ControllerFactoryDefinition = FyrControllerDefinition & {
  name: string;
  lifecycle?: Pick<FyrControllerDefinition, 'mounted' | 'beforeDestroy' | 'destroyed'>;
};

/** Normalizes application shorthand into a named controller definition. */
export function createController(definition: ControllerFactoryDefinition): ControllerInstance {
  const { name, lifecycle, ...options } = definition;
  return instantiateController(createControllerDefinition(name, { ...options, ...lifecycle }));
}
