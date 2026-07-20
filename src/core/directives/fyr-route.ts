/**
 * fyr-route Directive
 * Route outlet for displaying components
 */

import type { DirectiveHandler, DirectiveContext } from './types';
import { registerCleanup } from '../compiler/cleanup';
import { getController } from '../controllers/controller-registry';

/**
 * fyr-route directive handler
 * Renders components based on current route
 */
export const fyrRouteDirective: DirectiveHandler = (
  element: HTMLElement,
  expression: string,
  context: DirectiveContext
): void => {
  // Skip if already bound
  if ((element as any).__fyrRouteBound) {
    return;
  }
  (element as any).__fyrRouteBound = true;

  // Store as route outlet
  (element as any).__fyrRouteOutlet = true;

  // Listen for route render events
  const renderHandler = (event: CustomEvent) => {
    const { component, params, query } = event.detail;
    renderComponent(element, component, params, query, context);
  };

  element.addEventListener('fyr-render-route', renderHandler as EventListener);

  // Listen for route change events
  const routeChangeHandler = () => {
    // Re-render with current route
  };
  document.addEventListener('fyr-route-change', routeChangeHandler);

  // Register cleanup
  registerCleanup(element, () => {
    element.removeEventListener('fyr-render-route', renderHandler as EventListener);
    document.removeEventListener('fyr-route-change', routeChangeHandler);
    (element as any).__fyrRouteBound = false;
  });
};

/**
 * Render a component in the route outlet
 */
function renderComponent(
  element: HTMLElement,
  componentName: string,
  params: Record<string, string>,
  query: Record<string, string>,
  context: DirectiveContext
): void {
  // Clear the outlet
  element.innerHTML = '';

  // Get the component
  const component = getController(componentName);
  if (!component) {
    console.warn(`Route component '${componentName}' not found`);
    element.innerHTML = `<div>Component '${componentName}' not found</div>`;
    return;
  }

  // Create a container for the component
  const container = document.createElement('div');
  container.setAttribute('fyr-controller', componentName);
  container.setAttribute('data-route-params', JSON.stringify(params));
  container.setAttribute('data-route-query', JSON.stringify(query));
  element.appendChild(container);

  // The component will be mounted by the controller directive
  // We need to trigger the controller directive to mount it
  // This will happen naturally when the DOM is scanned
}