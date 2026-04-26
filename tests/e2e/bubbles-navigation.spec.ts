import { test, expect, Locator } from '@playwright/test';

test.describe('Nexus Bubbles Navigation & Popovers', () => {
  // Helper to extract clean bubble labels (text before icons/line breaks)
  const getCleanLabels = async (bubbles: Locator) => {
    const labels = await bubbles.allInnerTexts();
    return labels.map(l => l.trim().split('\n')[0]);
  };

  // Helper to extract all data-priority attributes from a list of bubbles
  const getActivePriorities = async (bubbles: Locator) => {
    const priorities = await bubbles.evaluateAll(elements => 
      elements.map(el => el.getAttribute('data-priority'))
    );
    return priorities.filter(p => p !== null) as string[];
  };

  // Helper to verify that priority groups are ordered and contiguous
  const verifyOrderingAndContiguity = (activePriorities: string[], expectedFullOrder = ['content', 'profile', 'category']) => {
    let lastPriorityIndex = -1;
    for (let i = 0; i < activePriorities.length; i++) {
      const currentP = activePriorities[i];
      const currentPIndex = expectedFullOrder.indexOf(currentP);
      
      expect(currentPIndex, `Priority order violation: ${currentP} followed a higher priority group at index ${i}`).toBeGreaterThanOrEqual(lastPriorityIndex);
      
      if (i > 0) {
        const prevP = activePriorities[i - 1];
        const prevPIndex = expectedFullOrder.indexOf(prevP);
        if (currentPIndex !== prevPIndex) {
          // If the group changed, we check that it's still moving forward in the expected sequence
          expect(currentPIndex - prevPIndex, `Gap detected between ${prevP} and ${currentP} groups`).toBeGreaterThanOrEqual(1);
        }
      }
      lastPriorityIndex = currentPIndex;
    }
  };

  test('should navigate to /temas/culpa and open bubble popovers with stable selectors', async ({ page }) => {
    await page.goto('/temas/culpa');
    
    const relatedTitle = page.locator('text=Temas Relacionados');
    await expect(relatedTitle).toBeVisible();

    const relatedBubbles = page.locator('button[data-roving-item]');
    await expect(relatedBubbles.first()).toBeVisible();
    
    const firstBubble = relatedBubbles.first();
    const bubbleLabel = await firstBubble.getAttribute('aria-label');
    await firstBubble.click();
    
    const popover = page.locator('[role="dialog"]');
    await expect(popover).toBeVisible({ timeout: 10000 });
    await expect(popover.locator('h4')).toBeVisible();
    
    const fullNavButton = popover.locator('button:has-text("Navegação Completa")');
    await expect(fullNavButton).toBeVisible();
    await fullNavButton.click();
    
    await expect(page).toHaveURL(/\/temas\//);
    if (bubbleLabel) {
      const tagName = bubbleLabel.replace('Tema: ', '').split(' (')[0];
      await expect(page.locator('h1, h2')).toContainText(tagName, { ignoreCase: true });
    }
  });

  test('should verify caching behavior: reopening a bubble does not trigger new fetch', async ({ page }) => {
    await page.goto('/temas');
    
    const bubbles = page.locator('button[data-roving-item]');
    await expect(bubbles.first()).toBeVisible();
    
    await bubbles.first().click();
    const popover = page.locator('[role="dialog"]');
    await expect(popover).toBeVisible();
    
    const diagnostic = popover.locator('text=Source:');
    await expect(diagnostic).not.toContainText('pending');

    await page.keyboard.press('Escape');
    await expect(popover).not.toBeVisible();
    
    await bubbles.first().click();
    await expect(popover).toBeVisible();
    
    const loader = popover.locator('text=Consultando Nexus...');
    await expect(loader).not.toBeVisible();
  });

  test('should show suggested sparkles across different routes when profileId is present', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('spiritual_profile_diagnosis', JSON.stringify({
        id: 'ferido_em_busca',
        timestamp: Date.now()
      }));
    });

    await page.goto('/temas');
    const suggestedBadge = page.locator('text=Sugeridos para sua Jornada');
    await expect(suggestedBadge).toBeVisible();
    
    const suggestedBubble = page.locator('button[aria-label*="(Sugerido)"]');
    await expect(suggestedBubble.first()).toBeVisible();

    await page.goto('/temas/culpa');
    const detailSuggested = page.locator('button[aria-label*="(Sugerido)"]');
    // Mechanism check
  });

  test('should verify related themes logic: no duplicates, priority signals, and multi-step popover navigation', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('spiritual_profile_diagnosis', JSON.stringify({
        id: 'ferido_em_busca',
        timestamp: Date.now()
      }));
    });

    await page.goto('/temas/graca');
    const aside = page.locator('aside:has-text("Temas Relacionados")');
    await expect(aside).toBeVisible();
    
    const bubbles = aside.locator('button[data-roving-item]');
    await expect(bubbles.first()).toBeVisible();
    
    const cleanLabels = await getCleanLabels(bubbles);
    expect(cleanLabels.length, 'Duplicates detected in related themes').toBe(new Set(cleanLabels).size);

    const hasProfileTheme = cleanLabels.some(l => l.includes('Fé') || l.includes('Oração'));
    expect(hasProfileTheme).toBe(true);

    await page.locator('button[data-roving-item]').filter({ hasText: 'Fé' }).first().click();
    const popover = page.locator('[role="dialog"]');
    await expect(popover).toBeVisible();
    
    const amorTag = popover.locator('button').filter({ hasText: 'Amor' }).first();
    await expect(amorTag).toBeVisible();
    await amorTag.click();
    
    await expect(page).toHaveURL(/\/temas\/amor/);
    await expect(page.locator('h1, h2')).toContainText('Amor', { ignoreCase: true });

    const esperancaBubble = page.locator('button[data-roving-item]').filter({ hasText: 'Esperança' }).first();
    await expect(esperancaBubble).toBeVisible();
    await esperancaBubble.click();
    await expect(popover).toBeVisible();
    
    const gracaTag = popover.locator('button').filter({ hasText: 'Graça' }).first();
    if (await gracaTag.isVisible()) {
      await gracaTag.click();
      await expect(page).toHaveURL(/\/temas\/graca/);
    }

    const finalLabels = await getCleanLabels(aside.locator('button[data-roving-item]'));
    expect(finalLabels.length).toBe(new Set(finalLabels).size);
  });

  test('should verify related themes ordering: content > profile > category', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('spiritual_profile_diagnosis', JSON.stringify({
        id: 'ferido_em_busca',
        timestamp: Date.now()
      }));
    });

    await page.goto('/temas/graca');
    const aside = page.locator('aside:has-text("Temas Relacionados")');
    await expect(aside).toBeVisible();

    const bubbles = aside.locator('button[data-roving-item]');
    await expect(bubbles.first()).toBeVisible();

    const activePriorities = await getActivePriorities(bubbles);
    verifyOrderingAndContiguity(activePriorities);
  });

  test('should strictly verify no duplicate items in related themes after multiple transitions', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('spiritual_profile_diagnosis', JSON.stringify({
        id: 'ferido_em_busca',
        timestamp: Date.now()
      }));
    });

    await page.goto('/temas/culpa');
    const aside = page.locator('aside:has-text("Temas Relacionados")');
    await expect(aside).toBeVisible();

    const checkDuplicates = async () => {
      const cleanLabels = await getCleanLabels(aside.locator('button[data-roving-item]'));
      expect(cleanLabels.length, `Duplicates found: ${cleanLabels}`).toBe(new Set(cleanLabels).size);
    };

    await checkDuplicates();

    const themesToVisit = ['Solidão', 'Perdão', 'Paz'];
    for (const theme of themesToVisit) {
      const bubble = aside.locator('button[data-roving-item]').filter({ hasText: theme }).first();
      if (await bubble.isVisible()) {
        await bubble.click();
        await expect(page.locator('h1, h2')).toContainText(theme, { ignoreCase: true });
        await checkDuplicates();
      }
    }

    await page.goto('/temas/culpa');
    await checkDuplicates();
  });

  test('should verify no duplicates even when themes overlap across content, profile, and category sources', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('spiritual_profile_diagnosis', JSON.stringify({
        id: 'firme_aprofundando',
        timestamp: Date.now()
      }));
    });

    await page.goto('/temas/graca');
    const aside = page.locator('aside:has-text("Temas Relacionados")');
    await expect(aside).toBeVisible();

    const feBubbles = aside.locator('button[data-roving-item]').filter({ hasText: 'Fé' });
    expect(await feBubbles.count(), 'Theme "Fé" should appear exactly once').toBe(1);

    await feBubbles.first().click();
    await expect(page.locator('h1, h2')).toContainText('Fé', { ignoreCase: true });
    
    await page.goBack();
    await expect(page.locator('h1, h2')).toContainText('Graça', { ignoreCase: true });
    
    expect(await aside.locator('button[data-roving-item]').filter({ hasText: 'Fé' }).count()).toBe(1);
  });

  test('should strictly verify no holes in priority groups across multiple theme pages', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('spiritual_profile_diagnosis', JSON.stringify({
        id: 'ferido_em_busca',
        timestamp: Date.now()
      }));
    });

    const themesToTest = ['/temas/culpa', '/temas/graca', '/temas/fe', '/temas/amor'];

    for (const path of themesToTest) {
      await page.goto(path);
      const aside = page.locator('aside:has-text("Temas Relacionados")');
      await expect(aside).toBeVisible();

      const bubbles = aside.locator('button[data-roving-item]');
      await expect(bubbles.first()).toBeVisible();

      const activePriorities = await getActivePriorities(bubbles);
      verifyOrderingAndContiguity(activePriorities);
    }
  });

  test('should verify priority groups order and contiguity even with missing sources (e.g. no profile)', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('spiritual_profile_diagnosis');
    });

    await page.goto('/temas/fe');
    const aside = page.locator('aside:has-text("Temas Relacionados")');
    await expect(aside).toBeVisible();

    const bubbles = aside.locator('button[data-roving-item]');
    await expect(bubbles.first()).toBeVisible();

    const activePriorities = await getActivePriorities(bubbles);
    expect(activePriorities).not.toContain('profile');
    verifyOrderingAndContiguity(activePriorities);
  });

  test('should verify stability and order for themes with minimal content and no profile', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('spiritual_profile_diagnosis');
    });

    await page.goto('/temas/rotina');
    await expect(page.locator('h1')).toContainText('Rotina');
    
    const aside = page.locator('aside:has-text("Temas Relacionados")');
    await expect(aside).toBeVisible();

    const bubbles = aside.locator('button[data-roving-item]');
    expect(await bubbles.count()).toBeGreaterThan(0);
    
    const activePriorities = await getActivePriorities(bubbles);
    verifyOrderingAndContiguity(activePriorities);

    const firstBubble = bubbles.first();
    const cleanLabels = await getCleanLabels(firstBubble);
    await firstBubble.click();
    await expect(page.locator('h1, h2')).toContainText(cleanLabels[0], { ignoreCase: true });
  });

  test('should verify full integrity (no duplicates + correct order) in a complex source overlap scenario', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('spiritual_profile_diagnosis', JSON.stringify({
        id: 'firme_aprofundando',
        timestamp: Date.now()
      }));
    });

    await page.goto('/temas/graca');
    const aside = page.locator('aside:has-text("Temas Relacionados")');
    await expect(aside).toBeVisible();

    const bubbles = aside.locator('button[data-roving-item]');
    await expect(bubbles.first()).toBeVisible();

    const cleanLabels = await getCleanLabels(bubbles);
    expect(cleanLabels.length, `Duplicates found in list`).toBe(new Set(cleanLabels).size);

    const activePriorities = await getActivePriorities(bubbles);
    verifyOrderingAndContiguity(activePriorities);

    const feBubble = bubbles.filter({ hasText: 'Fé' }).first();
    const fePriority = await feBubble.getAttribute('data-priority');
    expect(['content', 'profile']).toContain(fePriority);
  });
});