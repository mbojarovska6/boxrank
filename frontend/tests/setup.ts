// Newer Node.js versions have their own localStorage, which hides the browser
// version from jsdom in tests. If it is not usable, use a simple in-memory one.
function hasWorkingLocalStorage(): boolean {
  try {
    return typeof globalThis.localStorage?.clear === 'function';
  } catch {
    return false;
  }
}

if (!hasWorkingLocalStorage()) {
  const store = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => store.get(key) ?? null,
    key: (index) => [...store.keys()][index] ?? null,
    removeItem: (key) => {
      store.delete(key);
    },
    setItem: (key, value) => {
      store.set(key, String(value));
    },
  };
  Object.defineProperty(globalThis, 'localStorage', { value: memoryStorage, configurable: true });
}
