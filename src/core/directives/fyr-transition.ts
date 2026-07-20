/**
 * fyr-transition Directive
 * Adds enter/leave animations with CSS transitions
 * 
 * Usage:
 *   <div fyr-transition="fade">Content</div>
 *   <div fyr-transition="slide">Content</div>
 *   <div fyr-transition="scale">Content</div>
 *   <div fyr-transition="custom-class">Content</div>
 * 
 * With custom duration:
 *   <div fyr-transition="fade" fyr-transition-duration="500">Content</div>
 * 
 * With custom timing function:
 *   <div fyr-transition="fade" fyr-transition-timing="ease-in-out">Content</div>
 * 
 * With delay:
 *   <div fyr-transition="fade" fyr-transition-delay="200">Content</div>
 */

import type { DirectiveHandler, DirectiveContext } from './types';
import { registerCleanup } from '../compiler/cleanup';
import { evaluateExpression } from '../compiler/expression-evaluator';
import { createEffect } from '../reactivity/effect';

/**
 * Transition configuration
 */
interface TransitionConfig {
  /** Transition name/type */
  name: string;
  /** Duration in milliseconds */
  duration: number;
  /** Timing function */
  timing: string;
  /** Delay in milliseconds */
  delay: number;
  /** Whether to show on initial render */
  appear: boolean;
  /** Mode: 'in-out' | 'out-in' | 'simultaneous' */
  mode: 'in-out' | 'out-in' | 'simultaneous';
}

/**
 * Default transition configuration
 */
const DEFAULT_CONFIG: TransitionConfig = {
  name: 'fade',
  duration: 300,
  timing: 'ease',
  delay: 0,
  appear: true,
  mode: 'simultaneous',
};

/**
 * Transition states
 */
enum TransitionState {
  IDLE = 'idle',
  ENTERING = 'entering',
  ENTERED = 'entered',
  LEAVING = 'leaving',
  LEFT = 'left',
}

/**
 * Default CSS transitions
 */
const DEFAULT_TRANSITIONS: Record<string, { enter: string; leave: string }> = {
  fade: {
    enter: 'opacity: 0; transition: opacity {duration}ms {timing} {delay}ms;',
    leave: 'opacity: 0; transition: opacity {duration}ms {timing} {delay}ms;',
  },
  slide: {
    enter: 'transform: translateY(20px); opacity: 0; transition: all {duration}ms {timing} {delay}ms;',
    leave: 'transform: translateY(-20px); opacity: 0; transition: all {duration}ms {timing} {delay}ms;',
  },
  slideLeft: {
    enter: 'transform: translateX(20px); opacity: 0; transition: all {duration}ms {timing} {delay}ms;',
    leave: 'transform: translateX(-20px); opacity: 0; transition: all {duration}ms {timing} {delay}ms;',
  },
  slideRight: {
    enter: 'transform: translateX(-20px); opacity: 0; transition: all {duration}ms {timing} {delay}ms;',
    leave: 'transform: translateX(20px); opacity: 0; transition: all {duration}ms {timing} {delay}ms;',
  },
  scale: {
    enter: 'transform: scale(0.8); opacity: 0; transition: all {duration}ms {timing} {delay}ms;',
    leave: 'transform: scale(1.2); opacity: 0; transition: all {duration}ms {timing} {delay}ms;',
  },
  rotate: {
    enter: 'transform: rotate(-10deg) scale(0.9); opacity: 0; transition: all {duration}ms {timing} {delay}ms;',
    leave: 'transform: rotate(10deg) scale(1.1); opacity: 0; transition: all {duration}ms {timing} {delay}ms;',
  },
  flip: {
    enter: 'transform: perspective(400px) rotateX(90deg); opacity: 0; transition: all {duration}ms {timing} {delay}ms;',
    leave: 'transform: perspective(400px) rotateX(-90deg); opacity: 0; transition: all {duration}ms {timing} {delay}ms;',
  },
  bounce: {
    enter: 'transform: scale(0.3); opacity: 0; transition: all {duration}ms cubic-bezier(0.68, -0.55, 0.265, 1.55) {delay}ms;',
    leave: 'transform: scale(0.3); opacity: 0; transition: all {duration}ms cubic-bezier(0.68, -0.55, 0.265, 1.55) {delay}ms;',
  },
};

/**
 * fyr-transition directive handler
 * Applies enter/leave animations to elements
 */
