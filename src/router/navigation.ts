/**
 * Navigation
 * Navigation utilities for the router
 */

import { router } from './router';
import type { RouteMatch, RouteParams } from './route-matcher';

/**
 * Navigation options
 */
export interface NavigationOptions {
  /** Replace current history entry */
  replace?: boolean;
  /** Query parameters */
  query?: RouteParams;
  /** State to pass with navigation */
  state?: any;
}

/**
 * Navigation result
 */
export interface NavigationResult {
  /** Whether navigation succeeded */
  success: boolean;
  /** Matched route if successful */
  route?: RouteMatch;
  /** Error message if failed */
  error?: string;
}

/**
 * Navigate to a path
 */
export async function navigateTo(
  path: string,
  options: NavigationOptions = {}
): Promise<NavigationResult> {
  try {
    // Build full path with query
    let fullPath = path;
    if (options.query) {
      const queryString = new URLSearchParams(options.query).toString();
      if (queryString) {
        fullPath += (fullPath.includes('?') ? '&' : '?') + queryString;
      }
    }

    const route = await router.navigate(fullPath, {
      replace: options.replace,
      query: options.query,
    });

    return {
      success: true,
      route: route || undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Navigation failed',
    };
  }
}

/**
 * Navigate to a named route
 */
export async function navigate(
  name: string,
  params: RouteParams = {},
  options: NavigationOptions = {}
): Promise<NavigationResult> {
  // Find route by name
  const routes = (router as any).routes || [];
  let path: string | null = null;

  for (const route of routes) {
    if (route.name === name) {
      path = route.path;
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          path = path.replace(`:${key}`, value);
        }
      }
      break;
    }
  }

  if (!path) {
    return {
      success: false,
      error: `Route '${name}' not found`,
    };
  }

  return navigateTo(path, options);
}

/**
 * Go back in history
 */
export function goBack(): void {
  window.history.back();
}

/**
 * Go forward in history
 */
export function goForward(): void {
  window.history.forward();
}

/**
 * Go to a specific history entry
 */
export function go(delta: number): void {
  window.history.go(delta);
}

/**
 * Replace current history entry
 */
export function replace(path: string, query?: RouteParams): Promise<NavigationResult> {
  return navigateTo(path, { replace: true, query });
}

/**
 * Get current route
 */
export function getCurrentRoute(): RouteMatch | null {
  return router.getCurrentRoute();
}

/**
 * Get current path
 */
export function getCurrentPath(): string {
  return router.getCurrentPath();
}

/**
 * Check if a path matches the current route
 */
export function isActive(path: string): boolean {
  const currentPath = getCurrentPath();
  return currentPath === path || currentPath.startsWith(path + '/');
}

/**
 * Generate a path from a route name
 */
export function generatePath(name: string, params: RouteParams = {}): string | null {
  const routes = (router as any).routes || [];
  for (const route of routes) {
    if (route.name === name) {
      let path = route.path;
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          path = path.replace(`:${key}`, value);
        }
      }
      return path;
    }
  }
  return null;
}