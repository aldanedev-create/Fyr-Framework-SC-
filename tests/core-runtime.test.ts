import { describe, expect, it } from 'vitest';
import { createController } from '../src/core/controllers/controller-factory';
import { emit, on } from '../src/core/events/event-bus';
import { createReactiveState } from '../src/core/reactivity/reactive-state';
import { renderTree } from '../src/core/compiler/renderer';
import { HistoryManager } from '../src/router/history';

describe('core runtime additions', () => {
  it('creates reactive state without mutating the input container', () => {
    const source = { count: 1 };
    const state = createReactiveState(source);

    state.count = 2;

    expect(source.count).toBe(1);
    expect(state.count).toBe(2);
  });

  it('binds controller methods and keeps computed values reactive', async () => {
    const controller = createController({
      name: 'counter',
      state: { count: 1 },
      methods: {
        increment() {
          this.state.count += 1;
        },
      },
      computed: {
        doubled() {
          return this.state.count * 2;
        },
      },
    });

    expect(controller.computed.doubled.value).toBe(2);

    controller.methods.increment();
    await Promise.resolve();

    expect(controller.state.count).toBe(2);
    expect(controller.computed.doubled.value).toBe(4);
  });

  it('removes event-bus listeners through the unsubscribe function', () => {
    const received: string[] = [];
    const unsubscribe = on<string>('ready', value => received.push(value));

    emit('ready', 'first');
    unsubscribe();
    emit('ready', 'second');

    expect(received).toEqual(['first']);
  });

  it('registers built-in directives before rendering an app tree', () => {
    const controller = createController({ name: 'greeting', state: { message: 'Hello Fyr' } });
    const root = document.createElement('div');
    root.innerHTML = '<span fyr-text="message"></span>';

    renderTree(root, controller);

    expect(root.textContent).toBe('Hello Fyr');
  });

  it('normalizes history paths without requiring browser navigation', () => {
    const history = new HistoryManager({ mode: 'history', base: '/app' });

    expect(history.getFullPath('dashboard')).toBe('/app/dashboard');
    history.destroy();
  });
});
