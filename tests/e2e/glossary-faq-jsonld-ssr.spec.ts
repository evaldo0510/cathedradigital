/**
 * E2E — Verifica que o JSON-LD FAQPage renderizado no HTML final da rota
 * /glossario/:slug seja sempre a versão sanitizada e sem campos vazios.
 *
 * Como a app é SPA (Vite), o JSON-LD é injetado por react-helmet-async após
 * hidratação. O teste aguarda o `<script type="application/ld+json">` do
 * FAQPage aparecer, faz parse e valida invariantes de segurança/qualidade.
 */
import { test, expect } from '@playwright/test';
import { z } from 'zod';

const FaqPageSchema = z.object({
  '@context': z.string().url().optional(),
  '@type': z.literal('FAQPage'),
  mainEntity: z
    .array(
      z.object({
        '@type': z.literal('Question'),
        name: z.string().trim().min(1),
        acceptedAnswer: z.object({
          '@type': z.literal('Answer'),
          text: z.string().trim().min(1),
        }),
      }),
    )
    .min(1),
});

const SLUGS = ['confissao', 'caridade', 'fe'];

for (const slug of SLUGS) {
  test(`JSON-LD FAQPage em /glossario/${slug} é sanitizado e válido`, async ({ page }) => {
    await page.goto(`/glossario/${slug}`, { waitUntil: 'networkidle' });

    // Coleta todos os JSON-LD e localiza o FAQPage
    const jsonLdBlocks = await page.$$eval(
      'script[type="application/ld+json"]',
      (nodes) => nodes.map((n) => n.textContent ?? ''),
    );
    expect(jsonLdBlocks.length).toBeGreaterThan(0);

    const faqBlock = jsonLdBlocks
      .map((raw) => {
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      })
      .find((obj) => obj && obj['@type'] === 'FAQPage');

    // Verbetes sem FAQ podem não emitir o schema — nesse caso o teste vira
    // uma asserção mais suave de que nenhum FAQPage inválido foi emitido.
    if (!faqBlock) {
      for (const raw of jsonLdBlocks) {
        expect(raw).not.toMatch(/"@type"\s*:\s*"FAQPage"/);
      }
      test.info().annotations.push({ type: 'skip', description: `${slug}: sem FAQ` });
      return;
    }

    // Estrutura válida por Zod
    const parsed = FaqPageSchema.safeParse(faqBlock);
    expect(parsed.success, JSON.stringify((parsed as any).error, null, 2)).toBe(true);

    // Invariantes de sanitização — nenhum vestígio de payload perigoso
    const serialized = JSON.stringify(faqBlock);
    expect(serialized).not.toMatch(/<script/i);
    expect(serialized).not.toMatch(/<iframe/i);
    expect(serialized).not.toMatch(/on\w+\s*=/i); // handlers inline
    expect(serialized).not.toMatch(/javascript:/i);
    // Caracteres de controle proibidos (exceto \t \n \r)
    expect(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(serialized)).toBe(false);

    // Nenhum name/text vazio
    for (const q of faqBlock.mainEntity) {
      expect(q.name.trim().length).toBeGreaterThan(0);
      expect(q.acceptedAnswer.text.trim().length).toBeGreaterThan(0);
      // Nenhum campo obrigatório do FAQPage pode conter apenas whitespace/escapes
      expect(q.name).not.toMatch(/^[\s\u200B\u00A0]+$/);
      expect(q.acceptedAnswer.text).not.toMatch(/^[\s\u200B\u00A0]+$/);
    }

    // Nenhum vestígio de URIs perigosas
    expect(serialized).not.toMatch(/vbscript:/i);
    expect(serialized).not.toMatch(/\bdata:text\/html/i);
  });
}
