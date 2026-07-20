/**
 * Component Events System
 * Handles component event emission and listening
 */

export interface ComponentEvent<T = any> {
  type: string;
  detail: T;
  target?: any;
  bubbles?: boolean;
  cancelable?: boolean;
  defaultPrevented?: boolean;
}

export type ComponentEventListener<T = any> = (event: ComponentEvent<T>) => void;

export interface ComponentEventEmitter {
  emit: <T>(event: string, detail?: T) => ComponentEvent<T>;
  on: <T>(event: string, listener: ComponentEventListener<T>) => void;
  off: <T>(event: string, listener: ComponentEventListener<T>) => void;
  once: <T>(event: string, listener: ComponentEventListener<T>) => void;
  clear: () => void;
}

/**
 * Create an event emitter for a component
 * @returns Event emitter
 */
export function createEventEmitter(): ComponentEventEmitter {
  const listeners = new Map<string, Set<ComponentEventListener>>();
  const onceListeners = new Map<string, Set<ComponentEventListener>>();

  const emitter: ComponentEventEmitter = {
    emit<T>(event: string, detail?: T): ComponentEvent<T> {
      const componentEvent: ComponentEvent<T> = {
        type: event,
        detail: detail as T,
        bubbles: true,
        cancelable: true,
        defaultPrevented: false,
      };

      // Dispatch to regular listeners
      const regular = listeners.get(event);
      if (regular) {
        for (const listener of regular) {
          try {
            listener(componentEvent);
          } catch (error) {
            console.error(`Event '${event}' listener error:`, error);
          }
        }
      }

      // Dispatch to once listeners
      const once = onceListeners.get(event);
      if (once) {
        for (const listener of once) {
          try {
            listener(componentEvent);
          } catch (error) {
            console.error(`Event '${event}' once listener error:`, error);
          }
        }
        onceListeners.delete(event);
      }

      // Dispatch DOM event
      if (typeof document !== 'undefined') {
        const domEvent = new CustomEvent(`fyr-component:${event}`, {
          detail: { event: componentEvent, detail },
          bubbles: true,
        });
        document.dispatchEvent(domEvent);
      }

      return componentEvent;
    },

    on<T>(event: string, listener: ComponentEventListener<T>): void {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event)!.add(listener as ComponentEventListener);
    },

    off<T>(event: string, listener: ComponentEventListener<T>): void {
      const eventListeners = listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(listener as ComponentEventListener);
        if (eventListeners.size === 0) {
          listeners.delete(event);
        }
      }

      const onceEventListeners = onceListeners.get(event);
      if (onceEventListeners) {
        onceEventListeners.delete(listener as ComponentEventListener);
        if (onceEventListeners.size === 0) {
          onceListeners.delete(event);
        }
      }
    },

    once<T>(event: string, listener: ComponentEventListener<T>): void {
      if (!onceListeners.has(event)) {
        onceListeners.set(event, new Set());
      }
      onceListeners.get(event)!.add(listener as ComponentEventListener);
    },

    clear(): void {
      listeners.clear();
      onceListeners.clear();
    },
  };

  return emitter;
}

/**
 * Emit a component event from an instance
 * @param instance - Component instance
 * @param event - Event name
 * @param detail - Event detail
 * @returns Component event
 */
export function emitComponentEvent<T>(
  instance: { emit: ComponentEventEmitter['emit'] },
  event: string,
  detail?: T
): ComponentEvent<T> {
  return instance.emit(event, detail);
}

/**
 * Listen to a component event
 * @param instance - Component instance
 * @param event - Event name
 * @param listener - Event listener
 */
export function onComponentEvent<T>(
  instance: { on: ComponentEventEmitter['on'] },
  event: string,
  listener: ComponentEventListener<T>
): void {
  instance.on(event, listener);
}

/**
 * Listen to a component event once
 * @param instance - Component instance
 * @param event - Event name
 * @param listener - Event listener
 */
export function onceComponentEvent<T>(
  instance: { once: ComponentEventEmitter['once'] },
  event: string,
  listener: ComponentEventListener<T>
): void {
  instance.once(event, listener);
}

/**
 * Create a DOM event handler for component events
 * @param componentName - Component name
 * @param event - Event name
 * @param handler - Event handler
 */
export function onComponentDOMEvent(
  componentName: string,
  event: string,
  handler: (detail: any) => void
): void {
  if (typeof document === 'undefined') return;

  const eventName = `fyr-component:${event}`;
  const listener = (e: Event) => {
    const customEvent = e as CustomEvent;
    const detail = customEvent.detail?.detail;
    if (customEvent.detail?.event?.target?.name === componentName) {
      handler(detail);
    }
  };

  document.addEventListener(eventName, listener as EventListener);
}
