import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import * as fs from 'fs';

test.describe('Layout Governance & Exception Validation', () => {
  test('Audit script should pass with current allowlist', async () => {
    try {
      const output = execSync('bun run scripts/audit-layout-governance.ts', { 
        encoding: 'utf8',
        env: { ...process.env, ALLOWLIST_MODIFIED: 'false' } 
      });
      expect(output).toContain('Governance Status: PASSED');
    } catch (e: any) {
      throw new Error(`Audit script failed: ${e.stdout}\n${e.stderr}`);
    }
  });

  test('Allowlist should adhere to the defined schema', () => {
    const ALLOWLIST_PATH = './layout-allowlist.json';
    expect(fs.existsSync(ALLOWLIST_PATH)).toBe(true);
    
    const rawData = JSON.parse(fs.readFileSync(ALLOWLIST_PATH, 'utf8'));
    expect(Array.isArray(rawData)).toBe(true);
    expect(rawData.length).toBeGreaterThan(0);
    
    // Ensure all entries are strings and not empty
    rawData.forEach((entry: any) => {
      expect(typeof entry).toBe('string');
      expect(entry.length).toBeGreaterThan(0);
    });
  });

  test('AppHeader should use fixed/sticky positioning', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    const position = await header.evaluate(el => window.getComputedStyle(el).position);
    expect(['sticky', 'fixed']).toContain(position);
  });
});

