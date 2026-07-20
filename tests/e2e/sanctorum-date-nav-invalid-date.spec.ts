import { test, expect } from '@playwright/test';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * URL com ?date= inválido ou fora do intervalo:
 *  - App escolhe a data padrão (hoje).
 *  - Heading atualiza em pt-BR ("dd de MMMM").
 *  - aria-live NÃO emite anúncios (foi apenas hidratação, não interação).
 *  - URL é corrigida via clamp para YYYY-MM-DD atual.
 */
const CASOS = [
  { label: 'formato inválido', value: 'not-a-date' },
  { label: 'ano fora do intervalo (0001)', value: '0001-01-01' },
  { label: 'ano futuro extremo (9999)', value: '9999-12-31' },
  { label: 'mês inexistente', value: '2026-13-40' },
];

for (const caso of CASOS) {
  test(`SanctorumDateNav — ?date=${caso.value} (${caso.label}) usa hoje sem anunciar`, async ({ page }) => {
    // Observa aria-live desde o boot para captar qualquer anúncio espúrio.
    await page.addInitScript(() => {
      (window as unknown as { __a: string[] }).__a = [];
      const install = () => {
        const region = document.querySelector('[aria-live="polite"][aria-atomic="true"]');
        if (!region) return false;
        new MutationObserver(() => {
          const t = (region.textContent ?? '').trim();
          if (t) (window as unknown as { __a: string[] }).__a.push(t);
        }).observe(region, { childList: true, subtree: true, characterData: true });
        return true;
      };
      const iv = setInterval(() => {
        if (install()) clearInterval(iv);
      }, 30);
    });

    await page.goto(`/santos?date=${encodeURIComponent(caso.value)}`, {
      waitUntil: 'domcontentloaded',
    });

    const heading = page.getByRole('heading', { level: 2 }).first();
    await expect(heading).toBeVisible();

    // Heading = hoje (pt-BR, "dd de MMMM").
    const hojeLabel = format(new Date(), "dd 'de' MMMM", { locale: ptBR }).toLowerCase();
    await expect
      .poll(async () => ((await heading.textContent()) ?? '').trim().toLowerCase())
      .toBe(hojeLabel);

    // URL foi corrigida para hoje (YYYY-MM-DD).
    const hojeIso = format(new Date(), 'yyyy-MM-dd');
    await expect(page).toHaveURL(new RegExp(`date=${hojeIso}`));

    // Aviso opcional de clamp presente com role=status.
    const notice = page.getByTestId('sanctorum-clamp-notice');
    if (await notice.count()) {
      await expect(notice.first()).toHaveAttribute('role', 'status');
    }

    // Nenhum anúncio no aria-live da tira (só hidratação, não interação).
    await page.waitForTimeout(500);
    const anns = await page.evaluate(
      () => (window as unknown as { __a: string[] }).__a.slice(),
    );
    expect(anns.length, `aria-live não deveria anunciar; recebeu: ${JSON.stringify(anns)}`).toBe(0);
  });
}