export const fyrTransitionDirective: DirectiveHandler = (
  element: HTMLElement,
  expression: string,
  context: DirectiveContext
): void => {
  // Skip if already bound
  if ((element as any).__fyrTransitionBound) {
    return;
  }
  (element as any).__fyrTransitionBound = true;

  // Parse configuration
  const config = parseConfig(element, expression, context);
  
  // Store config on element
  (element as any).__fyrTransitionConfig = config;

  // Get the actual content element (for fyr-if and fyr-for, the template is the parent)
  let targetElement: HTMLElement = element;

  // If this is a template element, we need to handle transitions on its rendered children
  if (element instanceof HTMLTemplateElement) {
    // For templates, we'll handle transitions when content is rendered
    (element as any).__fyrTransitionTemplate = true;
    // The actual transitions will be applied to the rendered content
    // We'll use a mutation observer to detect when content is added/removed
    setupTemplateTransitions(element, config, context);
    return;
  }

  // For regular elements, apply transitions directly
  setupElementTransitions(targetElement, config, context);

  // Register cleanup
  registerCleanup(element, () => {
    cleanupTransitions(element);
    (element as any).__fyrTransitionBound = false;
  });
};

/**
 * Parse configuration from element attributes
 */
function parseConfig(
  element: HTMLElement,
  expression: string,
  context: DirectiveContext
): TransitionConfig {
  const config: TransitionConfig = { ...DEFAULT_CONFIG };

  // Get transition name from expression
  const exprValue = expression.trim();
  if (exprValue && exprValue !== '') {
    // Try to evaluate the expression
    try {
      const evaluated = evaluateExpression(exprValue, context);
      if (typeof evaluated === 'string') {
        config.name = evaluated;
      } else if (typeof evaluated === 'object' && evaluated !== null) {
        // If expression returns an object with config
        Object.assign(config, evaluated);
        if (evaluated.name) {
          config.name = evaluated.name;
        }
      }
    } catch {
      // If evaluation fails, use the expression as the name
      config.name = exprValue;
    }
  }

  // Check for custom attributes
  const durationAttr = element.getAttribute('fyr-transition-duration');
  if (durationAttr) {
    const duration = parseInt(durationAttr, 10);
    if (!isNaN(duration) && duration > 0) {
      config.duration = duration;
    }
  }

  const timingAttr = element.getAttribute('fyr-transition-timing');
  if (timingAttr) {
    config.timing = timingAttr;
  }

  const delayAttr = element.getAttribute('fyr-transition-delay');
  if (delayAttr) {
    const delay = parseInt(delayAttr, 10);
    if (!isNaN(delay) && delay >= 0) {
      config.delay = delay;
    }
  }

  const appearAttr = element.getAttribute('fyr-transition-appear');
  if (appearAttr) {
    config.appear = appearAttr !== 'false';
  }

  const modeAttr = element.getAttribute('fyr-transition-mode');
  if (modeAttr && ['in-out', 'out-in', 'simultaneous'].includes(modeAttr)) {
    config.mode = modeAttr as 'in-out' | 'out-in' | 'simultaneous';
  }

  return config;
}

/**
 * Setup transitions on a single element
 */
function setupElementTransitions(
  element: HTMLElement,
  config: TransitionConfig,
  context: DirectiveContext
): void {
  let state: TransitionState = TransitionState.IDLE;
  let cleanupHandlers: Array<() => void> = [];

  // Get or create transition wrapper
  const wrapper = getTransitionWrapper(element);
  
  // Store state on element
  (element as any).__fyrTransitionState = state;
  (element as any).__fyrTransitionCleanup = cleanupHandlers;

  // If element should appear with animation
  if (config.appear) {
    // Enter on initial render
    enterElement(element, config, context);
  }

  // Create effect to watch for visibility changes
  const effect = createEffect(() => {
    // Check if element is being shown/hidden by fyr-show or fyr-if
    const isVisible = isElementVisible(element, context);
    const currentState = (element as any).__fyrTransitionState || TransitionState.IDLE;

    if (isVisible && (currentState === TransitionState.IDLE || currentState === TransitionState.LEFT)) {
      // Element is becoming visible - enter animation
      enterElement(element, config, context);
    } else if (!isVisible && (currentState === TransitionState.ENTERED || currentState === TransitionState.ENTERING)) {
      // Element is becoming hidden - leave animation
      leaveElement(element, config, context);
    }
  });

  // Store effect for cleanup
  (element as any).__fyrTransitionEffect = effect;

  // Watch for DOM changes that might affect visibility
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => {
      // Check if element still exists in DOM
      if (!document.contains(element)) {
        // Element removed from DOM - cleanup
        cleanupTransitions(element);
      }
    });
    observer.observe(element.parentNode || document, { childList: true, subtree: true });
    (element as any).__fyrTransitionObserver = observer;
    cleanupHandlers.push(() => observer.disconnect());
  }
}

/**
 * Setup transitions for template elements (fyr-if, fyr-for)
 */
