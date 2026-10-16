/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    // Give interaction-heavy component tests (userEvent + mock latency) more
    // headroom so they don't flake under load on constrained machines. Files
    // still run in isolation so module-level mock stores start fresh per file.
    testTimeout: 15000,
    // Local admin account used by the tests (local fallback mode only).
    env: { VITE_LOCAL_ADMIN_PASSWORD: 'test-admin-password' },
  },
});
