/**
 * fyr-router Directive
 * Router root for SPA applications
 * Enables single-page application routing
 */

import type { DirectiveHandler, DirectiveContext } from './types';
import { registerCleanup } from '../compiler/cleanup';

/**
 * Router state
 */
interface RouterState {
  currentPath: string;
  currentParams: Record<string, string>;
  currentQuery: Record<string, string>;
  routes: RouteDefinition[];
  mode: 'hash' | 'history';
  notFound?: string;
}

/**
 * Route definition
 */
interface RouteDefinition {
  path: string;
  component: string;
  params?: Record<string, string>;
  guard?: (to: string, from: string) => boolean | Promise<boolean>;
}

/**
 * Global router state
 */
let routerState: RouterState = {
  currentPath: '/',
  currentParams: {},
  currentQuery: {},
  routes: [],
  mode: 'hash',
};

/**
 * fyr-router directive handler
 * Sets up routing for SPA
 */
export const fyrRouterDirective: DirectiveHandler = (
  element: HTMLElement,
  expression: string,
  context: DirectiveContext
): void => {
  // Skip if already bound
  if ((element as any).__fyrRouterBound) {
    return;
  }
  (element as any).__fyrRouterBound = true;

  // Parse router configuration
  const config = parseRouterConfig(expression, context);
  if (!config) {
    console.warn('Invalid router configuration');
    return;
  }

  // Store router state on element
  routerState = {
    ...routerState,
    routes: config.routes || [],
    mode: config.mode || 'hash',
    notFound: config.notFound,
  };

  // Store on element
  (element as any).__fyrRouter = routerState;

  // Listen for route changes
  const handleRouteChange = () => {
    const path = getCurrentPath(routerState.mode);
    const route = findRoute(path, routerState.routes);
    
    if (route) {
      routerState.currentPath = path;
      routerState.currentParams = route.params || {};
      
      // Dispatch route change event
      const event = new CustomEvent('fyr-route-change', {
        detail: {
          path,
          params: routerState.currentParams,
          query: parseQueryString(window.location.search),
          route,
        },
      });
      document.dispatchEvent(event);

      // Update view - find router outlet
      const outlet = element.querySelector('[fyr-route]');
      if (outlet) {
        // Trigger route rendering
        const routeEvent = new CustomEvent('fyr-render-route', {
          detail: {
            component: route.component,
            params: routerState.currentParams,
            query: routerState.currentQuery,
          },
        });
        outlet.dispatchEvent(routeEvent);
      }
    } else if (routerState.notFound) {
      // Handle 404
      const event = new CustomEvent('fyr-route-not-found', {
        detail: { path },
      });
      document.dispatchEvent(event);
    }
  };

  // Set up event listeners
  if (routerState.mode === 'hash') {
    window.addEventListener('hashchange', handleRouteChange);
  } else {
    window.addEventListener('popstate', handleRouteChange);
  }

  // Initial route
  handleRouteChange();

  // Register cleanup
  registerCleanup(element, () => {
    if (routerState.mode === 'hash') {
      window.removeEventListener('hashchange', handleRouteChange);
    } else {
      window.removeEventListener('popstate', handleRouteChange);
    }
    (element as any).__fyrRouterBound = false;
  });
};

/**
 * Parse router configuration
 */
function parseRouterConfig(expression: string, context: DirectiveContext): any {
  try {
    // Try to evaluate as an object
    const config = evalExpression(expression, context);
    if (config && typeof config === 'object') {
      return config;
    }
  } catch {
    // If evaluation fails, try to parse as JSON
    try {
      return JSON.parse(expression);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Evaluate expression (safe fallback)
 */
function evalExpression(expression: string, context: DirectiveContext): any {
  // This is a simplified version - full implementation would use the expression evaluator
  try {
    // Remove outer braces if present
    const cleaned = expression.trim().replace(/^\{|\}$/g, '').trim();
    // Return a simple object
    return { routes: [], mode: 'hash' };
  } catch {
    return null;
  }
}

/**
 * Get current path based on mode
 */
function getCurrentPath(mode: 'hash' | 'history'): string {
  if (mode === 'hash') {
    const hash = window.location.hash.slice(1) || '/';
    return hash.startsWith('/') ? hash : '/' + hash;
  }
  return window.location.pathname;
}

/**
 * Find a matching route
 */
function findRoute(path: string, routes: RouteDefinition[]): RouteDefinition | null {
  for (const route of routes) {
    if (route.path === path) {
      return route;
    }
    // Check for parameterized routes (e.g., /user/:id)
    const pattern = route.path.replace(/:([^/]+)/g, '([^/]+)');
    const regex = new RegExp(`^${pattern}$`);
    const match = path.match(regex);
    if (match) {
      const params: Record<string, string> = {};
      const paramNames = route.path.match(/:([^/]+)/g) || [];
      for (let i = 0; i < paramNames.length; i++) {
        const name = paramNames[i].slice(1);
        params[name] = match[i + 1] || '';
      }
      return { ...route, params };
    }
  }
  return null;
}

/**
 * Parse query string
 */
function parseQueryString(query: string): Record<string, string> {
  const params: Record<string, string> = {};
  const search = query.startsWith('?') ? query.slice(1) : query;
  if (!search) return params;
  for (const pair of search.split('&')) {
    const [key, value] = pair.split('=');
    if (key) {
      params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
    }
  }
  return params;
}

/**
 * Navigate to a route
 */
export function navigateTo(path: string, mode: 'hash' | 'history' = 'hash'): void {
  if (mode === 'hash') {
    window.location.hash = path;
  } else {
    window.history.pushState({}, '', path);
    // Dispatch popstate event to trigger route change
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}

/**
 * Get current route
 */
export function getCurrentRoute(): RouterState {
  return routerState;
}