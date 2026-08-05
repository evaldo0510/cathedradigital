import { test, expect } from '@playwright/test';

test('Jornada Detail and Step should display Nexus connections', async ({ page }) => {
  // 1. Visit a journey (using a known slug or ID if possible, otherwise first one)
  await page.goto('http://localhost:8080/jornadas');
  await page.waitForLoadState('networkidle');
  
  // Find first journey card and click
  const firstJourney = page.locator('[data-testid^="journey-card-"]').first();
  await expect(firstJourney).toBeVisible();
  await firstJourney.click();
  
  // 2. Validate Detail Page Nexus
  await expect(page).toHaveURL(/\/jornadas\/[^/]+/);
  // NexusPanel has data-nexus-panel attribute
  const nexusPanel = page.locator('[data-nexus-panel]');
  // Scroll to find it if needed
  await nexusPanel.scrollIntoViewIfNeeded();
  await expect(nexusPanel).toBeVisible({ timeout: 10000 });
  
  // 3. Go to first step
  const startBtn = page.locator('[data-testid="jornada-cta"]').first();
  await startBtn.click();
  
  // 4. Complete step to see Nexus in Step Page (it only shows after completion in JornadaStepPage)
  // We need to write something in the reflection first
  const textarea = page.locator('textarea#reflection-textarea');
  if (await textarea.isVisible()) {
    await textarea.fill('Esta é uma reflexão de teste com mais de dez caracteres.');
  }
  
  const completeBtn = page.locator('[data-testid="complete-step-btn"]');
  await completeBtn.click();
  
  // Wait for completed state
  await expect(page.locator('[data-reader-continuation="journey-step"]')).toBeVisible({ timeout: 10000 });
  
  // Check Nexus in Step Page
  const stepNexus = page.locator('[data-nexus-panel]');
  await stepNexus.scrollIntoViewIfNeeded();
  await expect(stepNexus).toBeVisible();
  
  // Check ReaderContinuation
  const continuation = page.locator('[data-reader-continuation="journey-step"]');
  await expect(continuation).toBeVisible();
  
  // Check if suggestions are present (if nexus has them)
  const suggestions = continuation.locator('li');
  const count = await suggestions.count();
  console.log('Suggestions count:', count);
  expect(count).toBeGreaterThan(0);
});