function setupTemplateTransitions(
  template: HTMLTemplateElement,
  config: TransitionConfig,
  context: DirectiveContext
): void {
  // Use mutation observer to detect when template content is rendered
  if (typeof MutationObserver === 'undefined') return;

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        // Check for added nodes
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            // Check if this node is from the template
            if (isNodeFromTemplate(node, template)) {
              // Apply enter animation
              const childConfig = { ...config };
              // Check if child has its own transition config
              const childAttr = node.getAttribute('fyr-transition');
              if (childAttr) {
                const childConfig_ = parseConfig(node, childAttr, context);
                Object.assign(childConfig, childConfig_);
              }
              setupElementTransitions(node, childConfig, context);
              // Don't automatically enter - wait for the element to be visible
              // The element will enter when the effect triggers
            }
          }
        }

        // Check for removed nodes
        for (const node of mutation.removedNodes) {
          if (node instanceof HTMLElement) {
            // Apply leave animation before removal
            if ((node as any).__fyrTransitionState === TransitionState.ENTERED) {
              leaveElement(node, config, context);
            }
          }
        }
      }
    }
  });

  // Observe the template's parent
  const parent = template.parentElement;
  if (parent) {
    observer.observe(parent, { childList: true, subtree: true });
    (template as any).__fyrTransitionObserver = observer;
  }

  // Register cleanup
  registerCleanup(template, () => {
    observer.disconnect();
  });
}

/**
 * Check if a node is from a template
 */
function isNodeFromTemplate(node: HTMLElement, template: HTMLTemplateElement): boolean {
  let current: Node | null = node;
  while (current) {
    if (current === template) return true;
    if (current instanceof HTMLTemplateElement) return false;
    current = current.parentNode;
  }
  return false;
}

/**
 * Get or create transition wrapper
 */
function getTransitionWrapper(element: HTMLElement): HTMLElement {
  // If element already has a transition wrapper, return it
  if ((element as any).__fyrTransitionWrapper) {
    return (element as any).__fyrTransitionWrapper;
  }

  // Create wrapper
  const wrapper = document.createElement('span');
  wrapper.style.display = 'contents';
  wrapper.className = 'fyr-transition-wrapper';

  // Insert wrapper before element
  const parent = element.parentNode;
  if (parent) {
    parent.insertBefore(wrapper, element);
    wrapper.appendChild(element);
  }

  (element as any).__fyrTransitionWrapper = wrapper;
  return wrapper;
}

/**
 * Enter animation
 */
function enterElement(
  element: HTMLElement,
  config: TransitionConfig,
  context: DirectiveContext
): void {
  const currentState = (element as any).__fyrTransitionState || TransitionState.IDLE;

  // Don't re-enter if already entered or entering
  if (currentState === TransitionState.ENTERED || currentState === TransitionState.ENTERING) {
    return;
  }

  // Set state to entering
  (element as any).__fyrTransitionState = TransitionState.ENTERING;

  // Get transition styles
  const styles = getTransitionStyles(config.name, 'enter', config);
  
  // Prepare element for enter
  element.style.display = '';
  element.style.opacity = '0';
  
  // Apply initial state (before transition)
  applyStyles(element, styles.initial);

  // Force reflow
  void element.offsetHeight;

  // Apply transition styles
  element.style.transition = styles.transition;
  
  // Apply final state (after transition)
  requestAnimationFrame(() => {
    applyStyles(element, styles.final);
  });

  // Clean up after transition
  const duration = config.duration + config.delay;
  const timeout = setTimeout(() => {
    // Remove transition properties
    element.style.transition = '';
    
    // Set state to entered
    (element as any).__fyrTransitionState = TransitionState.ENTERED;

    // Emit event
    const event = new CustomEvent('fyr-transition-enter', {
      detail: { element, config },
    });
    document.dispatchEvent(event);
  }, duration + 50); // Small buffer

  // Store timeout for cleanup
  const cleanups = (element as any).__fyrTransitionCleanup || [];
  cleanups.push(() => clearTimeout(timeout));
  (element as any).__fyrTransitionCleanup = cleanups;
}

/**
 * Leave animation
 */
