/**
 * Toast
 * Toast notification system
 */

export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'loading';

export interface ToastOptions {
  /** Toast message */
  message: string;
  /** Toast type */
  type?: ToastType;
  /** Duration in milliseconds (0 = permanent) */
  duration?: number;
  /** Position */
  position?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';
  /** Show close button */
  closable?: boolean;
  /** Custom class name */
  className?: string;
  /** Callback on close */
  onClose?: () => void;
  /** Callback on click */
  onClick?: () => void;
  /** HTML content (overrides message) */
  html?: string;
  /** Icon (emoji or custom) */
  icon?: string;
  /** Progress bar */
  progress?: boolean;
}

/**
 * Default toast options
 */
const DEFAULT_OPTIONS: Partial<ToastOptions> = {
  type: 'info',
  duration: 3000,
  position: 'top-right',
  closable: true,
  progress: true,
};

/**
 * Toast instance
 */
export class Toast {
  private options: ToastOptions;
  private element: HTMLElement | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private progressBar: HTMLElement | null = null;

  constructor(options: ToastOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.create();
  }

  /**
   * Create toast element
   */
  private create(): void {
    // Get or create container
    const container = this.getContainer();

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `fyr-toast fyr-toast-${this.options.type}`;

    if (this.options.className) {
      toast.className += ` ${this.options.className}`;
    }

    // Create icon
    if (this.options.icon) {
      const icon = document.createElement('span');
      icon.className = 'fyr-toast-icon';
      icon.textContent = this.options.icon;
      toast.appendChild(icon);
    } else {
      const icon = document.createElement('span');
      icon.className = 'fyr-toast-icon';
      icon.textContent = this.getDefaultIcon();
      toast.appendChild(icon);
    }

    // Create content
    const content = document.createElement('div');
    content.className = 'fyr-toast-content';

    if (this.options.html) {
      content.innerHTML = this.options.html;
    } else {
      const message = document.createElement('span');
      message.className = 'fyr-toast-message';
      message.textContent = this.options.message;
      content.appendChild(message);
    }

    toast.appendChild(content);

    // Create close button
    if (this.options.closable) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'fyr-toast-close';
      closeBtn.innerHTML = '×';
      closeBtn.setAttribute('aria-label', 'Close toast');
      closeBtn.addEventListener('click', () => this.close());
      toast.appendChild(closeBtn);
    }

    // Click handler
    if (this.options.onClick) {
      toast.addEventListener('click', () => {
        if (this.options.onClick) {
          this.options.onClick();
        }
      });
    }

    // Create progress bar
    if (this.options.progress && this.options.duration && this.options.duration > 0) {
      const progress = document.createElement('div');
      progress.className = 'fyr-toast-progress';
      const bar = document.createElement('div');
      bar.className = 'fyr-toast-progress-bar';
      progress.appendChild(bar);
      toast.appendChild(progress);
      this.progressBar = bar;
    }

    // Store reference
    this.element = toast;

    // Add to container
    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.add('fyr-toast-enter');
    });

    // Set timer
    if (this.options.duration && this.options.duration > 0) {
      this.timer = setTimeout(() => {
        this.close();
      }, this.options.duration);
    }
  }

  /**
   * Get container
   */
  private getContainer(): HTMLElement {
    const position = this.options.position || 'top-right';
    const containerId = `fyr-toast-container-${position}`;

    let container = document.getElementById(containerId);

    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.className = `fyr-toast-container fyr-toast-container-${position}`;
      document.body.appendChild(container);
    }

    return container;
  }

  /**
   * Get default icon for type
   */
  private getDefaultIcon(): string {
    switch (this.options.type) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✕';
      case 'loading':
        return '⟳';
      default:
        return 'ℹ';
    }
  }

  /**
   * Close toast
   */
  close(): void {
    if (!this.element) {
      return;
    }

    // Clear timer
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // Animate out
    this.element.classList.remove('fyr-toast-enter');
    this.element.classList.add('fyr-toast-exit');

    // Remove after animation
    setTimeout(() => {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
        this.element = null;
      }

      if (this.options.onClose) {
        this.options.onClose();
      }
    }, 300);
  }

  /**
   * Update toast message
   */
  update(message: string): void {
    if (!this.element) {
      return;
    }

    const messageEl = this.element.querySelector('.fyr-toast-message');
    if (messageEl) {
      messageEl.textContent = message;
    }
  }

  /**
   * Update toast type
   */
  setType(type: ToastType): void {
    if (!this.element) {
      return;
    }

    // Remove old type class
    for (const t of ['info', 'success', 'warning', 'error', 'loading']) {
      this.element.classList.remove(`fyr-toast-${t}`);
    }

    this.element.classList.add(`fyr-toast-${type}`);
    this.options.type = type;

    // Update icon
    const icon = this.element.querySelector('.fyr-toast-icon');
    if (icon) {
      icon.textContent = this.getDefaultIcon();
    }
  }

  /**
   * Set progress
   */
  setProgress(progress: number): void {
    if (this.progressBar) {
      const percent = Math.max(0, Math.min(100, progress * 100));
      this.progressBar.style.width = `${percent}%`;
    }
  }
}

/**
 * Create a toast notification
 */
export function toast(options: string | ToastOptions): Toast {
  const opts = typeof options === 'string' ? { message: options } : options;
  return new Toast(opts);
}

/**
 * Toast shortcuts
 */
toast.success = (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) => {
  return toast({ ...options, message, type: 'success' });
};

toast.error = (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) => {
  return toast({ ...options, message, type: 'error' });
};

toast.warning = (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) => {
  return toast({ ...options, message, type: 'warning' });
};

toast.info = (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) => {
  return toast({ ...options, message, type: 'info' });
};

toast.loading = (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) => {
  return toast({ ...options, message, type: 'loading', duration: 0 });
};

/**
 * Default toast instance
 */
export default toast;