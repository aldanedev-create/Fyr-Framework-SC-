import { createPlugin, type Plugin } from './plugin';

const plugins = new Map<string, Plugin>();
export function plugin(name: string, install: Plugin['install']): Plugin {
  const definition = createPlugin(name, install);
  plugins.set(name, definition);
  return definition;
}
export function getPlugin(name: string): Plugin | undefined { return plugins.get(name); }
export function getPlugins(): Plugin[] { return Array.from(plugins.values()); }
