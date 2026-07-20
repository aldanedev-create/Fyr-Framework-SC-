/** Browser-history adapter used by the router in hash and History API modes. */

export interface HistoryState {
  path: string;
  state?: unknown;
}

export interface HistoryOptions {
  mode?: 'hash' | 'history';
  base?: string;
}

export class HistoryManager {
  private readonly mode: 'hash' | 'history';
  private readonly base: string;
  private readonly listeners = new Set<(path: string) => void>();
  private readonly handleChange = (): void => this.notify(this.getCurrentPath());

  constructor(options: HistoryOptions = {}) {
    this.mode = options.mode ?? 'hash';
    this.base = this.normalizeBase(options.base ?? '/');
    if (typeof window !== 'undefined') {
      window.addEventListener(this.mode === 'hash' ? 'hashchange' : 'popstate', this.handleChange);
    }
  }

  getCurrentPath(): string {
    if (typeof window === 'undefined') return '/';
    const path = this.mode === 'hash' ? window.location.hash.slice(1) : window.location.pathname + window.location.search;
    return path || '/';
  }

  getFullPath(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    if (this.base === '/') return normalizedPath;
    return `${this.base.replace(/\/$/, '')}${normalizedPath}`;
  }

  push(path: string, state?: unknown): void {
    if (typeof window === 'undefined') return;
    if (this.mode === 'hash') window.location.hash = path;
    else window.history.pushState(state, '', path);
  }

  replace(path: string, state?: unknown): void {
    if (typeof window === 'undefined') return;
    if (this.mode === 'hash') window.location.replace(`${window.location.pathname}${window.location.search}#${path}`);
    else window.history.replaceState(state, '', path);
  }

  listen(listener: (path: string) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  destroy(): void {
    if (typeof window !== 'undefined') window.removeEventListener(this.mode === 'hash' ? 'hashchange' : 'popstate', this.handleChange);
    this.listeners.clear();
  }

  private notify(path: string): void { for (const listener of this.listeners) listener(path); }
  private normalizeBase(base: string): string { return base === '/' ? base : `/${base.replace(/^\/+|\/+$/g, '')}`; }
}

export function createHistoryManager(options?: HistoryOptions): HistoryManager { return new HistoryManager(options); }
