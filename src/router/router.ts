/**
 * Router
 * Main router class for SPA navigation
 */

import { RouteMatcher, type RouteMatch, type RouteParams } from './route-matcher';
import { HistoryManager, type HistoryState } from './history';
import { RouteGuard, type GuardFunction } from './guards';
import { navigateTo } from './navigation';

/**
 * Route definition
 */
export interface Route {
  /** Route path (e.g., '/users/:id') */
  path: string;
  /** Component name to render */
  component: string;
  /** Route name (optional) */
  name?: string;
  /** Route guards */
  guards?: GuardFunction[];
  /** Child routes */
  children?: Route[];
  /** Redirect to this path */
  redirect?: string;
  /** Route meta data */
  meta?: Record<string, any>;
  /** Lazy load component */
  lazy?: () => Promise<any>;
}

/**
 * Router configuration
 */
export interface RouterConfig {
  /** Routes */
  routes: Route[];
  /** Router mode: 'hash' | 'history' */
  mode?: 'hash' | 'history';
  /** Base URL */
  base?: string;
  /** Fallback route (404) */
  fallback?: string | Route;
  /** Scroll behavior */
  scrollBehavior?: (to: RouteMatch, from: RouteMatch | null) => void;
  /** Global guards */
  guards?: GuardFunction[];
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Router state
 */
export interface RouterState {
  /** Current route */
  currentRoute: RouteMatch | null;
  /** Previous route */
  previousRoute: RouteMatch | null;
  /** Current path */
  currentPath: string;
  /** Is navigating */
  isNavigating: boolean;
  /** Navigation history */
  history: string[];
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Partial<RouterConfig> = {
  mode: 'hash',
  base: '/',
  debug: false,
};

/**
 * Router class
 */
export class Router {
  private config: RouterConfig;
  private matcher: RouteMatcher;
  private historyManager: HistoryManager;
  private state: RouterState;
  private guards: RouteGuard;
  private routes: Route[];
  private listeners: Array<(route: RouteMatch | null) => void> = [];

  constructor(config: RouterConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.routes = config.routes;
    this.matcher = new RouteMatcher(this.routes);
    this.guards = new RouteGuard();

    // Add global guards
    if (config.guards) {
      for (const guard of config.guards) {
        this.guards.add(guard);
      }
    }

    this.historyManager = new HistoryManager({
      mode: config.mode || 'hash',
      base: config.base || '/',
    });

    this.state = {
      currentRoute: null,
      previousRoute: null,
      currentPath: '',
      isNavigating: false,
      history: [],
    };

    // Set up history listener
    this.historyManager.listen(this.handleNavigation.bind(this));

    // Initial navigation
    this.initialize();
  }

  /**
   * Initialize the router
   */
  private initialize(): void {
    const path = this.historyManager.getCurrentPath();
    this.navigate(path, { replace: true });
  }

  /**
   * Handle navigation events
   */
  private async handleNavigation(path: string): Promise<void> {
    await this.navigate(path);
  }

  /**
   * Navigate to a path
   */
  async navigate(
    path: string,
    options: { replace?: boolean; query?: Record<string, string> } = {}
  ): Promise<RouteMatch | null> {
    if (this.state.isNavigating) {
      this.log('Navigation already in progress, ignoring');
      return null;
    }

    this.state.isNavigating = true;
    this.log(`Navigating to: ${path}`);

    try {
      // Build full path with query
      let fullPath = path;
      if (options.query) {
        const queryString = new URLSearchParams(options.query).toString();
        if (queryString) {
          fullPath += (fullPath.includes('?') ? '&' : '?') + queryString;
        }
      }

      // Match the route
      const match = this.matcher.match(fullPath);

      if (!match) {
        // Handle fallback
        this.log(`No route matched: ${fullPath}`);
        const fallback = this.getFallback();
        if (fallback) {
          if (typeof fallback === 'string') {
            await this.navigate(fallback);
            return null;
          }
          // Handle fallback route
          const fallbackMatch = this.matcher.match(fallback.path);
          if (fallbackMatch) {
            await this.applyRoute(fallbackMatch);
            return fallbackMatch;
          }
        }
        return null;
      }

      // Run guards
      const canNavigate = await this.runGuards(match, this.state.currentRoute);
      if (!canNavigate) {
        this.log('Navigation blocked by guard');
        this.state.isNavigating = false;
        return null;
      }

      // Apply the route
      await this.applyRoute(match, options);

      return match;
    } catch (error) {
      this.log('Navigation error:', error);
      throw error;
    } finally {
      this.state.isNavigating = false;
    }
  }

