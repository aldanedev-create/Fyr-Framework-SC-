/**
 * Storage System - Main Export
 */

import { localStorageManager } from './local-storage';
import { sessionStorageManager } from './session-storage';
import { indexedDBManager } from './indexed-db';

export { localStorageManager, type LocalStorageOptions } from './local-storage';
export { sessionStorageManager, type SessionStorageOptions } from './session-storage';
export { indexedDBManager, type IndexedDBOptions } from './indexed-db';

// Default export for all storage
export const storage = {
  local: localStorageManager,
  session: sessionStorageManager,
  indexedDB: indexedDBManager,
};

export default storage;
