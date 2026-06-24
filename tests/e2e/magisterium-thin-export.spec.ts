import { test, expect } from '@playwright/test';
import { z } from 'zod';

/**
 * Magisterium · export JSON do painel quando em thin/final_error
 *
 * Valida o JSON exportado contra um schema Zod, garantindo:
 * - Shape e tipos de `counts`, `timeline[]`, `persistedErrors[]`, `lastError`
 * - `lastError.step === 'final_error'` com `message` não-vazio
 * - `counts.buffer === timeline.length` e `counts.persisted === persistedErrors.length`
 * - Cada evento da timeline em vocabulário conhecido (`step`)
 * - Pelo menos um `fetch_thin` precedendo o `final_error`
 */

const DOC_ID = 'ls';
const THIN_TEXT = 'Documento muito curto, provavelmente redirect.';

const StepEnum = z.enum([
  'cache_hit',
  'cache_thin',
  'fetch_ok',
  'fetch_thin',
  'fetch_404',
  'fetch_error',
  'final_error',
]);

const DiagEventSchema = z.object({
  ts: z.number().int().positive(),
  step: StepEnum,
  docId: z.string().optional(),
  url: z.string().optional(),
  status: z.union([z.number(), z.string()]).optional(),
  contentLength: z.number().optional(),
  message: z.string().optional(),
  route: z.string().optional(),
  meta: z.record(z.unknown()).optional(),
});

const FinalErrorSchema = DiagEventSchema.extend({
  step: z.literal('final_error'),
  message: z.string().min(1),
  ts: z.number().int().positive(),
});

const ReportSchema = z.object({
  generatedAt: z.string().refine((s) => !Number.isNaN(Date.parse(s)), 'generatedAt deve ser ISO válido'),
  route: z.string().nullable(),
  userAgent: z.string().nullable(),
  counts: z.object({
    buffer: z.number().int().nonnegative(),
    persisted: z.number().int().nonnegative(),
  }),
  lastError: FinalErrorSchema.nullable(),
  timeline: z.array(DiagEventSchema),
  persistedErrors: z.array(DiagEventSchema),
}).superRefine((report, ctx) => {
  if (report.counts.buffer !== report.timeline.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `counts.buffer (${report.counts.buffer}) !== timeline.length (${report.timeline.length})`,
      path: ['counts', 'buffer'],
    });
  }
  if (report.counts.persisted !== report.persistedErrors.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `counts.persisted (${report.counts.persisted}) !== persistedErrors.length (${report.persistedErrors.length})`,
      path: ['counts', 'persisted'],
    });
  }
});

test('Magisterium · JSON do painel em estado thin/final_error valida contra schema Zod', async ({ page }, testInfo) => {
  await page.route('**/functions/v1/vatican-document', async (route) => {
    await route.fulfill({
      status: 206,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        title: 'Laudato Si (thin)',
        text: THIN_TEXT,
        meta: { step: 'fetch_thin', content_length: THIN_TEXT.length },
      }),
    });
  });

  await page.goto('/');
  await page.evaluate(() =>
    window.localStorage.setItem('cathedra_magisterium_debug', '1'),
  );

  await page.goto(`/magisterium/${DOC_ID}?debug=1`);
  await expect(page.getByTestId('magisterium-error-fallback')).toBeVisible({ timeout: 15_000 });

  const panel = page.getByTestId('magisterium-diagnostic-panel');
  await expect(panel).toBeVisible();
  await expect.poll(() => panel.locator('text=final_error').count(), { timeout: 8_000 })
    .toBeGreaterThan(0);

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('magisterium-diagnostic-export').click(),
  ]);

  const path = await download.path();
  const raw = await (await import('node:fs/promises')).readFile(path!);
  await testInfo.attach(download.suggestedFilename(), {
    body: raw,
    contentType: 'application/json',
  });

  const json = JSON.parse(raw.toString('utf-8'));

  const parsed = ReportSchema.safeParse(json);
  if (!parsed.success) {
    await testInfo.attach('zod-errors.json', {
      body: Buffer.from(JSON.stringify(parsed.error.format(), null, 2)),
      contentType: 'application/json',
    });
  }
  expect(parsed.success, parsed.success ? '' : JSON.stringify(parsed.error.issues, null, 2)).toBe(true);

  const report = parsed.data!;

  // Invariantes específicas do cenário thin/final_error
  expect(report.counts.buffer).toBeGreaterThan(0);
  expect(report.lastError).not.toBeNull();
  expect(report.lastError!.step).toBe('final_error');
  expect(report.lastError!.message.length).toBeGreaterThan(0);

  const hasThin = report.timeline.some((e) => e.step === 'fetch_thin');
  const hasFinal = report.timeline.some((e) => e.step === 'final_error');
  expect(hasThin).toBe(true);
  expect(hasFinal).toBe(true);

  // Persistência inclui o final_error
  expect(report.persistedErrors.some((e) => e.step === 'final_error')).toBe(true);
});
