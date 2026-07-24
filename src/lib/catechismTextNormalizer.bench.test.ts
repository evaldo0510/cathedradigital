import { describe, it, expect } from 'vitest';
import {
  normalizeCatechismText,
  normalizeCatechismTextWithReport,
} from './catechismTextNormalizer';

const LONG_PARAGRAPH = (
  '\uFEFFA Igreja12 é sagrada.Ela ensina  a fé.\r\n\r\n\r\n' +
  'Os sinais são: – primeiro; – segundo; – terceiro. ' +
  'Cristo\u00A0Senhor  reina , eternamente .\n\n' +
  '"Bendito seja Deus", diz o salmo.'
).repeat(20);

describe('normalizeCatechismText benchmark', () => {
  it('processa parágrafo longo abaixo do budget de 2ms (média de 100 iterações)', () => {
    // Warmup
    for (let i = 0; i < 10; i++) normalizeCatechismText(LONG_PARAGRAPH);

    const iterations = 100;
    const t0 = performance.now();
    for (let i = 0; i < iterations; i++) {
      normalizeCatechismText(LONG_PARAGRAPH);
    }
    const total = performance.now() - t0;
    const avg = total / iterations;

    // eslint-disable-next-line no-console
    console.log(
      `[bench] normalize: ${avg.toFixed(3)}ms/paragraph (${LONG_PARAGRAPH.length} chars, ${iterations} iters, total ${total.toFixed(1)}ms)`
    );

    expect(avg).toBeLessThan(2);
  });

  it('reporta duração < 5ms mesmo com telemetria completa', () => {
    for (let i = 0; i < 10; i++) normalizeCatechismTextWithReport(LONG_PARAGRAPH);

    const iterations = 100;
    let totalDuration = 0;
    for (let i = 0; i < iterations; i++) {
      totalDuration += normalizeCatechismTextWithReport(LONG_PARAGRAPH).durationMs;
    }
    const avg = totalDuration / iterations;

    // eslint-disable-next-line no-console
    console.log(`[bench] normalize+report: ${avg.toFixed(3)}ms/paragraph`);

    expect(avg).toBeLessThan(5);
  });

  it('escala linearmente até 50 parágrafos por render (janela do Reader)', () => {
    const t0 = performance.now();
    for (let i = 0; i < 50; i++) normalizeCatechismText(LONG_PARAGRAPH);
    const total = performance.now() - t0;

    // eslint-disable-next-line no-console
    console.log(`[bench] normalize x50 paragraphs: ${total.toFixed(1)}ms`);

    // Budget de renderização inicial: 100ms para 50 parágrafos
    expect(total).toBeLessThan(100);
  });
});
