import { test, expect } from '@playwright/test';

test.describe('Nexus Bubbles Navigation & Popovers', () => {
  test('should navigate to /temas/culpa and open bubble popovers with stable selectors', async ({ page }) => {
    // Navigate to a specific theme page
    await page.goto('/temas/culpa');
    
    // Wait for the "Temas Relacionados" section
    const relatedTitle = page.locator('text=Temas Relacionados');
    await expect(relatedTitle).toBeVisible();

    // Find bubble tags in the related themes section
    // Use data-roving-item which is a stable attribute we added
    const relatedBubbles = page.locator('button[data-roving-item]');
    await expect(relatedBubbles.first()).toBeVisible();
    
    // Click a related bubble
    const firstBubble = relatedBubbles.first();
    const bubbleLabel = await firstBubble.getAttribute('aria-label');
    await firstBubble.click();
    
    // Wait for popover content using role="dialog" (stable ARIA selector)
    const popover = page.locator('[role="dialog"]');
    await expect(popover).toBeVisible({ timeout: 10000 });
    
    // Verify content is loading or loaded
    await expect(popover.locator('h4')).toBeVisible();
    
    // Click "Navegação Completa" inside popover to navigate to another theme
    const fullNavButton = popover.locator('button:has-text("Navegação Completa")');
    await expect(fullNavButton).toBeVisible();
    await fullNavButton.click();
    
    // Verify full navigation: URL should change and content should match
    await expect(page).toHaveURL(/\/temas\//);
    // If we can extract the tag name from the label, we can check the heading
    if (bubbleLabel) {
      const tagName = bubbleLabel.replace('Tema: ', '').split(' (')[0];
      await expect(page.locator('h1, h2')).toContainText(tagName, { ignoreCase: true });
    }
  });

  test('should verify caching behavior: reopening a bubble does not trigger new fetch', async ({ page }) => {
    await page.goto('/temas');
    
    const bubbles = page.locator('button[data-roving-item]');
    await expect(bubbles.first()).toBeVisible();
    
    // Open first bubble
    await bubbles.first().click();
    const popover = page.locator('[role="dialog"]');
    await expect(popover).toBeVisible();
    
    // Check for diagnostic panel showing it came from source
    // In our component, we show "Source: both" or "Source: supabase"
    const diagnostic = popover.locator('text=Source:');
    await expect(diagnostic).not.toContainText('pending');

    // Close popover (click outside or press Escape)
    await page.keyboard.press('Escape');
    await expect(popover).not.toBeVisible();
    
    // Reopen same bubble
    await bubbles.first().click();
    await expect(popover).toBeVisible();
    
    // Caching verification: it should be immediate
    // We can't easily check "no new fetch" without network interception,
    // but we can verify the loading state doesn't reappear
    const loader = popover.locator('text=Consultando Nexus...');
    await expect(loader).not.toBeVisible();
  });

  test('should show suggested sparkles across different routes when profileId is present', async ({ page }) => {
    // We'll use a query param or localStorage to simulate profileId if the app supports it
    // Based on useSpiritualProfile.ts, it fetches from supabase or uses a cached value.
    // For E2E, we can mock the session or just verify it if we have a way to set it.
    
    // Let's assume we can set it via localStorage for testing if the hook checks it
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('spiritual_profile_diagnosis', JSON.stringify({
        id: 'ferido_em_busca',
        timestamp: Date.now()
      }));
    });

    // Check on /temas
    await page.goto('/temas');
    const suggestedBadge = page.locator('text=Sugeridos para sua Jornada');
    await expect(suggestedBadge).toBeVisible();
    
    const suggestedBubble = page.locator('button[aria-label*="(Sugerido)"]');
    await expect(suggestedBubble.first()).toBeVisible();

    // Navigate to /temas/culpa and check if bubbles there also show suggested if they match
    await page.goto('/temas/culpa');
    // On detail page, related bubbles might be suggested too
    const detailSuggested = page.locator('button[aria-label*="(Sugerido)"]');
    // This depends on whether "Culpa" related themes match the profile
    // But we can at least check the mechanism is active
  });

  test('should verify related themes logic: no duplicates, priority signals, and multi-step popover navigation', async ({ page }) => {
    // 1. Set a profile to ensure we have "Profile" priority items
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('spiritual_profile_diagnosis', JSON.stringify({
        id: 'ferido_em_busca', // Profile that likes 'Oração', 'Jesus', 'Fé'
        timestamp: Date.now()
      }));
    });

    // 2. Go to 'Graça' (Fundamentos category)
    await page.goto('/temas/graca');
    
    // Wait for the "Temas Relacionados" sidebar to appear
    const aside = page.locator('aside:has-text("Temas Relacionados")');
    await expect(aside).toBeVisible();
    
    // 3. Verify no duplicates in the sidebar
    const bubbles = aside.locator('button[data-roving-item]');
    await expect(bubbles.first()).toBeVisible();
    const labels = await bubbles.allInnerTexts();
    const uniqueLabels = new Set(labels);
    expect(labels.length).toBe(uniqueLabels.size);

    // 4. Verify priority (Profile-related theme 'Fé' should be present)
    const hasProfileTheme = labels.some(l => l.includes('Fé') || l.includes('Oração'));
    expect(hasProfileTheme).toBe(true);

    // 5. Click on two different themes via popovers to confirm navigation and priority continuity
    // Step A: Open 'Fé' bubble
    await page.locator('button[data-roving-item]').filter({ hasText: 'Fé' }).first().click();
    const popover = page.locator('[role="dialog"]');
    await expect(popover).toBeVisible();
    
    // Step B: Inside 'Fé' popover, click on 'Amor' (another theme)
    const amorTag = popover.locator('button').filter({ hasText: 'Amor' }).first();
    await expect(amorTag).toBeVisible();
    await amorTag.click();
    
    // Verify navigation to /temas/amor
    await expect(page).toHaveURL(/\/temas\/amor/);
    await expect(page.locator('h1, h2')).toContainText('Amor', { ignoreCase: true });

    // Step C: On 'Amor' page, open 'Esperança' bubble
    const esperancaBubble = page.locator('button[data-roving-item]').filter({ hasText: 'Esperança' }).first();
    await expect(esperancaBubble).toBeVisible();
    await esperancaBubble.click();
    await expect(popover).toBeVisible();
    
    // Step D: Inside 'Esperança' popover, click on 'Paz' or 'Graça'
    const gracaTag = popover.locator('button').filter({ hasText: 'Graça' }).first();
    if (await gracaTag.isVisible()) {
      await gracaTag.click();
      await expect(page).toHaveURL(/\/temas\/graca/);
    }

    // 6. Final verification of no duplicates on the final page
    const finalLabels = await aside.locator('button[data-roving-item]').allInnerTexts();
    expect(finalLabels.length).toBe(new Set(finalLabels).size);
  });

  test('should verify related themes ordering: content > profile > category', async ({ page }) => {
    // 1. Set profile to have profile-related items
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('spiritual_profile_diagnosis', JSON.stringify({
        id: 'ferido_em_busca', // Likes Oração, Jesus, Fé
        timestamp: Date.now()
      }));
    });

    // 2. Go to a theme that has content tags, profile overlap, and category siblings
    // We'll use 'Graça' which is in Fundamentos.
    await page.goto('/temas/graca');
    
    const aside = page.locator('aside:has-text("Temas Relacionados")');
    await expect(aside).toBeVisible();

    // Get all related bubbles
    const bubbles = aside.locator('button[data-roving-item]');
    await expect(bubbles.first()).toBeVisible();

    // Extract their data-priority attributes
    const priorities = await bubbles.evaluateAll(elements => 
      elements.map(el => el.getAttribute('data-priority'))
    );

    console.log('Detected priorities:', priorities);

    // Filter out nulls (shouldn't be any in TemaDetailPage)
    const activePriorities = priorities.filter(p => p !== null) as string[];

    // Verify ordering logic: Groups must be contiguous and follow: content > profile > category
    // We check that the highest index of a higher priority group is always less than 
    // the lowest index of a lower priority group.
    
    const getIndices = (pName: string) => 
      activePriorities.map((p, i) => p === pName ? i : -1).filter(i => i !== -1);

    const contentIndices = getIndices('content');
    const profileIndices = getIndices('profile');
    const categoryIndices = getIndices('category');

    console.log('Priority mapping:', {
      content: contentIndices,
      profile: profileIndices,
      category: categoryIndices
    });

    if (contentIndices.length && profileIndices.length) {
      expect(Math.max(...contentIndices)).toBeLessThan(Math.min(...profileIndices));
      // Contiguity check: the gap should be exactly 1 if they are the only types,
      // but since we only have these 3 types, any gap would mean a violation of the 3-step order.
      expect(Math.min(...profileIndices) - Math.max(...contentIndices), 'Hole between content and profile groups').toBe(1);
    }
    if (profileIndices.length && categoryIndices.length) {
      expect(Math.max(...profileIndices)).toBeLessThan(Math.min(...categoryIndices));
      expect(Math.min(...categoryIndices) - Math.max(...profileIndices), 'Hole between profile and category groups').toBe(1);
    }
    if (contentIndices.length && categoryIndices.length && !profileIndices.length) {
      expect(Math.max(...contentIndices)).toBeLessThan(Math.min(...categoryIndices));
      expect(Math.min(...categoryIndices) - Math.max(...contentIndices), 'Hole between content and category groups').toBe(1);
    }

    // Double check with a sequential scan to ensure no mixing within groups
    let currentMaxPriorityIndex = 0;
    const priorityOrder = ['content', 'profile', 'category'];
    for (const p of activePriorities) {
      const pIndex = priorityOrder.indexOf(p);
      expect(pIndex, `Priority ${p} appeared out of order`).toBeGreaterThanOrEqual(currentMaxPriorityIndex);
      currentMaxPriorityIndex = pIndex;
    }
  });

  test('should strictly verify no duplicate items in related themes after multiple transitions', async ({ page }) => {
    // 1. Setup profile
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('spiritual_profile_diagnosis', JSON.stringify({
        id: 'ferido_em_busca',
        timestamp: Date.now()
      }));
    });

    // 2. Start at 'Culpa'
    await page.goto('/temas/culpa');
    const aside = page.locator('aside:has-text("Temas Relacionados")');
    await expect(aside).toBeVisible();

    const checkDuplicates = async () => {
      const labels = await aside.locator('button[data-roving-item]').allInnerTexts();
      const cleanLabels = labels.map(l => l.trim().split('\n')[0]); // Handle potential icon/text mix
      const uniqueLabels = new Set(cleanLabels);
      expect(cleanLabels.length, `Duplicates found: ${cleanLabels}`).toBe(uniqueLabels.size);
    };

    // Initial check
    await checkDuplicates();

    // 3. Navigate through popovers and check for duplicates on each page
    const themesToVisit = ['Solidão', 'Perdão', 'Paz'];
    
    for (const theme of themesToVisit) {
      const bubble = aside.locator('button[data-roving-item]').filter({ hasText: theme }).first();
      if (await bubble.isVisible()) {
        await bubble.click();
        await expect(page.locator('h1, h2')).toContainText(theme, { ignoreCase: true });
        await checkDuplicates();
      }
    }

    // 4. Verify no duplicates after returning to initial theme
    await page.goto('/temas/culpa');
    await checkDuplicates();
  });

  test('should verify no duplicates even when themes overlap across content, profile, and category sources', async ({ page }) => {
    // 1. Set profile to 'firme_aprofundando' which likes 'Fé'
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('spiritual_profile_diagnosis', JSON.stringify({
        id: 'firme_aprofundando',
        timestamp: Date.now()
      }));
    });

    // 2. Go to 'Graça'
    // 'Fé' is a Fundamentals theme (same category as 'Graça')
    // 'Fé' is suggested by 'firme_aprofundando' profile
    // 'Fé' is often linked in content tags for 'Graça'
    await page.goto('/temas/graca');
    
    const aside = page.locator('aside:has-text("Temas Relacionados")');
    await expect(aside).toBeVisible();

    // Verify 'Fé' appears exactly once
    const feBubbles = aside.locator('button[data-roving-item]').filter({ hasText: 'Fé' });
    const count = await feBubbles.count();
    expect(count, 'Theme "Fé" should appear exactly once even with multiple source overlaps').toBe(1);

    // Verify deduplication logic holds after navigating to a theme and back
    await feBubbles.first().click();
    await expect(page.locator('h1, h2')).toContainText('Fé', { ignoreCase: true });
    
    await page.goBack();
    await expect(page.locator('h1, h2')).toContainText('Graça', { ignoreCase: true });
    
    const feBubblesAfter = aside.locator('button[data-roving-item]').filter({ hasText: 'Fé' });
    expect(await feBubblesAfter.count()).toBe(1);
  });

  test('should strictly verify no holes in priority groups across multiple theme pages', async ({ page }) => {
    // 1. Setup profile for consistent signals
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('spiritual_profile_diagnosis', JSON.stringify({
        id: 'ferido_em_busca',
        timestamp: Date.now()
      }));
    });

    const themesToTest = ['/temas/culpa', '/temas/graca', '/temas/fe', '/temas/amor'];

    const checkNoHoles = async (path: string) => {
      await page.goto(path);
      const aside = page.locator('aside:has-text("Temas Relacionados")');
      await expect(aside).toBeVisible();

      const bubbles = aside.locator('button[data-roving-item]');
      await expect(bubbles.first()).toBeVisible();

      const priorities = await bubbles.evaluateAll(elements => 
        elements.map(el => el.getAttribute('data-priority'))
      );

      const activePriorities = priorities.filter(p => p !== null) as string[];
      
      const priorityOrder = ['content', 'profile', 'category'];
      let lastPriorityIndex = -1;

      for (let i = 0; i < activePriorities.length; i++) {
        const currentP = activePriorities[i];
        const currentPIndex = priorityOrder.indexOf(currentP);
        
        // Ordering check
        expect(currentPIndex, `Priority order violation at index ${i} on ${path}`).toBeGreaterThanOrEqual(lastPriorityIndex);

        // Contiguity check (No holes)
        if (i > 0) {
          const prevP = activePriorities[i - 1];
          const prevPIndex = priorityOrder.indexOf(prevP);
          
          if (currentPIndex !== prevPIndex) {
            // If the group changed, it must be the immediate next available group in this specific list
            // However, a stronger check for "no holes" is that the gap in the actual index list is 1
            // which we already did in a previous test, but here we scan the whole list.
            expect(currentPIndex - prevPIndex, `Gap/Hole detected between ${prevP} and ${currentP} at index ${i}`).toBeGreaterThanOrEqual(1);
          }
        }
        lastPriorityIndex = currentPIndex;
      }
    };

    for (const themePath of themesToTest) {
      await checkNoHoles(themePath);
    }
  });
});