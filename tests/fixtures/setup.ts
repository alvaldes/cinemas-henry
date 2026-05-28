import { expect, afterEach, vi } from 'vitest';

/**
 * Global test setup: matchers, mocks, cleanup
 * Auto-loaded by vitest.config.ts
 */

// ============================================================================
// 1. Extend expect() with Testing Library matchers
// ============================================================================
// Import matchers but don't re-export; they extend global expect()
import * as matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);

// ============================================================================
// 2. Global fetch mock (dummy; replaced per-test as needed)
// ============================================================================
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
) as any;

// ============================================================================
// 3. Global localStorage mock (Preact components use it)
// ============================================================================
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => {
      return store[key] || null;
    },
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// ============================================================================
// 4. Global cleanup after each test
// ============================================================================
afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});
