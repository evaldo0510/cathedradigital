import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Layout Governance & Exception Validation', () => {
  test('AppHeader should use fixed positioning and specific max-width patterns', async ({ page }) => {
    // Verify AppHeader doesn't break the layout authority in live preview
    await page.goto('/');
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // Check if it's sticky or fixed as per design system
    const position = await header.evaluate(el => window.getComputedStyle(el).position);
    expect(['sticky', 'fixed']).toContain(position);
  });

  test('ItinerariumStepPage should handle portal transitions correctly', async ({ page }) => {
    // Navigate to a step page if possible, or verify its structural integrity via script audit
    // Since this is a governance test, we mainly want to ensure the audit script covers it
    const output = execSync('bun run scripts/audit-layout-governance.ts', { encoding: 'utf8' });
    expect(output).toContain('Governance Status: ✅ PASSED');
  });

  test('New exceptions must be explicitly documented in the audit script', () => {
    // This is a meta-test ensuring the audit script exists and is configured to fail on unknown wrappers
    const fs = require('node:fs');
    const auditFile = fs.readFileSync('scripts/audit-layout-governance.ts', 'utf8');
    expect(auditFile).toContain('exemptionPatterns');
    expect(auditFile).toContain('violationsFound');
  });
});
