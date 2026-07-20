/**
 * UI System - Main Export
 * UI helpers for toast, modal, dialog, and loading
 */

import { toast } from './toast';
import { modal } from './modal';
import { dialog } from './dialog';
import { loading } from './loading';
import './fyr-ui.css';

export { toast, Toast, type ToastOptions, type ToastType } from './toast';
export { modal, Modal, type ModalOptions, type ModalButton } from './modal';
export { dialog, Dialog, type DialogOptions, type DialogResult } from './dialog';
export { loading, Loading, type LoadingOptions } from './loading';

// Default export
export default {
  toast,
  modal,
  dialog,
  loading,
};
