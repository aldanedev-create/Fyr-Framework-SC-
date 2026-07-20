/**
 * Python Worker
 * Web Worker for running Python code
 */

// This is the worker script that runs in a separate thread

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pyodide: any = null;
let isReady = false;

/**
 * Worker message handler
 */
self.addEventListener('message', async (event: MessageEvent) => {
  const { id, type, payload } = event.data;

  try {
    let result;

    switch (type) {
      case 'run':
        result = await handleRun(payload);
        break;
      case 'eval':
        result = await handleEval(payload);
        break;
      case 'execute':
        result = await handleExecute(payload);
        break;
      case 'install':
        result = await handleInstall(payload);
        break;
      case 'ping':
        result = { pong: true };
        break;
      case 'status':
        result = { ready: isReady, loaded: pyodide !== null };
        break;
      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    self.postMessage({
      id,
      success: true,
      result,
    });
  } catch (error) {
    self.postMessage({
      id,
      success: false,
      error: {
        message: error instanceof Error ? error.message : String(error),
        code: 'WORKER_ERROR',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
  }
});

/**
 * Handle run request
 */
async function handleRun(payload: any): Promise<any> {
  await ensurePyodideLoaded();

  const { code, globals } = payload;

  if (typeof code !== 'string') {
    throw new Error('Code must be a string');
  }

  return pyodide.runPythonAsync(code);
}

/**
 * Handle eval request
 */
async function handleEval(payload: any): Promise<any> {
  await ensurePyodideLoaded();

  const { code, globals } = payload;

  if (typeof code !== 'string') {
    throw new Error('Code must be a string');
  }

  return pyodide.runPythonAsync(`result = ${code}\nresult`);
}

/**
 * Handle execute request
 */
async function handleExecute(payload: any): Promise<any> {
  await ensurePyodideLoaded();

  const { code, globals } = payload;

  if (typeof code !== 'string') {
    throw new Error('Code must be a string');
  }

  return pyodide.runPythonAsync(code);
}

/**
 * Handle install request
 */
async function handleInstall(payload: any): Promise<any> {
  await ensurePyodideLoaded();

  const { packages } = payload;

  if (!Array.isArray(packages)) {
    throw new Error('Packages must be an array');
  }

  await pyodide.loadPackage(packages);
  return { installed: packages };
}

/**
 * Ensure Pyodide is loaded
 */
async function ensurePyodideLoaded(): Promise<void> {
  if (pyodide) {
    return;
  }

  try {
    // Import Pyodide
    const module = await import('https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.mjs');
    pyodide = await module.loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/',
    });

    // Set up basic environment
    await pyodide.runPythonAsync(`
import sys
import json
import math
import random
    `);

    isReady = true;

    // Notify parent
    self.postMessage({
      type: 'ready',
      success: true,
    });
  } catch (error) {
    throw new Error(`Failed to load Pyodide: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Handle worker errors
 */
self.addEventListener('error', (event) => {
  console.error('Python worker error:', event);
});

/**
 * Handle unhandled promise rejections
 */
self.addEventListener('unhandledrejection', (event) => {
  console.error('Python worker unhandled rejection:', event.reason);
});