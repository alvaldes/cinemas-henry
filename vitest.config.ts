/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  
  test: {
    // Environment configuration
    environment: 'jsdom',  // Use jsdom for DOM APIs (localStorage, CustomEvent)
    globals: true,         // Enable describe, it, expect without imports
    setupFiles: ['./tests/fixtures/setup.ts'],  // Global setup (mocks, matchers)

    // File discovery
    include: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
    ],
    exclude: [
      'node_modules',
      'dist',
      '.astro',
      '.pi',
      '.git',
      'tests/**',  // Exclude E2E tests (Playwright only)
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'tests/fixtures/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        '.astro/**',
      ],
    },

    // Performance settings
    testTimeout: 10000,    // 10s timeout per test (for async getMovies)
    hookTimeout: 10000,    // 10s for beforeEach, afterEach
    teardownTimeout: 10000,

    // Mock reset behavior
    clearMocks: true,      // Reset mocks after each test
    restoreMocks: true,    // Restore original mocks
    mockReset: true,       // Clear mock call history

    // Reporter settings
    watch: false,          // Set via CLI: vitest watch
    reporters: 'default',  // Inline reporter (can add 'verbose' if needed)
  },

  // Module resolution
  resolve: {
    alias: {
      '@': '/src',  // Optional: allows import '@/lib/utils' instead of '../../../lib/utils'
    },
  },
});
