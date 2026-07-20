/**
 * Loading
 * Loading overlay system
 */

export interface LoadingOptions {
  /** Loading text */
  text?: string;
  /** Loading spinner size */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Custom class name */
  className?: string;
  /** Background color */
  backgroundColor?: string;
  /** Spinner color */
  spinnerColor?: string;
  /** Text color */
  textColor?: string;
  /** Z-index */
  zIndex?: number;
  /** Show overlay */
  overlay?: boolean;
  /** Full screen */
  fullScreen?: boolean;
}

/**
 * Default loading options
 */
const DEFAULT_OPTIONS: Required<LoadingOptions> = {
  text: 'Loading...',
  size: 'md',
  className: '',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  spinnerColor: '#6ee7ff',
  textColor: '#ffffff',
  zIndex: 9999,
  overlay: true,
  fullScreen: true,
};

/**
 * Loading instance
 */
export class Loading {
  private options: LoadingOptions;
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private isVisible = false;

  constructor(options: LoadingOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Show loading
   */
  show(): void {
    if (this.isVisible) {
      return;
    }

    this.create();
    this.isVisible = true;
  }

  /**
   * Hide loading
   */
  hide(): void {
    if (!this.isVisible || !this.element) {
      return;
    }

    this.element.classList.remove('fyr-loading-enter');
    this.element.classList.add('fyr-loading-exit');

    setTimeout(() => {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
        this.element = null;
        this.container = null;
      }
    }, 300);

    this.isVisible = false;
  }

  /**
   * Create loading element
   */
  private create(): void {
    const container = document.createElement('div');
    container.className = 'fyr-loading-container';

    if (this.options.fullScreen) {
      container.style.position = 'fixed';
      container.style.inset = '0';
    } else {
      container.style.position = 'absolute';
      container.style.inset = '0';
    }

    if (this.options.backgroundColor) {
      container.style.background = this.options.backgroundColor;
    }

    if (this.options.zIndex) {
      container.style.zIndex = String(this.options.zIndex);
    }

    if (this.options.className) {
      container.className += ` ${this.options.className}`;
    }

    // Create spinner
    const spinner = document.createElement('div');
    spinner.className = `fyr-loading-spinner fyr-loading-spinner-${this.options.size}`;

    if (this.options.spinnerColor) {
      spinner.style.borderColor = this.options.spinnerColor;
      spinner.style.borderTopColor = 'transparent';
    }

    container.appendChild(spinner);

    // Create text
    if (this.options.text) {
      const text = document.createElement('div');
      text.className = 'fyr-loading-text';
      text.textContent = this.options.text;

      if (this.options.textColor) {
        text.style.color = this.options.textColor;
      }

      container.appendChild(text);
    }

    // Store references
    this.container = container;

    // Add to DOM
    if (this.options.fullScreen) {
      document.body.appendChild(container);
    } else {
      // Find parent container
      const parent = document.querySelector('.fyr-loading-parent') || document.body;
      parent.appendChild(container);
    }

    // Trigger animation
    requestAnimationFrame(() => {
      container.classList.add('fyr-loading-enter');
    });

    this.element = container;
  }

  /**
   * Update loading text
   */
  setText(text: string): void {
    this.options.text = text;

    if (this.element) {
      const textEl = this.element.querySelector('.fyr-loading-text');
      if (textEl) {
        textEl.textContent = text;
      }
    }
  }

  /**
   * Check if loading is visible
   */
  isShowing(): boolean {
    return this.isVisible;
  }

  /**
   * Toggle loading
   */
  toggle(show?: boolean): void {
    if (show !== undefined) {
      show ? this.show() : this.hide();
    } else {
      this.isVisible ? this.hide() : this.show();
    }
  }
}

/**
 * Create a loading instance
 */
export function loading(options: LoadingOptions = {}): Loading {
  return new Loading(options);
}

/**
 * Show loading with a specific message
 */
loading.show = (text?: string, options?: LoadingOptions): Loading => {
  const instance = new Loading({ ...options, text: text || 'Loading...' });
  instance.show();
  return instance;
};

/**
 * Default loading instance
 */
const defaultLoading = new Loading();

/**
 * Show default loading
 */
export function showLoading(text?: string): void {
  defaultLoading.setText(text || 'Loading...');
  defaultLoading.show();
}

/**
 * Hide default loading
 */
export function hideLoading(): void {
  defaultLoading.hide();
}

/**
 * Default loading instance
 */
export default loading;