/**
 * Link Directive
 * Navigation link directive for router
 */

import { navigateTo, isActive, getCurrentPath } from './navigation';
import { router } from './router';
import { registerDirective } from '../directives/registry';

/**
 * Link options
 */
export interface LinkOptions {
  /** Replace current history entry */
  replace?: boolean;
  /** Query parameters */
  query?: Record<string, string>;
  /** CSS class for active link */
  activeClass?: string;
  /** Exact matching for active class */
  exact?: boolean;
}

/**
 * Default link options
 */
const DEFAULT_OPTIONS: Required<LinkOptions> = {
  replace: false,
  query: {},
  activeClass: 'active',
  exact: false,
};

/**
 * Register the fyr-link directive
 */
export function registerLinkDirective(options: LinkOptions = {}): void {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  registerDirective('link', (element: HTMLElement, expression: string, context: any) => {
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
      if (!element.getAttribute('tabindex')) {
        element.setAttribute('tabindex', '0');
      }
    }

    // Get router mode
    const routerMode = (router as any).config?.mode || 'hash';

    // Click handler
    const clickHandler = (event: MouseEvent) => {
      event.preventDefault();

      // Check if it's a new window request
      if (event.ctrlKey || event.metaKey) {
        const fullPath = routerMode === 'hash' ? '#' + href : href;
        window.open(fullPath, '_blank');
        return;
      }

      // Navigate
      navigateTo(href, {
        replace: opts.replace,
        query: opts.query,
      });
    };

    element.addEventListener('click', clickHandler);

    // Keyboard support for non-anchor elements
    if (!(element instanceof HTMLAnchorElement)) {
      const keydownHandler = (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          clickHandler(event as any);
        }
      };
      element.addEventListener('keydown', keydownHandler);
      (element as any).__fyrLinkKeydown = keydownHandler;
    }

    // Update active state on route change
    const updateActive = () => {
      const currentPath = getCurrentPath();
      const isLinkActive = opts.exact
        ? currentPath === href
        : currentPath === href || currentPath.startsWith(href + '/');

      if (isLinkActive) {
        element.classList.add(opts.activeClass);
        element.setAttribute('aria-current', 'page');
      } else {
        element.classList.remove(opts.activeClass);
        element.removeAttribute('aria-current');
      }
    };

    // Initial update
    updateActive();

    // Listen for route changes
    const routeChangeHandler = () => {
      updateActive();
    };
    document.addEventListener('fyr-route-change', routeChangeHandler);

    // Store cleanup
    (element as any).__fyrLinkCleanup = () => {
      element.removeEventListener('click', clickHandler);
      if ((element as any).__fyrLinkKeydown) {
        element.removeEventListener('keydown', (element as any).__fyrLinkKeydown);
      }
      document.removeEventListener('fyr-route-change', routeChangeHandler);
      (element as any).__fyrLinkBound = false;
    };
  });
}

/**
 * Link directive handler (exported for direct use)
 */
export const LinkDirective = {
  register: registerLinkDirective,
};

/**
 * Create a link directive with custom options
 */
export function createLinkDirective(options: LinkOptions = {}) {
  return (element: HTMLElement, expression: string, context: any) => {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    // Implementation similar to above but with custom options
    // This is a simplified version - full implementation would use the options
    registerLinkDirective(opts);
  };
}

// Auto-register when router is used
if (typeof window !== 'undefined') {
  // Register will be called when router is initialized
  registerLinkDirective();
}