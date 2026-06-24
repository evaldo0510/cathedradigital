import { test, expect } from '@playwright/test';

/**
 * Smoke: when both clipboard strategies fail (no permission AND execCommand returns false),
 * the copy button must surface "Não foi possível copiar" and the user-visible text in
 * surrounding fields (canonical_abbr value, bollsId value) must NOT change.
 */
test.describe('BibleAbbrValidatePage — copy failure (smoke)', () => {
  test('shows "Não foi possível copiar" and leaves canonical_abbr / bollsId text intact', async ({ page, context }) => {
    // Deny clipboard so navigator.clipboard.writeText rejects.
    await context.clearPermissions();

    await page.addInitScript(() => {
      // Force navigator.clipboard.writeText to reject (permission denied).
      try {
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: {
            writeText: () =>
              Promise.reject(
                Object.assign(new Error('Write permission denied.'), { name: 'NotAllowedError' }),
              ),
          },
        });
      } catch {
        /* some browsers refuse redefining; the fallback still runs */
      }
      // Force the execCommand fallback to fail too.
      document.execCommand = () => false;
    });

    await page.goto('/bible-abbr-validate');
    await expect(page.getByText(/resolvido/i)).toBeVisible({ timeout: 15000 });

    // Capture the rendered values BEFORE clicking copy.
    const canonValueLocator = page.locator('dd', { hasText: /^2Cr$/ }).first();
    const bollsValueLocator = page.locator('dd', { hasText: /^14$/ }).first();
    const canonBefore = await canonValueLocator.textContent();
    const bollsBefore = await bollsValueLocator.textContent();

    // --- canonical_abbr: click and assert failure UI + unchanged value ---
    const canonBtn = page.getByRole('button', { name: /copiar canonical_abbr/i });
    await canonBtn.click();

    await expect(canonBtn).toHaveText(/não foi possível copiar/i);
    await expect(canonBtn).toBeEnabled();
    await expect(canonBtn).toHaveAttribute('data-copy-state', 'error');

    // Persistent error toast visible.
    const errToast = page.getByText(/não foi possível copiar/i).first();
    await expect(errToast).toBeVisible();
    await page.waitForTimeout(3500);
    await expect(errToast).toBeVisible();

    // The displayed canonical_abbr value did not change.
    expect(await canonValueLocator.textContent()).toBe(canonBefore);

    // --- bollsId: same expectations ---
    const bollsBtn = page.getByRole('button', { name: /copiar bollsid/i });
    await bollsBtn.click();
    await expect(bollsBtn).toHaveText(/não foi possível copiar/i);
    await expect(bollsBtn).toBeEnabled();
    expect(await bollsValueLocator.textContent()).toBe(bollsBefore);
  });
});
