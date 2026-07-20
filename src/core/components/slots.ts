/**
 * Slots System
 * Handles component slot rendering
 */

export interface SlotDefinition {
  name: string;
  defaultContent?: string;
}

export interface SlotContext {
  props: Record<string, any>;
  state: Record<string, any>;
  methods: Record<string, Function>;
}

export type SlotRenderer = (context: SlotContext) => string;

/**
 * Render slots
 * @param slotDefs - Slot definitions
 * @param slotContent - Slot content from parent
 * @param context - Slot context
 * @returns Rendered slot HTML
 */
export function renderSlots(
  slotDefs: Record<string, SlotDefinition>,
  slotContent: Record<string, string>,
  context?: SlotContext
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [name, def] of Object.entries(slotDefs)) {
    // Use provided content or default
    const content = slotContent[name] || def.defaultContent || '';
    // Render with context if provided
    result[name] = context ? renderSlotContent(content, context) : content;
  }

  // Handle default slot
  if (slotContent.default) {
    result.default = context ? renderSlotContent(slotContent.default, context) : slotContent.default;
  }

  return result;
}

/**
 * Render slot content with context
 * @param content - Slot content string
 * @param context - Slot context
 * @returns Rendered content
 */
function renderSlotContent(content: string, context: SlotContext): string {
  // Simple template rendering with {{ }} syntax
  return content.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, expr) => {
    const trimmed = expr.trim();
    // Check if it's a simple property access
    const parts = trimmed.split('.');
    let value: any = context;
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        value = undefined;
        break;
      }
    }
    return value !== undefined && value !== null ? String(value) : '';
  });
}

/**
 * Create a scoped slot renderer
 * @param slotName - Slot name
 * @param content - Slot content
 * @param context - Slot context
 * @returns Render function
 */
export function createSlotRenderer(
  slotName: string,
  content: string,
  context: SlotContext
): () => string {
  return () => renderSlotContent(content, context);
}

/**
 * Process slot content
 * @param content - Slot content
 * @param props - Props to pass to slot
 * @returns Processed content
 */
export function processSlotContent(content: string, props: Record<string, any>): string {
  // Replace slot attributes with values
  let result = content;
  for (const [key, value] of Object.entries(props)) {
    const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    result = result.replace(pattern, String(value));
  }
  return result;
}