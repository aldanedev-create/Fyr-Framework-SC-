/** Resolve either an element or a selector to a live HTMLElement. */
export function getElement(target: string | HTMLElement): HTMLElement | null {
  if (target instanceof HTMLElement) return target;
  return typeof document === 'undefined' ? null : document.querySelector<HTMLElement>(target);
}
