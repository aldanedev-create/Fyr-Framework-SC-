/**
 * Route Matcher
 * Matches URLs to routes with parameter extraction
 */

import type { Route } from './router';

/**
 * Route match result
 */
export interface RouteMatch {
  /** Matched route */
  route: Route;
  /** Path parameters */
  params: RouteParams;
  /** Query parameters */
  query: RouteParams;
  /** Full path */
  path: string;
  /** Matched URL */
  url: string;
}

/**
 * Route parameters
 */
export interface RouteParams {
  [key: string]: string | undefined;
}

/**
 * Route matcher class
 */
export class RouteMatcher {
  private routes: Route[];
  private routeCache: Map<string, Route> = new Map();

  constructor(routes: Route[]) {
    this.routes = routes;
    this.buildRouteCache();
  }

  /**
   * Build route cache for faster matching
   */
  private buildRouteCache(): void {
    for (const route of this.routes) {
      this.routeCache.set(route.path, route);
      // Add children
      if (route.children) {
        for (const child of route.children) {
          const fullPath = this.joinPaths(route.path, child.path);
          this.routeCache.set(fullPath, { ...child, path: fullPath });
        }
      }
    }
  }

  /**
   * Match a path to a route
   */
  match(path: string): RouteMatch | null {
    // Parse query parameters
    const [pathname, queryString] = this.splitPath(path);
    const query = this.parseQuery(queryString);

    // Try direct match first
    const directRoute = this.routeCache.get(pathname);
    if (directRoute) {
      return {
        route: directRoute,
        params: {},
        query,
        path: pathname,
        url: path,
      };
    }

    // Try pattern matching
    for (const route of this.routes) {
      const match = this.matchRoute(route, pathname);
      if (match) {
        return {
          route: match.route,
          params: match.params,
          query,
          path: pathname,
          url: path,
        };
      }
    }

    return null;
  }

  /**
   * Match a single route against a path
   */
  private matchRoute(route: Route, path: string): { route: Route; params: RouteParams } | null {
    // Convert route path to regex
    const pattern = this.routeToRegex(route.path);
    const match = path.match(pattern);

    if (!match) {
      return null;
    }

    // Extract parameters
    const params: RouteParams = {};
    const paramNames = this.extractParamNames(route.path);

    for (let i = 0; i < paramNames.length; i++) {
      params[paramNames[i]] = match[i + 1];
    }

    return { route, params };
  }

  /**
   * Convert a route path to a regex
   */
  private routeToRegex(path: string): RegExp {
    // Handle wildcard
    if (path === '*') {
      return /^\/.*$/;
    }
    if (path === '**') {
      return /^\/.*$/;
    }

    // Escape special characters and convert parameters
    let regex = path
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\/:([^/]+)/g, '/([^/]+)')
      .replace(/\/:([^/]+)\?/g, '/([^/]*)')
      .replace(/\/\*/g, '/.*');

    // Handle optional trailing slash
    if (!regex.endsWith('/')) {
      regex += '/?';
    }

    return new RegExp(`^${regex}$`);
  }

  /**
   * Extract parameter names from a route path
   */
  private extractParamNames(path: string): string[] {
    const matches = path.match(/\/:([^/?]+)/g);
    if (!matches) {
      return [];
    }
    return matches.map(m => m.slice(2));
  }

  /**
   * Split path into pathname and query string
   */
  private splitPath(path: string): [string, string] {
    const index = path.indexOf('?');
    if (index === -1) {
      return [path, ''];
    }
    return [path.slice(0, index), path.slice(index + 1)];
  }

  /**
   * Parse query string
   */
  private parseQuery(queryString: string): RouteParams {
    const params: RouteParams = {};

    if (!queryString) {
      return params;
    }

    const pairs = queryString.split('&');
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key) {
        params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
      }
    }

    return params;
  }

  /**
   * Join two path segments
   */
  private joinPaths(base: string, child: string): string {
    const cleanBase = base.replace(/\/$/, '');
    const cleanChild = child.replace(/^\//, '');
    return cleanBase + '/' + cleanChild;
  }

  /**
   * Generate a path from a route name and params
   */
  generate(name: string, params: RouteParams = {}): string | null {
    for (const route of this.routes) {
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

  /**
   * Get all routes
   */
  getRoutes(): Route[] {
    return this.routes;
  }

  /**
   * Add a route
   */
  addRoute(route: Route): void {
    this.routes.push(route);
    this.routeCache.set(route.path, route);
  }

  /**
   * Remove a route
   */
  removeRoute(path: string): void {
    this.routes = this.routes.filter(r => r.path !== path);
    this.routeCache.delete(path);
  }
}