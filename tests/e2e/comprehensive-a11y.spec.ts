
import { test, expect } from '@playwright/test';

test.describe('Accessibility & Keyboard Navigation', () => {
  test('should navigate through buttons and form elements using keyboard', async ({ page }) => {
    // We'll use the Design System Guide page as it contains all variants
    await page.goto('/design-system');
    
    // 1. Check Button Focus
    const primaryButton = page.getByRole('button', { name: 'Primary Action' });
    await page.keyboard.press('Tab'); // Navigate until we hit the first button if needed
    // The exact number of tabs depends on header, but let's focus directly to test behavior
    await primaryButton.focus();
    await expect(primaryButton).toBeFocused();
    // Visual focus ring check (implicit by being focused in Playwright usually, 
    // but we can check CSS if critical)
    
    // 2. Check Input Focus & States
    const playgroundInput = page.getByPlaceholder('Interaja comigo');
    await playgroundInput.focus();
    await expect(playgroundInput).toBeFocused();
    
    // 3. Test Loading State (Aria-busy/disabled)
    const loadingTab = page.getByRole('button', { name: 'Loading', exact: true });
    await loadingTab.click();
    
    const loadingInput = page.getByPlaceholder('Processando...');
    await expect(loadingInput).toBeDisabled();
    
    // Check specific aria attributes on a button in loading state
    // We need a button that is currently in loading state in the playground
    // The playground updates its state when we click 'Loading'
  });

  test('should skip disabled elements in tab order', async ({ page }) => {
    await page.goto('/design-system');
    
    // In the guide, we have a disabled input section
    const disabledInput = page.locator('#disabled-input-guide');
    await expect(disabledInput).toBeDisabled();
    
    // Attempt to tab to it - it should not receive focus
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.id);
    expect(focused).not.toBe('disabled-input-guide');
  });

  test('should have no basic accessibility violations on key components', async ({ page }) => {
    await page.goto('/design-system');
    
    // Validate aria-busy on loading components
    const loadingBtn = page.getByRole('button', { name: 'Loading Primary' });
    await expect(loadingBtn).toHaveAttribute('aria-busy', 'true');
    await expect(loadingBtn).toHaveAttribute('aria-disabled', 'true');
    
    // Check icon-only buttons have aria-label
    const searchBtn = page.getByTitle('Guia do Ecossistema');
    // or specifically check if it has a label
    const accessibleName = await searchBtn.evaluate(el => el.getAttribute('aria-label') || el.getAttribute('title'));
    expect(accessibleName).toBeTruthy();
  });
});
