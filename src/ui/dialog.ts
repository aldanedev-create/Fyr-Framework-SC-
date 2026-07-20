/**
 * Dialog
 * Dialog system for alerts, confirms, and prompts
 */

import { Modal, type ModalOptions, type ModalButton } from './modal';

export interface DialogOptions {
  /** Dialog title */
  title?: string;
  /** Dialog message */
  message: string;
  /** Dialog type */
  type?: 'info' | 'success' | 'warning' | 'error' | 'question';
  /** Confirm button label */
  confirmLabel?: string;
  /** Cancel button label */
  cancelLabel?: string;
  /** Show cancel button */
  showCancel?: boolean;
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Close on overlay click */
  closeOnOverlayClick?: boolean;
  /** Custom class name */
  className?: string;
  /** Input placeholder (for prompt) */
  placeholder?: string;
  /** Input value (for prompt) */
  value?: string;
  /** Input type (for prompt) */
  inputType?: 'text' | 'password' | 'number' | 'email' | 'textarea';
}

export interface DialogResult {
  /** Whether confirmed */
  confirmed: boolean;
  /** Input value (for prompt) */
  value?: string;
}

/**
 * Dialog
 */
export class Dialog {
  private modal: Modal | null = null;
  private options: DialogOptions;
  private input: HTMLInputElement | HTMLTextAreaElement | null = null;

  constructor(options: DialogOptions) {
    this.options = {
      type: 'info',
      confirmLabel: 'OK',
      cancelLabel: 'Cancel',
      showCancel: false,
      size: 'md',
      closeOnOverlayClick: false,
      ...options,
    };
  }

  /**
   * Show the dialog
   */
  show(): Promise<DialogResult> {
    return new Promise((resolve) => {
      const modalOptions = this.buildModalOptions(resolve);
      this.modal = new Modal(modalOptions);
      this.modal.open();
    });
  }

  /**
   * Build modal options
   */
  private buildModalOptions(resolve: (result: DialogResult) => void): ModalOptions {
    const icon = this.getIcon();

    let content = '';

    // Add icon
    if (icon) {
      content += `<div class="fyr-dialog-icon fyr-dialog-icon-${this.options.type}">${icon}</div>`;
    }

    // Add message
    content += `<div class="fyr-dialog-message">${this.options.message}</div>`;

    // Add input for prompt
    if (this.options.inputType) {
      const isTextarea = this.options.inputType === 'textarea';
      const input = isTextarea
        ? `<textarea class="fyr-dialog-input" placeholder="${this.options.placeholder || ''}">${this.options.value || ''}</textarea>`
        : `<input class="fyr-dialog-input" type="${this.options.inputType}" placeholder="${this.options.placeholder || ''}" value="${this.options.value || ''}">`;

      content += `<div class="fyr-dialog-input-wrapper">${input}</div>`;
    }

    const buttons: ModalButton[] = [];

    // Cancel button
    if (this.options.showCancel) {
      buttons.push({
        label: this.options.cancelLabel || 'Cancel',
        variant: 'secondary',
        action: () => {
          resolve({ confirmed: false });
        },
      });
    }

    // Confirm button
    buttons.push({
      label: this.options.confirmLabel || 'OK',
      variant: this.options.type === 'warning' || this.options.type === 'error' ? 'danger' : 'primary',
      action: () => {
        let value: string | undefined;

        if (this.options.inputType) {
          const input = this.modal?.getElement()?.querySelector('.fyr-dialog-input') as HTMLInputElement | HTMLTextAreaElement;
          if (input) {
            value = input.value;
          }
        }

        resolve({ confirmed: true, value });
      },
    });

    return {
      title: this.options.title || '',
      content,
      size: this.options.size || 'md',
      buttons,
      closeOnOverlayClick: this.options.closeOnOverlayClick || false,
      closeOnEscape: true,
      className: this.options.className ? `fyr-dialog ${this.options.className}` : 'fyr-dialog',
      animation: 'scale',
    };
  }

  /**
   * Get icon for dialog type
   */
  private getIcon(): string {
    switch (this.options.type) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✕';
      case 'question':
        return '?';
      default:
        return 'ℹ';
    }
  }
}

/**
 * Create a dialog
 */
export function dialog(options: DialogOptions): Dialog {
  return new Dialog(options);
}

/**
 * Show an alert dialog
 */
dialog.alert = (message: string, title?: string): Promise<DialogResult> => {
  return new Dialog({
    message,
    title: title || 'Alert',
    type: 'info',
    confirmLabel: 'OK',
    showCancel: false,
  }).show();
};

/**
 * Show a confirm dialog
 */
dialog.confirm = (message: string, title?: string): Promise<DialogResult> => {
  return new Dialog({
    message,
    title: title || 'Confirm',
    type: 'question',
    confirmLabel: 'Yes',
    cancelLabel: 'No',
    showCancel: true,
  }).show();
};

/**
 * Show a prompt dialog
 */
dialog.prompt = (
  message: string,
  title?: string,
  placeholder?: string,
  value?: string
): Promise<DialogResult> => {
  return new Dialog({
    message,
    title: title || 'Input',
    type: 'info',
    confirmLabel: 'OK',
    cancelLabel: 'Cancel',
    showCancel: true,
    placeholder,
    value,
    inputType: 'text',
  }).show();
};

/**
 * Show an error dialog
 */
dialog.error = (message: string, title?: string): Promise<DialogResult> => {
  return new Dialog({
    message,
    title: title || 'Error',
    type: 'error',
    confirmLabel: 'OK',
    showCancel: false,
  }).show();
};

/**
 * Show a success dialog
 */
dialog.success = (message: string, title?: string): Promise<DialogResult> => {
  return new Dialog({
    message,
    title: title || 'Success',
    type: 'success',
    confirmLabel: 'OK',
    showCancel: false,
  }).show();
};

/**
 * Show a warning dialog
 */
dialog.warning = (message: string, title?: string): Promise<DialogResult> => {
  return new Dialog({
    message,
    title: title || 'Warning',
    type: 'warning',
    confirmLabel: 'OK',
    showCancel: false,
  }).show();
};

/**
 * Default dialog instance
 */
export default dialog;
