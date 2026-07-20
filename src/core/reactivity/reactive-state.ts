import { reactive } from './reactive';
import type { ReactiveState } from '../types';

/** Creates a reactive application state without mutating the caller's object. */
export function createReactiveState<T extends ReactiveState>(initialState: T = {} as T): T {
  return reactive({ ...initialState }) as T;
}