function leaveElement(
  element: HTMLElement,
  config: TransitionConfig,
  context: DirectiveContext
): void {
  const currentState = (element as any).__fyrTransitionState || TransitionState.IDLE;

  // Don't leave if already leaving or left
  if (currentState === TransitionState.LEAVING || currentState === TransitionState.LEFT) {
    return;
  }

  // Set state to leaving
  (element as any).__fyrTransitionState = TransitionState.LEAVING;

  // Get transition styles
  const styles = getTransitionStyles(config.name, 'leave', config);
  
  // Apply transition styles
  element.style.transition = styles.transition;
  
  // Apply final state (after transition)
  requestAnimationFrame(() => {
    applyStyles(element, styles.final);
  });

  // Clean up after transition
  const duration = config.duration + config.delay;
  const timeout = setTimeout(() => {
    // Hide element
    element.style.display = 'none';
    element.style.transition = '';
    
    // Set state to left
    (element as any).__fyrTransitionState = TransitionState.LEFT;

    // Emit event
    const event = new CustomEvent('fyr-transition-leave', {
      detail: { element, config },
    });
    document.dispatchEvent(event);
  }, duration + 50); // Small buffer

  // Store timeout for cleanup
  const cleanups = (element as any).__fyrTransitionCleanup || [];
  cleanups.push(() => clearTimeout(timeout));
  (element as any).__fyrTransitionCleanup = cleanups;
}

/**
 * Get transition styles for a specific transition type
 */
function getTransitionStyles(
  name: string,
  type: 'enter' | 'leave',
  config: TransitionConfig
): { initial: Record<string, string>; final: Record<string, string>; transition: string } {
  // Check if it's a built-in transition
  const builtIn = DEFAULT_TRANSITIONS[name];
  
  if (builtIn) {
    const styles = builtIn[type];
    const processed = styles
      .replace(/{duration}/g, String(config.duration))
      .replace(/{timing}/g, config.timing)
      .replace(/{delay}/g, String(config.delay));

    // Parse the style string
    const parsed = parseStyleString(processed);
    
    // For entering, initial is the parsed styles, final is normal state
    if (type === 'enter') {
      return {
        initial: parsed,
        final: {},
        transition: `all ${config.duration}ms ${config.timing} ${config.delay}ms`,
      };
    } else {
      // For leaving, initial is normal state, final is the parsed styles
      return {
        initial: {},
        final: parsed,
        transition: `all ${config.duration}ms ${config.timing} ${config.delay}ms`,
      };
    }
  }

  // Custom transition - use class-based approach
  // User can define .fyr-transition-custom-enter and .fyr-transition-custom-leave classes
  return {
    initial: {},
    final: {},
    transition: `all ${config.duration}ms ${config.timing} ${config.delay}ms`,
  };
}

/**
 * Parse a style string into an object
 */
function parseStyleString(styleString: string): Record<string, string> {
  const result: Record<string, string> = {};
  const rules = styleString.split(';').filter(s => s.trim());

  for (const rule of rules) {
    const [property, value] = rule.split(':').map(s => s.trim());
    if (property && value) {
      result[property] = value;
    }
  }

  return result;
}

/**
 * Apply styles to an element
 */
function applyStyles(element: HTMLElement, styles: Record<string, string>): void {
  for (const [property, value] of Object.entries(styles)) {
    if (value) {
      element.style.setProperty(property, value);
    } else {
      element.style.removeProperty(property);
    }
  }
}

/**
 * Check if an element is visible
 */
function isElementVisible(element: HTMLElement, context: DirectiveContext): boolean {
  // Check if element has hidden attribute
  if (element.hidden) return false;

  // Check if element has display:none
  if (element.style.display === 'none') return false;

  // Check if any parent has display:none
  let parent: HTMLElement | null = element.parentElement;
  while (parent) {
    if (parent.style.display === 'none' || parent.hidden) {
      return false;
    }
    parent = parent.parentElement;
  }

  // Check if element is in the DOM
  if (!document.contains(element)) return false;

  return true;
}

/**
 * Clean up transitions on an element
 */
function cleanupTransitions(element: HTMLElement): void {
  // Clear timeouts
  const cleanups = (element as any).__fyrTransitionCleanup || [];
  for (const cleanup of cleanups) {
    try {
      cleanup();
    } catch {
      // Ignore errors
    }
  }
  (element as any).__fyrTransitionCleanup = [];

  // Disconnect observer
  const observer = (element as any).__fyrTransitionObserver;
  if (observer) {
    try {
      observer.disconnect();
    } catch {
      // Ignore errors
    }
  }
  (element as any).__fyrTransitionObserver = null;

  // Clean up effect
  const effect = (element as any).__fyrTransitionEffect;
  if (effect) {
    try {
      effect();
    } catch {
      // Ignore errors
    }
  }
  (element as any).__fyrTransitionEffect = null;

  // Reset state
  (element as any).__fyrTransitionState = TransitionState.IDLE;

  // Remove wrapper if exists
  const wrapper = (element as any).__fyrTransitionWrapper;
  if (wrapper && wrapper.parentNode) {
    const parent = wrapper.parentNode;
    parent.insertBefore(element, wrapper);
    wrapper.remove();
  }
  (element as any).__fyrTransitionWrapper = null;
}