import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { mapRole as MapRoleFn } from './authController.js';

const HEAD_ADMIN_EMAIL = 'admin@example.com';

describe('mapRole', () => {
  let mapRole: typeof MapRoleFn;

  // HEAD_ADMIN_EMAIL is read once at module load, so the module needs a
  // fresh import after stubbing the env var. Done once in beforeAll (rather
  // than per test) since all tests in this file share the same stubbed value.
  beforeAll(async () => {
    vi.stubEnv('HEAD_ADMIN_EMAIL', HEAD_ADMIN_EMAIL);
    vi.resetModules();
    ({ mapRole } = await import('./authController.js'));
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it('normalizes case/spacing variants to the canonical role for a non-admin email', () => {
    expect(mapRole('student', 'someone@example.com')).toBe('STUDENT');
    expect(mapRole('STUDENT', 'someone@example.com')).toBe('STUDENT');
    expect(mapRole('ceo', 'someone@example.com')).toBe('CEO');
    expect(mapRole('Guide', 'someone@example.com')).toBe('GUIDE');
  });

  it('returns null for an unrecognized role string', () => {
    expect(mapRole('astronaut', 'someone@example.com')).toBeNull();
  });

  it('grants HEAD_ADMIN only to the configured admin email', () => {
    expect(mapRole('head_admin', HEAD_ADMIN_EMAIL)).toBe('HEAD_ADMIN');
    expect(mapRole('HEAD_ADMIN', HEAD_ADMIN_EMAIL)).toBe('HEAD_ADMIN');
  });

  it('silently downgrades a HEAD_ADMIN request from any other email to STUDENT', () => {
    expect(mapRole('head admin', 'not-the-admin@example.com')).toBe('STUDENT');
  });
});
