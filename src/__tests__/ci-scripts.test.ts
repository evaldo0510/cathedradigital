import { describe, it, expect, vi } from 'vitest';
import { execSync } from 'child_process';

describe('CI Scripts Environment Safety', () => {
  it('should run validate-catechism script without window or localStorage', () => {
    // We execute the script in a separate process to ensure a clean environment
    // similar to how it would run in CI (via bun run)
    expect(() => {
      execSync('bun run scripts/validate-catechism.ts', { 
        env: { ...process.env, CATECHISM_DRY_RUN: 'true' },
        stdio: 'pipe' 
      });
    }).not.toThrow();
  });

  it('should run security-audit script without window or localStorage', () => {
    expect(() => {
      execSync('bun run scripts/security-audit.ts', { 
        stdio: 'pipe' 
      });
    }).not.toThrow();
  });
});
