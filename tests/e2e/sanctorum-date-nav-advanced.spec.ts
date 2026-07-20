import { test, expect, Page, devices } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Cobre os cenários adicionais pedidos:
 *  1. Reload com ?date=... fora do intervalo → URL corrigida + DateNav sincronizado.
 *  2. Analytics: emite `sanctorum_date_change` com `method` correto (botões,
 *     calendário via teclado) e `sanctorum_date_clamped` quando URL inválida.
 *  3. Validação de JSON-LD (Person + ItemList) após trocar o dia em /papas
 *     e Person em /santos/:slug.
 *  4. Viewport mobile: popover do calendário + destaque na tira de dias.
 *  5. Axe: violações críticas em /papas e no SanctorumDateNav.
 */

async function collectAnalytics(page: Page) {
  const events: Array<{ name: string; properties?: Record<string, unknown> }> = [];
  page.on('console', (msg) => {
    if (msg.type() !== 'log') return;
    const text = msg.text();
    const match = /\[Analytics\] Event:\s+(\S+)\s+(.*)$/s.exec(text);
    if (!match) return;
    let props: Record<string, unknown> | undefined;
    try {
      // O console.log serializa objetos como JSObjectHandle; leitura direta pelo texto
      // é frágil. Fallback: capturar via window shim (abaixo).
      props = JSON.parse(match[2]);
    } catch {
      props = undefined;
    }
    events.push({ name: match[1], properties: props });
  });
  await page.addInitScript(() => {
    (window as any).__analyticsEvents = [];
    (window as any).gtag = (_type: string, name: string, properties: unknown) => {
      (window as any).__analyticsEvents.push({ name, properties });
    };
  });
  return {
    events,
    async captured() {
      return page.evaluate(() => (window as any).__analyticsEvents ?? []);
    },
  };
}

