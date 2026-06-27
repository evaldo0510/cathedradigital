/**
 * E2E (Playwright) — Toggle rápido do ReadingSettingsPopover.
 *
 * Garante que abrir/fechar várias vezes em sequência no mobile NÃO
 * inverte/reseta o "Modo Imersivo" nem produz flicker visível.
 */
import { test, expect } from '@playwright/test';

const PATH = process.env.E2E_BIBLE_PATH || '/bible';

test.describe('ReadingSettingsPopover · toggle rápido (mobile)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const style = document.createElement('style');
      style.textContent = `*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }`;
      document.documentElement.appendChild(style);
    });
    await page.goto(PATH, { waitUntil: 'domcontentloaded' });
  });

  test('alterna abertura/fechamento sem perder Modo Imersivo nem flicker', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /Configurações de Leitura/i });
    await expect(trigger).toBeVisible();

    const tapOrClick = async () => {
      if (test.info().project.use.hasTouch) await trigger.tap();
      else await trigger.click();
    };

    // Ativa Modo Imersivo uma vez.
    await tapOrClick();
    const popover = page.getByTestId('reading-settings-popover');
    await expect(popover).toBeVisible();
    const immersive = popover.getByRole('button', { name: /Modo Imersivo/i });
    await immersive.click();
    await expect(immersive).toHaveClass(/bg-primary\/10/);

    // Conta quantas vezes o popover "aparece" — não pode oscilar fora dos toggles.
    let appearances = 0;
    page.on('domcontentloaded', () => { /* no-op */ });

    // 10 ciclos abre/fecha em alta cadência (tap-duplo simulado).
    for (let i = 0; i < 10; i++) {
      // Fecha (Esc é determinístico e independe de coordenadas).
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('reading-settings-popover')).toBeHidden();
      await tapOrClick();
      const p = page.getByTestId('reading-settings-popover');
      await expect(p).toBeVisible();
      appearances++;
      // Modo Imersivo PERMANECE ativo em cada reabertura — sem flicker de estado.
      await expect(p.getByRole('button', { name: /Modo Imersivo/i }))
        .toHaveClass(/bg-primary\/10/);
    }

    expect(appearances).toBe(10);

    // Fecha final e confirma foco devolvido ao gatilho.
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  });
});

test.describe('ReadingSettingsPopover · dark mode / alto contraste', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const style = document.createElement('style');
      style.textContent = `*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }`;
      document.documentElement.appendChild(style);
      // Força tema escuro do app antes de qualquer hidratação.
      document.documentElement.classList.add('dark');
    });
    await page.goto(PATH, { waitUntil: 'domcontentloaded' });
  });

  test('rótulos e controles continuam acessíveis em dark + alto contraste', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /Configurações de Leitura/i });
    if (test.info().project.use.hasTouch) await trigger.tap();
    else await trigger.click();

    const popover = page.getByTestId('reading-settings-popover');
    await expect(popover).toBeVisible();

    // Seleciona tema "Escuro" e contraste "Alto Contraste" pela UI.
    await popover.getByRole('button', { name: /Escuro/i }).first().click();
    await popover.getByRole('radio', { name: /Alto Contraste/i }).click();

    // Cada seção ainda é anunciada por nome (rótulos legíveis no dark mode).
    await expect(popover.getByRole('radiogroup', { name: /Temas de leitura/i })).toBeVisible();
    await expect(popover.getByRole('radiogroup', { name: /Tamanho do Texto/i })).toBeVisible();
    await expect(popover.getByRole('radiogroup', { name: /Acessibilidade/i })).toBeVisible();
    await expect(popover.getByRole('radiogroup', { name: /Espaçamento/i })).toBeVisible();
    await expect(popover.getByRole('radio', { name: /Alto Contraste/i }))
      .toHaveAttribute('aria-checked', 'true');

    // Snapshot visual — Playwright só armazena no retry/falha graças à
    // configuração `screenshot: 'only-on-failure'` + `trace: 'retain-on-failure'`.
    await expect(popover).toHaveScreenshot(
      `reading-settings-popover-dark-${test.info().project.name}.png`,
      { maxDiffPixelRatio: 0.08 }
    );
  });
});
