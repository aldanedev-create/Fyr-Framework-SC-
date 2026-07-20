/** Execute element-specific cleanup functions registered by directives. */
export function cleanupEvents(root: Element): void {
  const elements = [root, ...Array.from(root.querySelectorAll('*'))];
  for (const element of elements) {
    const cleanups = (element as HTMLElement & { __fyrCleanups?: Array<() => void> }).__fyrCleanups;
    if (!cleanups) continue;
    for (const cleanup of cleanups.splice(0)) cleanup();
  }
}
