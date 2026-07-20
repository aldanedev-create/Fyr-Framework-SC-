/**
 * CSRF Manager
 * Handles CSRF token management and injection
 */

import type { RequestConfig } from './request';

/**
 * CSRF configuration
 */
export interface CSRFConfig {
  /** Whether CSRF protection is enabled */
  enabled?: boolean;
  /** CSRF token header name */
  headerName?: string;
  /** CSRF token cookie name */
  cookieName?: string;
  /** CSRF token getter function */
  getToken?: () => Promise<string> | string;
  /** CSRF token setter function */
  setToken?: (token: string) => void;
  /** CSRF token refresh function */
  refreshToken?: () => Promise<string> | string;
}

/**
 * Default CSRF configuration
 */
const DEFAULT_CSRF_CONFIG: Required<CSRFConfig> = {
  enabled: false,
  headerName: 'X-CSRF-Token',
  cookieName: 'csrf_token',
  getToken: () => {
    // Try to get token from cookie
    const token = getCookie(document.cookie, 'csrf_token') || '';
    return token;
  },
  setToken: (token: string) => {
    // Store token in memory
    (window as any).__fyr_csrf_token = token;
  },
  refreshToken: () => {
    // Default: fetch new token from server
    return fetch('/api/csrf-token')
      .then(res => res.json())
      .then(data => data.token || '');
  },
};

/**
 * CSRF Manager
 */
export class CSRFManager {
  private config: Required<CSRFConfig>;
  private token: string = '';
  private tokenPromise: Promise<string> | null = null;

  constructor(config: CSRFConfig = {}) {
    this.config = { ...DEFAULT_CSRF_CONFIG, ...config };
    // Initialize token from cookie or memory
    this.token = this.config.getToken() || (window as any).__fyr_csrf_token || '';
  }

  /**
   * Check if CSRF protection is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Enable CSRF protection
   */
  enable(): void {
    this.config.enabled = true;
  }

  /**
   * Disable CSRF protection
   */
  disable(): void {
    this.config.enabled = false;
  }

  /**
   * Get the current CSRF token
   */
  getToken(): string {
    return this.token || this.config.getToken() || '';
  }

  /**
   * Set the CSRF token
   */
  setToken(token: string): void {
    this.token = token;
    this.config.setToken(token);
  }

  /**
   * Refresh the CSRF token
   */
  async refreshToken(): Promise<string> {
    try {
      this.tokenPromise = Promise.resolve(this.config.refreshToken());
      const token = await this.tokenPromise;
      this.setToken(token);
      return token;
    } finally {
      this.tokenPromise = null;
    }
  }

  /**
   * Apply CSRF token to request configuration
   */
  async applyToken(config: RequestConfig): Promise<RequestConfig> {
    if (!this.isEnabled()) {
      return config;
    }

    // Get token (refresh if needed)
    let token = this.getToken();
    if (!token) {
      token = await this.refreshToken();
    }

    // Apply token to headers
    if (token) {
      config.headers = {
        ...config.headers,
        [this.config.headerName]: token,
      };
    }

    return config;
  }

  /**
   * Update CSRF configuration
   */
  setConfig(config: Partial<CSRFConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current CSRF configuration
   */
  getConfig(): Required<CSRFConfig> {
    return { ...this.config };
  }

  /**
   * Reset to default configuration
   */
  reset(): void {
    this.config = { ...DEFAULT_CSRF_CONFIG };
    this.token = '';
  }
}

/**
 * Get a cookie value by name
 */
function getCookie(cookieString: string, name: string): string | null {
  const cookies = cookieString.split(';');
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === name) {
      return value || '';
    }
  }
  return null;
}

/**
 * Create a CSRF manager with custom configuration
 */
export function createCSRFManager(config?: CSRFConfig): CSRFManager {
  return new CSRFManager(config);
}

/**
 * CSRF token interceptor for requests
 */
export function csrfInterceptor(manager: CSRFManager) {
  return async (config: RequestConfig): Promise<RequestConfig> => {
    if (!manager.isEnabled()) {
      return config;
    }

    let token = manager.getToken();
    if (!token) {
      token = await manager.refreshToken();
    }

    if (token) {
      config.headers = {
        ...config.headers,
        [manager.getConfig().headerName]: token,
      };
    }

    return config;
  };
}