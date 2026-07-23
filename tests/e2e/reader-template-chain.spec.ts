/**
 * E2E — Reader Template Master: valida em DOM real que cada rota de
 * leitura certificada renderiza a cadeia:
 *   ReaderShell → EditorialHero → ReaderContent → ReferencePopover?
 *                → NexusPanel → ReaderContinuation
 *
 * Módulos com `status !== 'certified'` são marcados como `.fixme` para
 * ficarem visíveis no relatório do Playwright mas não bloquearem o CI
 * antes de completarem a migração da Fase C/D.
 */
import { test, expect } from '@playwright/test';
import { READER_MODULES } from '../../src/config/reader-modules';

for (const mod of READER_MODULES) {
  const route = mod.sampleRoutes[0];
  const runner = mod.status === 'certified' ? test : test.fixme;

  runner(`[${mod.id}] ${mod.label} renderiza a cadeia canônica em ${route}`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(route, { waitUntil: 'domcontentloaded' });

    // 1. Casca canônica presente
    const shell = page.locator('[data-reader-shell]').first();
    await expect(shell, 'ReaderShell deve existir na rota').toBeVisible({ timeout: 15_000 });

    // 2. Hero
    await expect(shell.locator('[data-reader-slot="hero"]').first()).toBeVisible();
    await expect(shell.locator('[data-editorial-hero-universal]').first()).toBeVisible();

    // 3. Content
    await expect(shell.locator('[data-reader-slot="content"]').first()).toBeVisible();

    // 4. Nexus (a menos que o módulo declare skip)
    const nexusOptional = mod.optionalSlots?.includes('nexus');
    if (!nexusOptional) {
      const nexus = shell.locator('[data-reader-slot="nexus"] [data-nexus-panel]');
      await expect(nexus, 'NexusPanel deve estar no slot nexus').toBeVisible({ timeout: 10_000 });
    }

    // 5. Continuation (a menos que o módulo declare skip)
    const contOptional = mod.optionalSlots?.includes('continuation');
    if (!contOptional) {
      const cont = shell.locator('[data-reader-slot="continuation"] [data-reader-continuation]');
      await expect(cont, 'ReaderContinuation deve estar no slot continuation').toBeVisible({ timeout: 10_000 });
    }

    // 6. Referências inline: se houver popover, deve ser o ReferencePopover canônico
    const anyPopover = page.locator('[data-radix-popper-content-wrapper]');
    if ((await anyPopover.count()) > 0) {
      const anyRef = page.locator('[data-reference-popover]');
      const anyLegacy = page.locator('[data-testid="nexus-bubble"], [data-testid="mystery-nexus-panel"]');
      expect(await anyLegacy.count(), 'Não deve existir popover legado (NexusBubbles/MysteryNexusPanel)').toBe(0);
      if ((await anyRef.count()) === 0) {
        // Tolerado: popover pode ser gerado por menu shadcn não-editorial (settings). Apenas garantimos ausência dos legados.
      }
    }

    // 7. Console limpo (apenas na rota certificada — sem erros JS graves)
    expect(consoleErrors.filter((e) => !/(favicon|manifest|analytics)/i.test(e))).toEqual([]);
  });
}
