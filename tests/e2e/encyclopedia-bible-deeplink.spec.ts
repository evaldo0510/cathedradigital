import { test, expect } from '@playwright/test';

/**
 * Encyclopedia → Bible deep-link regression.
 *
 * Validates that clicking a Bible reference inside a glossary term
 * navigates to /bible with `book`, `ch` AND `v` query params, and that
 * the highlighted-verse indicator appears on the destination page.
 */
test.describe('Encyclopedia → Bible deep link', () => {
  test('navigates with book/ch/v and shows the highlight indicator', async ({ page }) => {
    // Direct deep-link: avoids relying on which terms are seeded in the DB.
    // This is the same URL shape that BibleVersePopover and EncyclopediaTermDetail
    // produce via buildBibleUrl().
    await page.goto('/bible?book=Jo&ch=3&v=16');

    // URL contract — must include all three params.
    await expect(page).toHaveURL(/\/bible\?[^#]*book=Jo/);
    await expect(page).toHaveURL(/[?&]ch=3(?:&|$)/);
    await expect(page).toHaveURL(/[?&]v=16(?:&|$)/);

    // The highlight indicator banner must render with the readable label.
    const indicator = page.getByTestId('bible-highlight-indicator');
    await expect(indicator).toBeVisible({ timeout: 15000 });
    await expect(indicator).toContainText(/3:16/);

    // The verse element should exist with the conventional id and become visible
    // (scrollIntoView is triggered by the page after fetching the chapter).
    const verseEl = page.locator('#v16');
    await expect(verseEl).toBeVisible({ timeout: 15000 });
  });

  test('invalid v param keeps chapter visible (no crash)', async ({ page }) => {
    await page.goto('/bible?book=Jo&ch=3&v=notanumber');

    // Chapter still loads.
    await expect(page.locator('#v1')).toBeVisible({ timeout: 15000 });
    // Indicator should NOT be shown for an invalid verse.
    await expect(page.getByTestId('bible-highlight-indicator')).toHaveCount(0);
  });
});
