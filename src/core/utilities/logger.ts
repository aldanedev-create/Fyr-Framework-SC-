/**
 * Logger
 * Configurable logging with levels and formatting
 */

/**
 * Log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

/**
 * Logger options
 */
export interface LoggerOptions {
  /** Minimum log level */
  level?: LogLevel;
  /** Enable timestamps */
  timestamp?: boolean;
  /** Enable colors */
  colors?: boolean;
  /** Custom prefix */
  prefix?: string;
  /** Custom formatter */
  format?: (level: LogLevel, message: string, data?: any[]) => string;
}

/**
 * Log level priorities
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4,
};

/**
 * Default logger options
 */
const DEFAULT_OPTIONS: Required<LoggerOptions> = {
  level: 'info',
  timestamp: true,
  colors: true,
  prefix: 'Fyr',
  format: (level, message, data) => {
    const prefix = `[${new Date().toISOString()}] [${level.toUpperCase()}]`;
    const dataStr = data && data.length > 0 ? ' ' + data.map(d => JSON.stringify(d)).join(' ') : '';
    return `${prefix} ${message}${dataStr}`;
  },
};

/**
 * Color codes
 */
const COLORS = {
  reset: '\x1b[0m',
  gray: '\x1b[90m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

/**
 * Logger class
 */
export class Logger {
  private options: Required<LoggerOptions>;
  private isBrowser: boolean;

  constructor(options: LoggerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.isBrowser = typeof window !== 'undefined';
  }

  /**
   * Set the log level
   */
  setLevel(level: LogLevel): void {
    this.options.level = level;
  }

  /**
   * Get the current log level
   */
  getLevel(): LogLevel {
    return this.options.level;
  }

  /**
   * Set the prefix
   */
  setPrefix(prefix: string): void {
    this.options.prefix = prefix;
  }

  /**
   * Log a debug message
   */
  debug(message: string, ...data: any[]): void {
    this.log('debug', message, data);
  }

  /**
   * Log an info message
   */
  info(message: string, ...data: any[]): void {
    this.log('info', message, data);
  }

  /**
   * Log a warning message
   */
  warn(message: string, ...data: any[]): void {
    this.log('warn', message, data);
  }

  /**
   * Log an error message
   */
  error(message: string, ...data: any[]): void {
    this.log('error', message, data);
  }

  /**
   * Log a message
   */
  private log(level: LogLevel, message: string, data: any[]): void {
    const levelPriority = LOG_LEVELS[level];
    const currentPriority = LOG_LEVELS[this.options.level];

    if (levelPriority < currentPriority || this.options.level === 'none') {
      return;
    }

    let formatted = this.options.format(level, message, data);

    // Add colors if enabled
    if (this.options.colors) {
      formatted = this.colorize(level, formatted);
    }

    // Output to console
    if (this.isBrowser) {
      this.browserLog(level, formatted, data);
    } else {
      this.nodeLog(level, formatted, data);
    }
  }

  /**
   * Colorize a message
   */
  private colorize(level: LogLevel, message: string): string {
    if (!this.options.colors) {
      return message;
    }

    let color: string;
    switch (level) {
      case 'debug':
        color = COLORS.gray;
        break;
      case 'info':
        color = COLORS.blue;
        break;
      case 'warn':
        color = COLORS.yellow;
        break;
      case 'error':
        color = COLORS.red;
        break;
      default:
        color = COLORS.reset;
    }

    return `${color}${message}${COLORS.reset}`;
  }

  /**
   * Log to browser console
   */
  private browserLog(level: LogLevel, message: string, data: any[]): void {
    const prefix = `[${this.options.prefix}]`;

    switch (level) {
      case 'debug':
        console.debug(prefix, message, ...data);
        break;
      case 'info':
        console.info(prefix, message, ...data);
        break;
      case 'warn':
        console.warn(prefix, message, ...data);
        break;
      case 'error':
        console.error(prefix, message, ...data);
        break;
    }
  }

  /**
   * Log to Node.js console
   */
  private nodeLog(level: LogLevel, message: string, data: any[]): void {
    const prefix = this.options.prefix ? `[${this.options.prefix}]` : '';

    switch (level) {
      case 'debug':
        console.debug(prefix, message, ...data);
        break;
      case 'info':
        console.log(prefix, message, ...data);
        break;
      case 'warn':
        console.warn(prefix, message, ...data);
        break;
      case 'error':
        console.error(prefix, message, ...data);
        break;
    }
  }

  /**
   * Create a child logger with additional prefix
   */
  child(name: string): Logger {
    const prefix = this.options.prefix ? `${this.options.prefix}:${name}` : name;
    return new Logger({ ...this.options, prefix });
  }

  /**
   * Create a group for related logs
   */
  group(name: string): LoggerGroup {
    return new LoggerGroup(this, name);
  }
}

/**
 * Logger group for grouping related logs
 */
export class LoggerGroup {
  private logger: Logger;
  private name: string;

  constructor(logger: Logger, name: string) {
    this.logger = logger;
    this.name = name;
  }

  debug(message: string, ...data: any[]): void {
    this.logger.debug(`[${this.name}] ${message}`, ...data);
  }

  info(message: string, ...data: any[]): void {
    this.logger.info(`[${this.name}] ${message}`, ...data);
  }

  warn(message: string, ...data: any[]): void {
    this.logger.warn(`[${this.name}] ${message}`, ...data);
  }

  error(message: string, ...data: any[]): void {
    this.logger.error(`[${this.name}] ${message}`, ...data);
  }
}

/**
 * Create a logger
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  return new Logger(options);
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Export default logger
 */
export default logger;