// ---------------------------------------------------------------------------
// 1. Reload com date fora do intervalo → URL corrigida
// ---------------------------------------------------------------------------
test.describe('PopesPage — sincronia e clamp de URL', () => {
  test('date=9999-01-01 é substituído por hoje na URL e no DateNav', async ({ page }) => {
    const analytics = await collectAnalytics(page);
    await page.goto('/papas?date=9999-01-01', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('button', { name: 'Ir para hoje' })).toBeVisible();

    // URL deve ter sido corrigida para uma data do ano corrente.
    await expect.poll(() => {
      const p = new URL(page.url()).searchParams.get('date');
      return p && /^\d{4}-\d{2}-\d{2}$/.test(p) && parseInt(p.slice(0, 4), 10) <= new Date().getFullYear() + 1;
    }).toBeTruthy();

    // Botão "Hoje" fica desabilitado (data é a de hoje) → sincronizado.
    await expect(page.getByRole('button', { name: 'Ir para hoje' })).toBeDisabled();

    // Analytics: evento de clamp emitido.
    const captured = await analytics.captured();
    expect(captured.some((e: any) => e.name === 'sanctorum_date_clamped')).toBeTruthy();
  });

  test('date=abc (malformado) cai para hoje e URL é reescrita', async ({ page }) => {
    await page.goto('/papas?date=abc', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'Ir para hoje' })).toBeDisabled();
    await expect.poll(() => new URL(page.url()).searchParams.get('date')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('date válida no intervalo é mantida ao recarregar', async ({ page }) => {
    await page.goto('/papas?date=1980-06-15', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h2').filter({ hasText: /^15 de junho/i })).toBeVisible();
    expect(new URL(page.url()).searchParams.get('date')).toBe('1980-06-15');
  });
});

// ---------------------------------------------------------------------------
// 2. Analytics — método por origem da troca
// ---------------------------------------------------------------------------
test.describe('SanctorumDateNav — analytics de troca de data', () => {
  test('botões e calendário via teclado emitem method correto', async ({ page }) => {
    const analytics = await collectAnalytics(page);
    await page.goto('/papas', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Próximo dia' }).click();
    await page.getByRole('button', { name: 'Semana anterior' }).click();

    // Abre calendário via teclado e seleciona uma célula com Enter.
    const trigger = page.getByRole('button', { name: 'Escolher data no calendário' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog').first();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('gridcell', { name: /^15$/ }).first().focus();
    await page.keyboard.press('Enter');
    await expect(dialog).toBeHidden();

    const captured = await analytics.captured();
    const methods = captured
      .filter((e: any) => e.name === 'sanctorum_date_change')
      .map((e: any) => e.properties?.method);

    expect(methods).toContain('next-day');
    expect(methods).toContain('prev-week');
    expect(methods).toContain('calendar');
    // Todos os eventos incluem a data em ISO.
    for (const e of captured.filter((e: any) => e.name === 'sanctorum_date_change')) {
      expect(e.properties?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(e.properties?.page).toBe('popes');
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Validação de JSON-LD (Person + ItemList) após trocar o dia
// ---------------------------------------------------------------------------
function assertPersonLd(json: any, opts: { requireImage?: boolean } = {}) {
  expect(json['@context']).toBe('https://schema.org');
  expect(json['@type']).toBe('Person');
  expect(typeof json.name).toBe('string');
  expect(json.name.length).toBeGreaterThan(0);
  expect(typeof json.description).toBe('string');
  expect(json.url).toMatch(/^https?:\/\//);
  if (opts.requireImage) {
    expect(json.image).toMatch(/^https?:\/\//);
  }
}

test.describe('JSON-LD — /papas e /santos/:slug', () => {
  test('/papas emite Person + ItemList válidos após trocar de ano', async ({ page }) => {
    await page.goto('/papas?date=1980-06-15', { waitUntil: 'domcontentloaded' });

    const person = await page.locator('script[data-testid="pope-jsonld"]').textContent();
    assertPersonLd(JSON.parse(person || '{}'), { requireImage: true });

    const list = await page.locator('script[data-testid="popes-itemlist-jsonld"]').textContent();
    const parsedList = JSON.parse(list || '{}');
    expect(parsedList['@type']).toBe('ItemList');
    expect(Array.isArray(parsedList.itemListElement)).toBeTruthy();
    expect(parsedList.itemListElement.length).toBeGreaterThan(0);
    for (const li of parsedList.itemListElement) {
      expect(li['@type']).toBe('ListItem');
      expect(typeof li.position).toBe('number');
      assertPersonLd(li.item, { requireImage: true });
    }

    // Troca ano via calendário e revalida Person.
    const trigger = page.getByRole('button', { name: 'Escolher data no calendário' });
    await trigger.click();
    const dialog = page.getByRole('dialog').first();
    await dialog.getByRole('button', { name: /previous|mês anterior/i }).click({ clickCount: 24 });
    await dialog.getByRole('gridcell', { name: /^10$/ }).first().click();
    await expect(dialog).toBeHidden();

    await page.waitForFunction(() => {
      const el = document.querySelector('script[data-testid="pope-jsonld"]');
      return el && (el.textContent || '').length > 0;
    });
    const personAfter = await page.locator('script[data-testid="pope-jsonld"]').textContent();
    if (personAfter && personAfter.length > 2) {
      assertPersonLd(JSON.parse(personAfter), { requireImage: true });
    }
  });

  test('/santos/:slug emite Person válido', async ({ page }) => {
    await page.goto('/santos', { waitUntil: 'networkidle' });
    const link = page.locator('a[href^="/santos/"]').first();
    if ((await link.count()) === 0) {
      test.skip(true, 'Sem santos linkáveis');
      return;
    }
    await link.click();
    await page.waitForURL(/\/santos\/[^/]+/);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const person = scripts
      .map((s) => {
        try { return JSON.parse(s); } catch { return null; }
      })
      .find((j) => j && j['@type'] === 'Person');
    expect(person, 'JSON-LD Person deve existir na página do santo').toBeTruthy();
    assertPersonLd(person);
  });
});

// ---------------------------------------------------------------------------
// 4. Viewport mobile — popover e destaque na tira
// ---------------------------------------------------------------------------
test.describe('SanctorumDateNav — mobile', () => {
  test.use({ ...devices['iPhone 12'] });

  test('popover do calendário abre e fecha em mobile', async ({ page }) => {
    await page.goto('/papas', { waitUntil: 'domcontentloaded' });
    const trigger = page.getByRole('button', { name: 'Escolher data no calendário' });
    await trigger.tap();
    const dialog = page.getByRole('dialog').first();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('gridcell', { name: /^15$/ }).first().tap();
    await expect(dialog).toBeHidden();
    await expect(page.locator('h2').filter({ hasText: /^15 de /i })).toBeVisible();
  });

  test('destaque na tira migra ao trocar de data em /santos (mobile)', async ({ page }) => {
    await page.goto('/santos', { waitUntil: 'domcontentloaded' });
    const before = await page.locator('button[aria-pressed="true"]').first().getAttribute('aria-label');
    await page.getByRole('button', { name: 'Próximo dia' }).tap();
    const after = await page.locator('button[aria-pressed="true"]').first().getAttribute('aria-label');
    expect(after).not.toBe(before);
  });
});

// ---------------------------------------------------------------------------
// 5. Axe — /papas e SanctorumDateNav
// ---------------------------------------------------------------------------
test.describe('Axe — auditoria acessibilidade', () => {
  test('/papas: sem violações críticas/sérias', async ({ page }) => {
    await page.goto('/papas', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Ir para hoje' }).waitFor();
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    const blocking = result.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });

  test('SanctorumDateNav: grupo/labels/roles corretos', async ({ page }) => {
    await page.goto('/papas', { waitUntil: 'domcontentloaded' });
    const group = page.getByRole('group', { name: 'Navegação por data' });
    await expect(group).toBeVisible();

    // Tira tem role=group com aria-label.
    await expect(page.getByRole('group', { name: 'Tira de dias' })).toBeVisible();

    // Botões críticos possuem accessible name.
    for (const name of [
      'Dia anterior',
      'Próximo dia',
      'Semana anterior',
      'Próxima semana',
      'Ir para hoje',
      'Escolher data no calendário',
    ]) {
      await expect(page.getByRole('button', { name })).toBeVisible();
    }

    // Axe apenas no escopo do DateNav.
    const result = await new AxeBuilder({ page })
      .include('[role="group"][aria-label="Navegação por data"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    const blocking = result.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });
});
