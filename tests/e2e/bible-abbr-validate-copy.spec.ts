import { test, expect } from '@playwright/test';

/**
 * Smoke test for /bible-abbr-validate copy buttons:
 * - Clicks both "Copiar canonical_abbr" and "Copiar bollsId".
 * - Verifies a persistent toast appears for each (does not auto-dismiss).
 * - Verifies the toast stays visible until the close button is pressed.
 */
test.describe('BibleAbbrValidatePage — copy buttons (smoke)', () => {
  test.beforeEach(async ({ context }) => {
    // Grant clipboard so navigator.clipboard.writeText works headlessly.
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  });

  test('copy canonical_abbr and bollsId show persistent toasts dismissed via close button', async ({ page }) => {
    await page.goto('/bible-abbr-validate');

    // Wait for the result card to resolve "2 Cr" (default input).
    await expect(page.getByText(/resolvido/i)).toBeVisible({ timeout: 15000 });

    // --- canonical_abbr ---
    const canonicalBtn = page.getByRole('button', { name: /copiar canonical_abbr/i });
    await expect(canonicalBtn).toBeVisible();
    await canonicalBtn.click();

    const canonicalToast = page.getByText(/canonical_abbr copiado/i).first();
    await expect(canonicalToast).toBeVisible();

    // Persistence: should still be visible after 3s (default sonner duration is ~4s).
    await page.waitForTimeout(3500);
    await expect(canonicalToast).toBeVisible();

    // Close button on the toast.
    const closeCanonical = page
      .locator('[data-sonner-toast]', { hasText: /canonical_abbr copiado/i })
      .getByRole('button', { name: /close|fechar/i })
      .first();
    await closeCanonical.click();
    await expect(canonicalToast).toBeHidden({ timeout: 5000 });

    // --- bollsId ---
    const bollsBtn = page.getByRole('button', { name: /copiar bollsid/i });
    await expect(bollsBtn).toBeVisible();
    await bollsBtn.click();

    const bollsToast = page.getByText(/bollsid copiado/i).first();
    await expect(bollsToast).toBeVisible();

    await page.waitForTimeout(3500);
    await expect(bollsToast).toBeVisible();

    const closeBolls = page
      .locator('[data-sonner-toast]', { hasText: /bollsid copiado/i })
      .getByRole('button', { name: /close|fechar/i })
      .first();
    await closeBolls.click();
    await expect(bollsToast).toBeHidden({ timeout: 5000 });
  });
});
