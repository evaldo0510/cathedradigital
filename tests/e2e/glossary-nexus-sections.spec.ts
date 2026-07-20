/**
 * Glossário — Nexus Sections E2E.
 *
 * Ao abrir um verbete rico (eucaristia), todas as seções de conexões devem
 * aparecer preenchidas com links funcionais + badge de fonte do KnowledgeGraph.
 * Jornadas pode estar vazia (empty state permitido).
 */
import { test, expect } from '@playwright/test';

const SLUG = 'eucaristia';

const REQUIRED_ANCHORS = [
  { anchor: 'biblia',      title: 'Fundamentação bíblica' },
  { anchor: 'catecismo',   title: 'Fundamentação catequética' },
  { anchor: 'magisterio',  title: 'Magistério relacionado' },
  { anchor: 'santos',      title: 'Santos relacionados' },
  { anchor: 'padres',      title: 'Padres relacionados' },
  { anchor: 'liturgia',    title: 'Liturgia relacionada' },
  { anchor: 'oracao',      title: 'Orações relacionadas' },
];

const OPTIONAL_ANCHORS = [
  { anchor: 'jornada',     title: 'Jornadas sugeridas' },
];

test.describe('Glossário — todas as seções de conexões preenchidas', () => {
  test(`/glossario/${SLUG} — seções Nexus renderizadas e com links`, async ({ page }) => {
    await page.goto(`/glossario/${SLUG}`, { waitUntil: 'networkidle' });
    await expect(page.locator('h1').first()).toBeVisible();

    for (const { anchor, title } of REQUIRED_ANCHORS) {
      const section = page.locator(`section#${anchor}`);
      await expect(section, `seção #${anchor} deve existir`).toHaveCount(1);
      await expect(section.getByRole('heading', { name: title, level: 2 })).toBeVisible();

      const links = section.locator('a[href]');
      const linkCount = await links.count();
      expect(linkCount, `seção "${title}" deve ter ao menos 1 link`).toBeGreaterThan(0);

      // Todo link resolvido deve apontar para caminho interno (não literal externo).
      const hrefs = await links.evaluateAll((els) =>
        els.map((e) => (e as HTMLAnchorElement).getAttribute('href') || ''),
      );
      for (const href of hrefs) {
        expect(href, `href vazio em ${title}`).not.toBe('');
        expect(href.startsWith('/') || href.startsWith('http'), `href inválido: ${href}`).toBeTruthy();
      }

      // NexusSourceBadge: cada item deve mostrar tooltip "Fonte automática:
      // KnowledgeGraph → <id>" e renderizar visualmente `<kind> · <id>`.
      const badges = section.locator('[title^="Fonte automática: KnowledgeGraph"]');
      const badgeCount = await badges.count();
      expect(badgeCount, `seção "${title}" deve exibir badges de fonte automática`).toBeGreaterThan(0);

      for (let i = 0; i < badgeCount; i++) {
        const badge = badges.nth(i);
        const tooltip = (await badge.getAttribute('title')) ?? '';
        const ariaLabel = (await badge.getAttribute('aria-label')) ?? '';

        // Tooltip precisa citar a fonte automática e um ID canônico kind:slug[...].
        const tooltipMatch = tooltip.match(/^Fonte automática: KnowledgeGraph → ([a-z]+):([a-z0-9][a-z0-9\-:]*)$/);
        expect(tooltipMatch, `tooltip inválido em "${title}": "${tooltip}"`).not.toBeNull();
        const [, kind, rest] = tooltipMatch!;
        const id = `${kind}:${rest}`;

        // aria-label deve ecoar kind e id (acessibilidade).
        expect(ariaLabel, `aria-label sem kind em "${title}"`).toContain(`tipo ${kind}`);
        expect(ariaLabel, `aria-label sem id em "${title}"`).toContain(`id ${id}`);

        // Visualmente deve exibir "<kind> · <id>" (kind em texto + <code> com id).
        const kindText = (await badge.locator('span', { hasText: new RegExp(`^${kind}$`) }).first().textContent()) ?? '';
        expect(kindText.trim(), `kind visível ausente em "${title}"`).toBe(kind);
        const codeText = (await badge.locator('code').first().textContent()) ?? '';
        expect(codeText.trim(), `id canônico ausente no <code> em "${title}"`).toBe(id);
      }
    }

    for (const { anchor, title } of OPTIONAL_ANCHORS) {
      const section = page.locator(`section#${anchor}`);
      await expect(section, `seção opcional #${anchor} deve existir`).toHaveCount(1);
      await expect(section.getByRole('heading', { name: title, level: 2 })).toBeVisible();
    }

    // Nexus completo agrega tudo — deve ter ao menos tantos links quanto a soma das seções obrigatórias.
    const nexusFull = page.locator('section#nexus');
    await expect(nexusFull).toHaveCount(1);
    const nexusLinks = await nexusFull.locator('a[href]').count();
    expect(nexusLinks, 'Nexus completo deve agregar conexões').toBeGreaterThan(REQUIRED_ANCHORS.length);
  });
});
