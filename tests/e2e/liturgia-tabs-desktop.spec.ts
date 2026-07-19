import { test, expect } from '@playwright/test';

/**
 * Valida que no desktop:
 *  - A aba ativa recebe o variant esperado (fundo destacado, texto primário, sombra e leve scale)
 *  - As abas inativas ficam transparentes com texto muted (sem inversão)
 *  - Contraste da ativa é claramente diferente da inativa
 *  - Ao trocar de aba, o destaque migra corretamente
 */

const TABS = [
  { id: 'liturgia', label: 'Liturgia' },
  { id: 'missal', label: 'Missal' },
  { id: 'calendario', label: 'Calendário' },
];

const DESKTOP_VIEWPORTS = [
  { name: 'desktop-1280', width: 1280, height: 900 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
];

// Converte "rgb(r, g, b)" ou "rgba(r,g,b,a)" -> luminância relativa (0..1)
function parseRgb(css: string): [number, number, number, number] | null {
  const m = css.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(',').map((s) => parseFloat(s.trim()));
  if (parts.length < 3) return null;
  return [parts[0], parts[1], parts[2], parts[3] ?? 1];
}
function luminance([r, g, b]: [number, number, number, number]): number {
  const norm = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * norm[0] + 0.7152 * norm[1] + 0.0722 * norm[2];
}
function contrastRatio(a: string, b: string): number {
  const A = parseRgb(a);
  const B = parseRgb(b);
  if (!A || !B) return 0;
  const l1 = luminance(A);
  const l2 = luminance(B);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

test.describe('Liturgia — abas desktop (variant + contraste)', () => {
  for (const vp of DESKTOP_VIEWPORTS) {
    test(`aba ativa destacada e inativas não invertidas — ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/liturgia');
      await page.waitForLoadState('networkidle');

      const tabs = page.getByRole('tab');
      await expect(tabs).toHaveCount(TABS.length);

      for (let i = 0; i < TABS.length; i++) {
        await tabs.nth(i).click();
        await page.waitForTimeout(200);

        const active = tabs.nth(i);
        await expect(active).toHaveAttribute('aria-selected', 'true');

        const activeStyle = await active.evaluate((el) => {
          const cs = getComputedStyle(el);
          return {
            bg: cs.backgroundColor,
            color: cs.color,
            shadow: cs.boxShadow,
            transform: cs.transform,
            fontWeight: cs.fontWeight,
          };
        });

        // 1) Variant esperado: fundo NÃO transparente e sombra presente
        expect(activeStyle.bg, `aba ativa ${TABS[i].label} sem fundo sólido`).not.toBe('rgba(0, 0, 0, 0)');
        expect(activeStyle.bg).not.toBe('transparent');
        expect(activeStyle.shadow, `aba ativa ${TABS[i].label} sem sombra`).not.toBe('none');

        // 2) Contraste texto x fundo da ativa >= 4.5 (WCAG AA)
        const ratio = contrastRatio(activeStyle.color, activeStyle.bg);
        expect(ratio, `contraste insuficiente na aba ativa ${TABS[i].label}: ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);

        // 3) Inativas: transparentes, texto muted, sem sombra, aria-selected=false
        for (let j = 0; j < TABS.length; j++) {
          if (j === i) continue;
          const inactive = tabs.nth(j);
          await expect(inactive).toHaveAttribute('aria-selected', 'false');

          const inStyle = await inactive.evaluate((el) => {
            const cs = getComputedStyle(el);
            return { bg: cs.backgroundColor, color: cs.color, shadow: cs.boxShadow };
          });

          // Não pode ficar invertida (mesmo fundo destacado da ativa)
          expect(inStyle.bg, `aba inativa ${TABS[j].label} está com mesmo fundo da ativa`).not.toBe(activeStyle.bg);

          // Fundo inativo deve ser transparente/quase transparente
          const rgba = parseRgb(inStyle.bg);
          const alpha = rgba ? rgba[3] : 1;
          expect(alpha, `aba inativa ${TABS[j].label} com fundo opaco (α=${alpha})`).toBeLessThan(0.5);

          // Sem sombra "premium"
          expect(inStyle.shadow, `aba inativa ${TABS[j].label} tem sombra`).toBe('none');

          // Cor da inativa deve diferir da ativa (não invertida)
          expect(inStyle.color, `aba inativa ${TABS[j].label} com mesma cor da ativa`).not.toBe(activeStyle.color);
        }
      }
    });
  }
});
