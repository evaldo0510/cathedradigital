/**
 * Testes E2E — Validação e Autosave no Leitor de Passo e Conclusão de Jornada.
 *
 * Cobre:
 *   1. CTA "Concluir Etapa" bloqueado/desbloqueado conforme reflexão.
 *   2. Mensagem/tooltip + foco no textarea ao tentar concluir vazio.
 *   3. Autosave da reflexão em localStorage + restauração após reload.
 *   4. Pré-visualização do certificado antes de compartilhar.
 *
 * Autenticação e IDs vêm por env vars — se ausentes, o describe é pulado
 * para não travar CI que não tem sessão Supabase minted.
 *
 *   E2E_JOURNEY_ID       — uuid de uma jornada ativa com pelo menos 1 step
 *                          cuja etapa final tenha final_question/journal_prompt.
 *   E2E_JOURNEY_STEP_ID  — uuid do step com pergunta final (validação).
 */

import { test, expect } from '@playwright/test';

const JOURNEY_ID = process.env.E2E_JOURNEY_ID;
const STEP_ID = process.env.E2E_JOURNEY_STEP_ID;
const HAS_AUTH = process.env.LOVABLE_BROWSER_AUTH_STATUS === 'injected';

const STORAGE_KEY = process.env.LOVABLE_BROWSER_SUPABASE_STORAGE_KEY;
const SESSION_JSON = process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON;

test.describe('Jornadas — validação, autosave e preview de certificado', () => {
  test.skip(
    !JOURNEY_ID || !STEP_ID || !HAS_AUTH,
    'Requer E2E_JOURNEY_ID, E2E_JOURNEY_STEP_ID e sessão Supabase injetada.',
  );

  test.beforeEach(async ({ page, context }) => {
    // Restaura sessão Supabase antes de qualquer navegação autenticada.
    await page.goto('/');
    if (STORAGE_KEY && SESSION_JSON) {
      await page.evaluate(
        ([k, v]) => window.localStorage.setItem(k, v),
        [STORAGE_KEY, SESSION_JSON],
      );
    }
    // Limpa rascunho anterior desta etapa para começar do zero.
    await page.evaluate((sid) => {
      window.localStorage.removeItem(`cathedra:journey-step:${sid}`);
    }, STEP_ID);
  });

  test('CTA "Concluir Etapa" bloqueia sem reflexão e libera após 10+ caracteres', async ({
    page,
  }) => {
    await page.goto(`/jornadas/${JOURNEY_ID}/step?step=${STEP_ID}`);
    const btn = page.getByRole('button', { name: /concluir etapa/i });
    await expect(btn).toBeVisible();

    // Bloqueado inicialmente (aria-disabled).
    await expect(btn).toHaveAttribute('aria-disabled', 'true');

    const textarea = page.getByRole('textbox').first();
    await textarea.fill('curto');
    await expect(btn).toHaveAttribute('aria-disabled', 'true');

    await textarea.fill('reflexão válida com mais de dez caracteres');
    await expect(btn).toHaveAttribute('aria-disabled', 'false');
  });

  test('Clicar em concluir com reflexão vazia mostra mensagem e foca o textarea', async ({
    page,
  }) => {
    await page.goto(`/jornadas/${JOURNEY_ID}/step?step=${STEP_ID}`);
    const btn = page.getByRole('button', { name: /concluir etapa/i });
    await btn.click({ force: true });

    // Foco vai para a textarea de reflexão.
    const textarea = page.getByRole('textbox').first();
    await expect(textarea).toBeFocused();

    // Mensagem em aria-live / toast menciona reflexão.
    await expect(page.getByText(/reflex(ão|ao).*(10|dez).*caracter/i).first()).toBeVisible();
  });

  test('Autosave persiste reflexão em localStorage e restaura após reload', async ({
    page,
  }) => {
    await page.goto(`/jornadas/${JOURNEY_ID}/step?step=${STEP_ID}`);
    const textarea = page.getByRole('textbox').first();
    const texto = 'Rascunho de teste E2E — persistência automática';
    await textarea.fill(texto);

    // Aguarda janela de debounce (500ms) + margem.
    await page.waitForTimeout(900);

    // Confirma escrita no storage.
    const stored = await page.evaluate(
      (sid) => window.localStorage.getItem(`cathedra:journey-step:${sid}`),
      STEP_ID,
    );
    expect(stored).toContain('Rascunho de teste E2E');

    // Recarrega e valida restauração.
    await page.reload();
    await expect(page.getByRole('textbox').first()).toHaveValue(texto);
  });

  test('Preview do certificado exibe título, etapas e XP antes de compartilhar', async ({
    page,
  }) => {
    await page.goto(`/jornadas/${JOURNEY_ID}/conclusao`);

    const btn = page.getByRole('button', { name: /visualizar e compartilhar/i });
    await expect(btn).toBeVisible();

    // Se botão estiver bloqueado, jornada não foi 100% concluída — apenas valida bloqueio.
    const disabled = await btn.getAttribute('aria-disabled');
    if (disabled === 'true') {
      await expect(page.getByRole('alert')).toContainText(/pendente/i);
      return;
    }

    await btn.click();

    // Dialog abre com pré-visualização.
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/pré-visualização do certificado/i)).toBeVisible();
    await expect(dialog.getByText(/certificado de conclusão/i)).toBeVisible();
    await expect(dialog.getByText(/^jornada$/i)).toBeVisible();
    await expect(dialog.getByText(/^etapas$/i)).toBeVisible();

    // Cancelar fecha o dialog sem compartilhar.
    await dialog.getByRole('button', { name: /cancelar/i }).click();
    await expect(dialog).not.toBeVisible();
  });
});
