/**
 * E2E — Via Sacra Premium.
 *
 * Valida:
 *   • Persistência de progresso e restauro no retorno (bfcache/history).
 *   • Acessibilidade e labels do PrayerModeSelector, PrayerAudioPlayer e
 *     PrayerFavoriteButton.
 *   • Modos Guiado, Contemplativo e Automático (avanço por timer,
 *     ocultação de chrome no Contemplativo, estado do áudio e favoritos).
 */
import { test, expect } from '@playwright/test';

test.describe('Via Sacra Premium', () => {
  test.beforeEach(async ({ page }) => {
    // Isola estado local entre execuções.
    await page.addInitScript(() => {
      try {
        localStorage.removeItem('cathedra:devotional-progress:viacrucis');
        localStorage.removeItem('cathedra:devotional-progress:viacrucis:completed');
        localStorage.removeItem('cathedra:devotional-progress:viacrucis:mode');
        localStorage.removeItem('cathedra:devotional-progress:viacrucis:interval');
      } catch { /* noop */ }
    });
    await page.goto('/viacrucis');
    await expect(page.getByTestId('via-sacra-landing')).toBeVisible();
  });

  test('acessibilidade e labels dos controles premium', async ({ page }) => {
    // PrayerModeSelector
    const tablist = page.getByRole('tablist', { name: 'Modo de oração' }).first();
    await expect(tablist).toBeVisible();
    for (const [label, hint] of [
      ['Guiado', 'Passo a passo, avanço manual'],
      ['Contemplativo', 'Tela limpa, sem UI'],
      ['Automático', 'Avança sozinho'],
    ] as const) {
      const tab = tablist.getByRole('tab', { name: `${label} — ${hint}` });
      await expect(tab).toBeVisible();
    }

    // PrayerAudioPlayer — sem audio_url ⇒ botão desabilitado com aria-label claro.
    const audio = page.getByRole('button', { name: 'Áudio ainda não disponível' }).first();
    await expect(audio).toBeVisible();
    await expect(audio).toBeDisabled();

    // PrayerFavoriteButton — usuário anônimo ⇒ inerte com aria-label indicando login.
    const fav = page.getByRole('button', { name: /Entrar para salvar|Salvar nos favoritos/ }).first();
    await expect(fav).toBeVisible();
  });

  test('modo Contemplativo esconde chrome; modo Automático avança sozinho', async ({ page }) => {
    // Entra na jornada.
    await page.getByTestId('via-sacra-start').click();
    const journey = page.getByTestId('via-sacra-journey');
    await expect(journey).toBeVisible();
    await expect(journey).toHaveAttribute('data-mode', 'guided');
    await expect(page.getByTestId('via-sacra-controls')).toBeVisible();

    // Contemplativo — controles somem.
    await page.getByRole('tab', { name: /Contemplativo/ }).click();
    await expect(journey).toHaveAttribute('data-mode', 'contemplative');
    await expect(page.getByTestId('via-sacra-controls')).toHaveCount(0);
    await expect(page.getByTestId('via-sacra-nav')).toBeVisible();

    // Volta para Guiado para preparar auto.
    await page.getByRole('tab', { name: /Guiado/ }).click();
    await expect(page.getByTestId('via-sacra-controls')).toBeVisible();

    // Modo automático — seleciona 15s e espera avanço.
    await page.getByRole('tab', { name: /Automático/ }).click();
    await expect(journey).toHaveAttribute('data-mode', 'auto');
    await page.getByLabel('Ritmo').selectOption('15000');

    // Estação inicial = 1. Aguarda passar para 2.
    await expect(page.getByRole('heading', { level: 2 })).toContainText('Jesus é condenado à morte');
    await page.waitForTimeout(16500);
    await expect(page.getByRole('heading', { level: 2 })).not.toContainText('Jesus é condenado à morte');
  });

  test('persistência de progresso e restauro ao voltar', async ({ page }) => {
    await page.getByTestId('via-sacra-start').click();
    // Avança 3 estações — marca 1, 2 e 3 como concluídas.
    await page.getByTestId('via-sacra-next').click();
    await page.getByTestId('via-sacra-next').click();
    await page.getByTestId('via-sacra-next').click();

    // Sai para o Átrio e volta.
    await page.goto('/');
    await page.goto('/viacrucis');

    // O leitor restaura direto na jornada na 4ª estação.
    const journey = page.getByTestId('via-sacra-journey');
    await expect(journey).toBeVisible();
    await expect(page.getByRole('heading', { level: 2 })).toContainText(
      'Jesus encontra Sua Mãe',
    );

    // Volta para o landing — resumo de progresso deve refletir estações concluídas.
    await page.getByRole('button', { name: /Voltar/ }).click();
    await expect(page.getByTestId('via-sacra-landing')).toBeVisible();
    await expect(page.getByTestId('via-sacra-progress-summary')).toContainText(
      /\d+ de 14 estações/,
    );
  });
});
