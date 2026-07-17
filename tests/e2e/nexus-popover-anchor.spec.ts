import { test, expect, type Page, type Locator } from '@playwright/test';

/**
 * Regressão: clicar em uma referência bíblica (BibleVersePopover) ou em um
 * termo do dicionário (BibleDictionaryPopover) sempre deve abrir o Nexus
 * ancorado no elemento clicado — não pode abrir centralizado, em modal
 * fullscreen, nem fora da viewport.
 *
 * Tolerância de ancoragem: o content precisa estar a até MAX_ANCHOR_DIST_PX
 * do trigger em ambos os eixos. Isso pega regressão comum: perder o
 * PopoverTrigger asChild, quebrar forwardRef, ou trocar por modal fixo.
 */

const CANDIDATE_CHAPTERS = [
  '/bible?book=Gn&ch=1',
  '/bible?book=Gn&ch=3',
  '/bible?book=Is&ch=53',
  '/bible?book=Sl&ch=23',
  '/bible?book=Mt&ch=5',
];

const MAX_ANCHOR_DIST_PX = 400;

async function findChapterWithTrigger(page: Page, testId: string): Promise<Locator | null> {
  for (const path of CANDIDATE_CHAPTERS) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    // Espera a leitura do capítulo carregar
    await page.waitForLoadState('networkidle').catch(() => { /* noop */ });
    const trigger = page.locator(`[data-testid="${testId}"]`).first();
    if (await trigger.count() > 0) {
      await trigger.scrollIntoViewIfNeeded().catch(() => { /* noop */ });
      if (await trigger.isVisible()) return trigger;
    }
  }
  return null;
}

async function assertAnchoredToTrigger(page: Page, trigger: Locator) {
  const triggerBox = await trigger.boundingBox();
  expect(triggerBox, 'trigger deve ter bounding box').not.toBeNull();

  // Radix renderiza o content num wrapper com este atributo
  const content = page.locator('[data-radix-popper-content-wrapper]').first();
  await expect(content).toBeVisible({ timeout: 5000 });

  const contentBox = await content.boundingBox();
  expect(contentBox, 'popover content deve ter bounding box').not.toBeNull();
  if (!triggerBox || !contentBox) return;

  const triggerCenterX = triggerBox.x + triggerBox.width / 2;
  const triggerCenterY = triggerBox.y + triggerBox.height / 2;
  const contentCenterX = contentBox.x + contentBox.width / 2;
  const contentCenterY = contentBox.y + contentBox.height / 2;

  const dx = Math.abs(contentCenterX - triggerCenterX);
  const dy = Math.abs(contentCenterY - triggerCenterY);

  expect(
    dx,
    `popover deve abrir ancorado (Δx=${dx.toFixed(0)}px vs limite ${MAX_ANCHOR_DIST_PX}px). Trigger x=${triggerCenterX.toFixed(0)} content x=${contentCenterX.toFixed(0)}`
  ).toBeLessThanOrEqual(MAX_ANCHOR_DIST_PX);

  expect(
    dy,
    `popover deve abrir ancorado (Δy=${dy.toFixed(0)}px vs limite ${MAX_ANCHOR_DIST_PX}px). Trigger y=${triggerCenterY.toFixed(0)} content y=${contentCenterY.toFixed(0)}`
  ).toBeLessThanOrEqual(MAX_ANCHOR_DIST_PX);

  // Regressão explícita: não pode ser um modal fullscreen (fixed inset-0)
  const viewport = page.viewportSize();
  if (viewport) {
    expect(
      contentBox.width,
      'popover não pode ocupar a largura toda da viewport (viraria modal)'
    ).toBeLessThan(viewport.width * 0.95);
  }
}

const VIEWPORTS = [
  { name: 'mobile-360', width: 360, height: 800 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1280', width: 1280, height: 800 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
] as const;

for (const vp of VIEWPORTS) {
  test.describe(`Nexus popovers — ancoragem @ ${vp.name} (${vp.width}x${vp.height})`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test(`BibleVersePopover abre ancorado @ ${vp.name}`, async ({ page }) => {
      const trigger = await findChapterWithTrigger(page, 'bible-verse-popover-trigger');
      test.skip(
        !trigger,
        `Nenhum capítulo candidato tinha BibleVersePopover renderizado @ ${vp.name} — adicione um em CANDIDATE_CHAPTERS.`
      );
      if (!trigger) return;
      await trigger.click();
      await assertAnchoredToTrigger(page, trigger);
    });

    test(`BibleDictionaryPopover abre ancorado @ ${vp.name}`, async ({ page }) => {
      const trigger = await findChapterWithTrigger(page, 'bible-dictionary-popover-trigger');
      test.skip(
        !trigger,
        `Nenhum capítulo candidato tinha BibleDictionaryPopover renderizado @ ${vp.name} — adicione um em CANDIDATE_CHAPTERS.`
      );
      if (!trigger) return;
      await trigger.click();
      await assertAnchoredToTrigger(page, trigger);
    });
  });
}

