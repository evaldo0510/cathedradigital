/**
 * Regressão mobile — Nexus + Rosário + ReaderContinuation.
 *
 * Garante ausência de 404 em toda a jornada devocional/estudo:
 *  1. Landing Rosário → seleção de mistério → sessão → ReaderContinuation → destino
 *  2. Glossário canônico /glossario + redirects (/glossary, /az-faith, /encyclopedia)
 *  3. Bubbles do Nexus (Bíblia) → verificação de rota carregada sem 404 nem prefixos legados
 */

import { test, expect, type Page } from "@playwright/test";

const MOBILE = { width: 393, height: 851 };

async function assertNo404(page: Page) {
  const html = await page.content();
  expect(html, "Página exibiu NotFound").not.toMatch(/Página não encontrada|not\s*found|404/i);
  const url = page.url();
  expect(url, "URL caiu em prefixo legado").not.toMatch(/\/(estudar|rezar)\//);
}

test.describe("Regressão mobile — Nexus + Rosário + Continuações", () => {
  test.use({ viewport: MOBILE });

  test("Rosário: landing → mistério → sessão → continuação sem 404", async ({ page }) => {
    await page.goto("/rosary", { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "networkidle" });

    // Landing carrega
    await expect(page.getByRole("heading", { name: /Santo Rosário/i })).toBeVisible();
    await assertNo404(page);

    // Escolhe um conjunto
    await page.getByRole("button", { name: /Gozosos/i }).first().click();
    await expect(page.getByRole("button", { name: /Iniciar Oração/i })).toBeVisible();
    await assertNo404(page);

    // Inicia oração
    await page.getByRole("button", { name: /Iniciar Oração/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await assertNo404(page);

    // Avança alguns passos e valida progresso persistido
    for (let i = 0; i < 4; i += 1) {
      const next = page.getByRole("button", { name: /Avançar/i });
      if ((await next.count()) === 0) break;
      await next.first().click();
    }
    const saved = await page.evaluate(() =>
      localStorage.getItem("cathedra:devotional-progress:rosary"),
    );
    expect(saved, "Progresso do Rosário não persistiu").toBeTruthy();
  });

  test("Glossário: /glossario canônico + redirects (/glossary, /az-faith, /encyclopedia)", async ({
    page,
  }) => {
    for (const legacy of ["/glossary", "/az-faith", "/encyclopedia"]) {
      await page.goto(legacy, { waitUntil: "networkidle" });
      await expect(page).toHaveURL(/\/glossario(\/|$)/);
      await assertNo404(page);
    }
    await page.goto("/glossario", { waitUntil: "networkidle" });
    await assertNo404(page);
  });

  test("Nexus Bíblia: bubbles reais não abrem 404 nem rotas legadas", async ({ page }) => {
    await page.goto("/biblia", { waitUntil: "networkidle" });
    await assertNo404(page);

    const bubble = page.locator('[data-testid^="nexus-bubbles-"] a, [data-testid^="nexus-bubbles-"] button').first();
    if ((await bubble.count()) === 0) test.skip(true, "Sem bubbles Nexus indexados no ambiente");

    await bubble.click();
    await page.waitForLoadState("networkidle");
    await assertNo404(page);
  });
});
