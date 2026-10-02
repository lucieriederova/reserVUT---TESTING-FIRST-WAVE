import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Generous timeout: this suite has been observed running under very
    // slow disk I/O (e.g. a cloud-synced project folder), where the default
    // 5s budget isn't enough for module re-imports in authController.test.ts.
    testTimeout: 30000,
  },
});
