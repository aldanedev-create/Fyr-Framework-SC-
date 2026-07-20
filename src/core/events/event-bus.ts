type EventHandler<T = unknown> = (payload: T) => void;
const listeners = new Map<string, Set<EventHandler>>();

export function on<T = unknown>(event: string, handler: EventHandler<T>): () => void {
  const handlers = listeners.get(event) ?? new Set<EventHandler>();
  handlers.add(handler as EventHandler);
  listeners.set(event, handlers);
  return () => off(event, handler);
}

export function off<T = unknown>(event: string, handler: EventHandler<T>): void {
  const handlers = listeners.get(event);
  if (!handlers) return;
  handlers.delete(handler as EventHandler);
  if (handlers.size === 0) listeners.delete(event);
}

export function emit<T = unknown>(event: string, payload?: T): void {
  for (const handler of listeners.get(event) ?? []) handler(payload);
}
