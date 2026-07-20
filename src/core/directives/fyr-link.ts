/**
 * fyr-link Directive
 * Navigation link for router
 */

import type { DirectiveHandler, DirectiveContext } from './types';
import { registerCleanup } from '../compiler/cleanup';
import { navigateTo, getCurrentRoute } from './fyr-router';

/**
 * fyr-link directive handler
 * Navigation link for SPA routing
 */
export const fyrLinkDirective: DirectiveHandler = (
  element: HTMLElement,
  expression: string,
  context: DirectiveContext
): void => {
  // Skip if already bound
  if ((element as any).__fyrLinkBound) {
    return;
  }
  (element as any).__fyrLinkBound = true;

  const href = expression.trim();

  if (!href) {
    console.warn('fyr-link requires a path');
    return;
  }

  // Make element look like a link
  if (!(element instanceof HTMLAnchorElement)) {
    element.style.cursor = 'pointer';
    element.setAttribute('role', 'link');
  }

  // Get router mode
  const router = document.querySelector('[fyr-router]');
  let mode: 'hash' | 'history' = 'hash';
  if (router && (router as any).__fyrRouter) {
    mode = (router as any).__fyrRouter.mode || 'hash';
  }

  // Click handler
  const clickHandler = (event: MouseEvent) => {
    event.preventDefault();

    // Check if it's a new window request
    if (event.ctrlKey || event.metaKey) {
      window.open(href, '_blank');
      return;
    }

    // Navigate
    navigateTo(href, mode);
  };

  // Add click listener
  element.addEventListener('click', clickHandler);

  // Highlight active link
  const updateActive = () => {
    const currentRoute = getCurrentRoute();
    const currentPath = currentRoute.currentPath || '/';
    const isActive = currentPath === href || currentPath === href + '/';

    if (isActive) {
      element.classList.add('active');
      element.setAttribute('aria-current', 'page');
    } else {
      element.classList.remove('active');
      element.removeAttribute('aria-current');
    }
  };

  // Initial update
  updateActive();

  // Update on route changes
  const routeChangeHandler = () => {
    updateActive();
  };
  document.addEventListener('fyr-route-change', routeChangeHandler);

  // Register cleanup
  registerCleanup(element, () => {
    element.removeEventListener('click', clickHandler);
    document.removeEventListener('fyr-route-change', routeChangeHandler);
    (element as any).__fyrLinkBound = false;
  });
};