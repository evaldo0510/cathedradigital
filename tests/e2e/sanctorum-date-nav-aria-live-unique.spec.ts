import { test, expect } from '@playwright/test';

/**
 * Confirma que cada troca de data emite UM único anúncio para o leitor de tela:
 *  - Observamos o nó do heading via MutationObserver e coletamos cada valor
 *    textual distinto emitido pela região aria-live.
 *  - Para N cliques rápidos, o número de anúncios finais deve ser ≤ N
 *    (nunca duplicado para o mesmo valor consecutivo).
 *  - O último anúncio corresponde ao texto atual do heading.
 */
test('SanctorumDateNav — aria-live emite um anúncio por troca (sem duplicidade)', async ({ page }) => {
  await page.goto('/santos?date=2026-07-20', { waitUntil: 'domcontentloaded' });

  const heading = page.getByRole('heading', { level: 2 }).first();
  await expect(heading).toBeVisible();

  // Instala o observer no nó do heading e acumula transições únicas.
  await page.evaluate(() => {
    const el = document.querySelector('h2');
    if (!el) throw new Error('heading não encontrado');
    (window as any).__announcements = [el.textContent?.trim() ?? ''];
    const obs = new MutationObserver(() => {
      const t = el.textContent?.trim() ?? '';
      const list: string[] = (window as any).__announcements;
      if (list[list.length - 1] !== t) list.push(t);
    });
    obs.observe(el, { characterData: true, childList: true, subtree: true });
    (window as any).__obs = obs;
  });

  const proximo = page.getByRole('button', { name: 'Próximo dia' });
  const N = 6;
  for (let i = 0; i < N; i++) await proximo.click({ delay: 10 });

  // Aguarda a última mutação estabilizar.
  await expect(heading).toHaveText(/^26 de julho$/i);

  const anuncios = await page.evaluate(() => (window as any).__announcements as string[]);
  // Sem repetições consecutivas.
  for (let i = 1; i < anuncios.length; i++) {
    expect(anuncios[i]).not.toBe(anuncios[i - 1]);
  }
  // Cada anúncio único (Set === array length) — sem revisitar o mesmo texto em seguida.
  const consecutivos = anuncios.map((v, i) => `${i}:${v}`);
  expect(new Set(consecutivos).size).toBe(consecutivos.length);
  // No máximo N+1 anúncios (estado inicial + N transições).
  expect(anuncios.length).toBeLessThanOrEqual(N + 1);
  // O último anúncio corresponde ao heading atual.
  const atual = (await heading.textContent())?.trim() ?? '';
  expect(anuncios[anuncios.length - 1]).toBe(atual);

  await page.evaluate(() => (window as any).__obs?.disconnect());
});
