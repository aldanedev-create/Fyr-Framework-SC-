/**
 * Router System - Main Export
 */

export { Router, router } from './router';
export { RouteMatcher, type RouteMatch, type RouteParams } from './route-matcher';
export {
  navigate,
  navigateTo,
  goBack,
  goForward,
  go,
  replace,
  type NavigationOptions,
  type NavigationResult,
} from './navigation';
export {
  RouteGuard,
  type GuardFunction,
  type GuardContext,
  type GuardResult,
} from './guards';
export {
  HistoryManager,
  createHistoryManager,
  type HistoryState,
  type HistoryOptions,
} from './history';
export {
  LinkDirective,
  registerLinkDirective,
  type LinkOptions,
} from './link-directive';

// Default export
export default router;