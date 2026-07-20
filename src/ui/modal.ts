/**
 * Modal
 * Modal dialog system
 */

export interface ModalButton {
  /** Button label */
  label: string;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'outline';
  /** Button action */
  action?: (modal: Modal) => void | Promise<void>;
  /** Close modal on click */
  closeOnClick?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

export interface ModalOptions {
  /** Modal title */
  title?: string;
  /** Modal content (HTML or string) */
  content?: string | HTMLElement;
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Buttons to display */
  buttons?: ModalButton[];
  /** Close on overlay click */
  closeOnOverlayClick?: boolean;
  /** Close on escape key */
  closeOnEscape?: boolean;
  /** Custom class name */
  className?: string;
  /** Callback on open */
  onOpen?: (modal: Modal) => void;
  /** Callback on close */
  onClose?: (modal: Modal) => void;
  /** Callback on confirm (click primary button) */
  onConfirm?: (modal: Modal) => void | Promise<void>;
  /** Callback on cancel */
  onCancel?: (modal: Modal) => void;
  /** Show close button */
  closable?: boolean;
  /** Animation type */
  animation?: 'fade' | 'slide' | 'scale' | 'none';
  /** Z-index */
  zIndex?: number;
}

/**
 * Default modal options
 */
const DEFAULT_OPTIONS: Partial<ModalOptions> = {
  size: 'md',
  closeOnOverlayClick: true,
  closeOnEscape: true,
  closable: true,
  animation: 'scale',
  zIndex: 1000,
};

/**
 * Modal instance
 */
export class Modal {
  private options: ModalOptions;
  private element: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private isOpen = false;
  private resolvePromise: ((value: any) => void) | null = null;

  constructor(options: ModalOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Open the modal
   */
  open(): Promise<any> {
    return new Promise((resolve) => {
      if (this.isOpen) {
        resolve(null);
        return;
      }

      this.resolvePromise = resolve;
      this.create();
      this.isOpen = true;

      if (this.options.onOpen) {
        this.options.onOpen(this);
      }
    });
  }

  /**
   * Create modal elements
   */
  private create(): void {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'fyr-modal-overlay';

    if (this.options.animation === 'fade') {
      overlay.classList.add('fyr-modal-overlay-fade');
    }

    if (this.options.zIndex) {
      overlay.style.zIndex = String(this.options.zIndex);
    }

    // Create modal container
    const modal = document.createElement('div');
    modal.className = `fyr-modal fyr-modal-${this.options.size}`;

    if (this.options.className) {
      modal.className += ` ${this.options.className}`;
    }

    if (this.options.animation === 'slide') {
      modal.classList.add('fyr-modal-slide');
    } else if (this.options.animation === 'scale') {
      modal.classList.add('fyr-modal-scale');
    } else if (this.options.animation === 'none') {
      modal.classList.add('fyr-modal-none');
    }

    // Create header
    if (this.options.title || this.options.closable) {
      const header = document.createElement('div');
      header.className = 'fyr-modal-header';

      if (this.options.title) {
        const title = document.createElement('h2');
        title.className = 'fyr-modal-title';
        title.textContent = this.options.title;
        header.appendChild(title);
      }

      if (this.options.closable) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'fyr-modal-close';
        closeBtn.innerHTML = '×';
        closeBtn.setAttribute('aria-label', 'Close modal');
        closeBtn.addEventListener('click', () => this.close());
        header.appendChild(closeBtn);
      }

      modal.appendChild(header);
    }

    // Create body
    const body = document.createElement('div');
    body.className = 'fyr-modal-body';

    if (this.options.content) {
      if (typeof this.options.content === 'string') {
        body.innerHTML = this.options.content;
      } else {
        body.appendChild(this.options.content);
      }
    }

    modal.appendChild(body);

    // Create footer with buttons
    if (this.options.buttons && this.options.buttons.length > 0) {
      const footer = document.createElement('div');
      footer.className = 'fyr-modal-footer';

      for (const btn of this.options.buttons) {
        const button = document.createElement('button');
        button.className = `fyr-modal-btn fyr-modal-btn-${btn.variant || 'secondary'}`;
        button.textContent = btn.label;

        if (btn.disabled) {
          button.disabled = true;
        }

        button.addEventListener('click', async () => {
          if (btn.action) {
            await btn.action(this);
          }
          if (btn.closeOnClick !== false) {
            this.close(btn);
          }
        });

        footer.appendChild(button);
      }

      modal.appendChild(footer);
    }

    // Store references
    this.overlay = overlay;
    this.element = modal;

    // Append to DOM
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Trigger animation
    requestAnimationFrame(() => {
      modal.classList.add('fyr-modal-enter');
      overlay.classList.add('fyr-modal-overlay-enter');
    });

    // Event listeners
    if (this.options.closeOnOverlayClick) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.close();
        }
      });
    }

    if (this.options.closeOnEscape) {
      document.addEventListener('keydown', this.handleEscape.bind(this));
    }
  }

  /**
   * Handle escape key
   */
  private handleEscape(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this.isOpen) {
      this.close();
    }
  }

  /**
   * Close the modal
   */
  close(result?: any): void {
    if (!this.isOpen || !this.element || !this.overlay) {
      return;
    }

    this.isOpen = false;

    // Remove escape listener
    document.removeEventListener('keydown', this.handleEscape.bind(this));

    // Animate out
    this.element.classList.remove('fyr-modal-enter');
    this.overlay.classList.remove('fyr-modal-overlay-enter');

    // Remove after animation
    setTimeout(() => {
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
      this.element = null;
      this.overlay = null;

      if (this.options.onClose) {
        this.options.onClose(this);
      }

      if (this.resolvePromise) {
        this.resolvePromise(result || null);
        this.resolvePromise = null;
      }
    }, 300);
  }

  /**
   * Update modal content
   */
  update(content: string | HTMLElement): void {
    if (!this.element) {
      return;
    }

    const body = this.element.querySelector('.fyr-modal-body');
    if (body) {
      if (typeof content === 'string') {
        body.innerHTML = content;
      } else {
        body.innerHTML = '';
        body.appendChild(content);
      }
    }
  }

  /**
   * Update modal title
   */
  setTitle(title: string): void {
    if (!this.element) {
      return;
    }

    const titleEl = this.element.querySelector('.fyr-modal-title');
    if (titleEl) {
      titleEl.textContent = title;
    }
  }
}

/**
 * Create a modal
 */
export function modal(options: ModalOptions): Modal {
  return new Modal(options);
}

/**
 * Create a confirm modal
 */
modal.confirm = (
  message: string,
  title: string = 'Confirm',
  confirmLabel: string = 'Confirm',
  cancelLabel: string = 'Cancel'
): Promise<boolean> => {
  return new Promise((resolve) => {
    const instance = new Modal({
      title,
      content: message,
      buttons: [
        {
          label: cancelLabel,
          variant: 'secondary',
          action: () => resolve(false),
        },
        {
          label: confirmLabel,
          variant: 'primary',
          action: () => resolve(true),
        },
      ],
    });
    instance.open();
  });
};

/**
 * Create an alert modal
 */
modal.alert = (
  message: string,
  title: string = 'Alert',
  buttonLabel: string = 'OK'
): Promise<void> => {
  return new Promise((resolve) => {
    const instance = new Modal({
      title,
      content: message,
      buttons: [
        {
          label: buttonLabel,
          variant: 'primary',
          action: () => resolve(),
        },
      ],
    });
    instance.open();
  });
};

/**
 * Default modal instance
 */
export default modal;