/**
 * Route Guards
 * Guard functions for route protection
 */

import type { RouteMatch, RouteParams } from './route-matcher';

/**
 * Guard context
 */
export interface GuardContext {
  /** Route being navigated to */
  to: RouteMatch;
  /** Route being navigated from */
  from: RouteMatch | null;
  /** Route parameters */
  params: RouteParams;
  /** Query parameters */
  query: RouteParams;
  /** Navigation state */
  state?: any;
}

/**
 * Guard result
 */
export type GuardResult = boolean | string | { redirect: string; params?: RouteParams };

/**
 * Guard function
 */
export type GuardFunction = (context: GuardContext) => GuardResult | Promise<GuardResult>;

/**
 * Route guard class
 */
export class RouteGuard {
  private guards: GuardFunction[] = [];

  /**
   * Add a guard
   */
  add(guard: GuardFunction): void {
    this.guards.push(guard);
  }

  /**
   * Remove a guard
   */
  remove(guard: GuardFunction): void {
    this.guards = this.guards.filter(g => g !== guard);
  }

  /**
   * Remove all guards
   */
  clear(): void {
    this.guards = [];
  }

  /**
   * Run all guards
   */
  async run(to: RouteMatch, from: RouteMatch | null): Promise<boolean> {
    const context: GuardContext = {
      to,
      from,
      params: to.params,
      query: to.query,
    };

    for (const guard of this.guards) {
      try {
        const result = await guard(context);

        if (result === false) {
          return false;
        }

        if (typeof result === 'string') {
          // Redirect to string path
          const { navigateTo } = await import('./navigation');
          await navigateTo(result);
          return false;
        }

        if (typeof result === 'object' && result !== null && 'redirect' in result) {
          // Redirect with params
          const { navigateTo } = await import('./navigation');
          const path = result.redirect;
          await navigateTo(path, { query: result.params });
          return false;
        }
      } catch (error) {
        console.error('[Fyr Router] Guard error:', error);
        return false;
      }
    }

    return true;
  }

  /**
   * Get all guards
   */
  getGuards(): GuardFunction[] {
    return [...this.guards];
  }
}

/**
 * Authentication guard
 */
export function requireAuth(redirect: string = '/login'): GuardFunction {
  return (context: GuardContext) => {
    const isAuthenticated = checkAuthentication();
    if (!isAuthenticated) {
      return redirect;
    }
    return true;
  };
}

/**
 * Role-based guard
 */
export function requireRole(role: string | string[], redirect: string = '/unauthorized'): GuardFunction {
  const roles = Array.isArray(role) ? role : [role];
  return (context: GuardContext) => {
    const userRole = getUserRole();
    if (!userRole || !roles.includes(userRole)) {
      return redirect;
    }
    return true;
  };
}

/**
 * Permission-based guard
 */
export function requirePermission(permission: string, redirect: string = '/unauthorized'): GuardFunction {
  return (context: GuardContext) => {
    const permissions = getUserPermissions();
    if (!permissions || !permissions.includes(permission)) {
      return redirect;
    }
    return true;
  };
}

/**
 * Check if user is authenticated
 */
function checkAuthentication(): boolean {
  // This should be replaced with your auth logic
  return typeof window !== 'undefined' && !!localStorage.getItem('auth_token');
}

/**
 * Get user role
 */
function getUserRole(): string | null {
  // This should be replaced with your auth logic
  return typeof window !== 'undefined' ? localStorage.getItem('user_role') : null;
}

/**
 * Get user permissions
 */
function getUserPermissions(): string[] {
  // This should be replaced with your auth logic
  const perms = typeof window !== 'undefined' ? localStorage.getItem('user_permissions') : null;
  return perms ? JSON.parse(perms) : [];
}

/**
 * Create a custom guard
 */
export function createGuard(fn: GuardFunction): GuardFunction {
  return fn;
}

/**
 * Combine multiple guards
 */
export function combineGuards(...guards: GuardFunction[]): GuardFunction {
  return async (context: GuardContext) => {
    for (const guard of guards) {
      const result = await guard(context);
      if (result !== true) {
        return result;
      }
    }
    return true;
  };
}