/**
 * fyr-controller Directive
 * Binds a controller to an element
 */

import type { DirectiveHandler, DirectiveContext } from './types';
import { createControllerInstance, mountControllerInstance } from '../controllers/controller-instance';
import { getController, hasController } from '../controllers/controller-registry';

/**
 * fyr-controller directive handler
 * Creates and mounts a controller instance
 */
export const fyrControllerDirective: DirectiveHandler = (
  element: HTMLElement,
  expression: string,
  context: DirectiveContext
): void => {
  const controllerName = expression.trim();

  if (!controllerName) {
    console.warn('fyr-controller requires a name');
    return;
  }

  // Check if controller exists
  if (!hasController(controllerName)) {
    console.warn(`Controller '${controllerName}' not found`);
    return;
  }

  // Check if already mounted
  if ((element as any).__fyrController) {
    return;
  }

  // Find parent controller for context
  let parentController = context.controller;
  let parentElement = element.parentElement;
  while (parentElement && !parentController) {
    if ((parentElement as any).__fyrController) {
      parentController = (parentElement as any).__fyrController;
    }
    parentElement = parentElement.parentElement;
  }

  // Create controller instance
  const instance = createControllerInstance(controllerName, {
    el: element,
    parent: parentController || null,
    props: {},
  });

  // Store on element
  (element as any).__fyrController = instance;

  // Update context with new controller
  const newContext: DirectiveContext = {
    ...context,
    controller: instance,
  };

  // Set up cleanup
  const cleanup = () => {
    if (instance && !instance._isDestroyed) {
      // Destroy will handle cleanup
    }
  };

  if (typeof (element as any).__fyrCleanups === 'undefined') {
    (element as any).__fyrCleanups = [];
  }
  (element as any).__fyrCleanups.push(cleanup);

  // Mount the controller (async but don't await)
  mountControllerInstance(instance).catch((error) => {
    console.error(`Error mounting controller '${controllerName}':`, error);
  });
};