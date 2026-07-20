import type { FyrConfig } from '../types';

let currentConfig: FyrConfig = {};
export function configure(config: Partial<FyrConfig>): FyrConfig {
  currentConfig = { ...currentConfig, ...config };
  return getConfig();
}
export function getConfig(): FyrConfig { return { ...currentConfig }; }
export function resetConfig(): void { currentConfig = {}; }
