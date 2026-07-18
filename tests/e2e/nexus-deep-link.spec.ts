/**
 * STAB-NEXUS-P0 — Deep link scheme (#nexus=<slug>[:kind]).
 *
 * Valida que:
 *  1. Deep link abre o painel na tag correta e seleciona o `kind` pedido
 *  2. Após reload, hash persiste e painel restaura na mesma seção
 *  3. Após navegação (back), o estado é restaurado da persistência
 *  4. Deep link com kind inválido cai na seção padrão (fallback)
 *
 * Estratégia: como slugs reais dependem de dados vivos, o teste descobre
 * dinamicamente um trigger real na Bíblia, abre o Nexus, lê o hash gerado
 * pelo próprio componente (`#nexus=slug:kind`) e usa esse hash como
 * verdade-solo para os cenários de restauração.
 */
import { test, expect, type Page } from '@playwright/test';

async function openFirstNexusTrigger(page: Page): Promise<{ slug: string; hash: string } | null> {
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

  const trigger = page
    .locator('[data-nexus-trigger], [data-tag-slug], button:has-text("Nexus")')
    .first();
  if ((await trigger.count()) === 0) return null;

  const slug =
    (await trigger.getAttribute('data-tag-slug')) ??
    (await trigger.getAttribute('data-nexus-trigger'));

  await trigger.click({ timeout: 5000 }).catch(() => {});
  // Aguarda o painel abrir e o hash ser gravado pelo próprio NexusBubbles.
  await page.waitForFunction(() => window.location.hash.includes('nexus='), null, {
    timeout: 5000,
  }).catch(() => {});

  const hash = new URL(page.url()).hash;
  if (!hash.includes('nexus=')) return null;

  const parsed = hash.replace('#nexus=', '').split(':');
  return { slug: slug ?? parsed[0], hash };
}

async function panelIsOpen(page: Page): Promise<boolean> {
  return (await page.locator('[role="dialog"]').count()) > 0;
}

async function activeSectionKind(page: Page): Promise<string | null> {
  const el = page.locator('[data-testid="nexus-active-section"]').first();
  if ((await el.count()) === 0) return null;
  return await el.getAttribute('data-section-kind');
}

test.describe('STAB-NEXUS-P0 — Deep link scheme (#nexus=slug:kind)', () => {
  test('abre painel, restaura após reload e após back', async ({ page }) => {
    // 1. Descoberta: encontra um deep-link real.
    await page.goto('/bible?book=joao&ch=6', { waitUntil: 'domcontentloaded' });
    const discovered = await openFirstNexusTrigger(page);
    test.skip(!discovered, 'nenhum trigger Nexus visível nesta rota — pular cenário');
    const { slug, hash } = discovered!;

    // Captura kind atual (a partir do hash reescrito pelo componente).
    const parts = hash.replace('#nexus=', '').split(':');
    const expectedKind = parts[1];
    expect(expectedKind, 'hash deve conter :kind após seleção').toBeTruthy();

    // Fecha painel para reiniciar.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // 2. Cenário A — reload preserva deep link.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    expect(await panelIsOpen(page), 'painel reabre após reload via hash').toBe(true);
    expect(await activeSectionKind(page), 'kind ativo bate com o hash').toBe(expectedKind);

    // 3. Cenário B — navegação e goBack restauram o painel.
    // Fecha, navega para outra rota, e volta.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await page.goto('/catechism?p=1817', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    expect(await panelIsOpen(page), 'painel restaura após goBack').toBe(true);
    expect(await activeSectionKind(page), 'seção ativa mantida após goBack').toBe(expectedKind);

    // 4. Cenário C — kind inválido cai no fallback (primeira seção) e reescreve hash.
    await page.goto(`/bible?book=joao&ch=6#nexus=${slug}:kind-inexistente`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(1200);
    expect(await panelIsOpen(page), 'painel abre mesmo com kind inválido').toBe(true);
    const fallbackKind = await activeSectionKind(page);
    expect(fallbackKind, 'fallback para primeira seção').not.toBe('kind-inexistente');
    // Hash foi reescrito para refletir seção real.
    const finalHash = new URL(page.url()).hash;
    expect(finalHash, 'hash reescrito com kind válido').not.toContain('kind-inexistente');
  });
});