  /**
   * Apply a route match
   */
  private async applyRoute(
    match: RouteMatch,
    options: { replace?: boolean } = {}
  ): Promise<void> {
    // Store previous route
    this.state.previousRoute = this.state.currentRoute;

    // Update state
    this.state.currentRoute = match;
    this.state.currentPath = match.path;

    // Update history
    this.state.history.push(match.path);

    // Update browser history
    const path = this.historyManager.getFullPath(match.path);
    if (options.replace) {
      this.historyManager.replace(path);
    } else {
      this.historyManager.push(path);
    }

    // Emit route change event
    this.emit(match);

    // Handle scroll behavior
    if (this.config.scrollBehavior) {
      this.config.scrollBehavior(match, this.state.previousRoute);
    }

    // Handle lazy loading
    if (match.route.lazy) {
      try {
        await match.route.lazy();
      } catch (error) {
        this.log('Lazy loading error:', error);
      }
    }

    // Dispatch DOM event
    const event = new CustomEvent('fyr-route-change', {
      detail: {
        route: match,
        previous: this.state.previousRoute,
      },
    });
    document.dispatchEvent(event);

    this.log(`Route applied: ${match.path}`);
  }

  /**
   * Run route guards
   */
  private async runGuards(
    to: RouteMatch,
    from: RouteMatch | null
  ): Promise<boolean> {
    // Run global guards
    const globalResult = await this.guards.run(to, from);
    if (!globalResult) {
      return false;
    }

    // Run route-specific guards
    if (to.route.guards) {
      const routeGuards = new RouteGuard();
      for (const guard of to.route.guards) {
        routeGuards.add(guard);
      }
      return await routeGuards.run(to, from);
    }

    return true;
  }

  /**
   * Get fallback route
   */
  private getFallback(): string | Route | null {
    if (this.config.fallback) {
      return this.config.fallback;
    }

    // Try to find a catch-all route
    for (const route of this.routes) {
      if (route.path === '*' || route.path === '**') {
        return route;
      }
    }

    return null;
  }

  /**
   * Get current route
   */
  getCurrentRoute(): RouteMatch | null {
    return this.state.currentRoute;
  }

  /**
   * Get current path
   */
  getCurrentPath(): string {
    return this.state.currentPath;
  }

  /**
   * Check if a path matches a route
   */
  match(path: string): RouteMatch | null {
    return this.matcher.match(path);
  }

  /**
   * Add a route
   */
  addRoute(route: Route): void {
    this.routes.push(route);
    this.matcher = new RouteMatcher(this.routes);
  }

  /**
   * Remove a route
   */
  removeRoute(path: string): void {
    this.routes = this.routes.filter(r => r.path !== path);
    this.matcher = new RouteMatcher(this.routes);
  }

  /**
   * Add a global guard
   */
  addGuard(guard: GuardFunction): void {
    this.guards.add(guard);
  }

  /**
   * Remove a global guard
   */
  removeGuard(guard: GuardFunction): void {
    this.guards.remove(guard);
  }

  /**
   * Listen to route changes
   */
  onRouteChange(listener: (route: RouteMatch | null) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Emit route change to listeners
   */
  private emit(route: RouteMatch | null): void {
    for (const listener of this.listeners) {
      try {
        listener(route);
      } catch (error) {
        this.log('Listener error:', error);
      }
    }
  }

  /**
   * Log debug messages
   */
  private log(message: string, ...data: any[]): void {
    if (this.config.debug) {
      console.log(`[Fyr Router] ${message}`, ...data);
    }
  }

  /**
   * Destroy the router
   */
  destroy(): void {
    this.historyManager.destroy();
    this.listeners = [];
  }
}

/**
 * Default router instance
 */
export const router = new Router({ routes: [], mode: 'hash', debug: false });

/**
 * Initialize the router with configuration
 */
export function createRouter(config: RouterConfig): Router {
  return new Router(config);
}