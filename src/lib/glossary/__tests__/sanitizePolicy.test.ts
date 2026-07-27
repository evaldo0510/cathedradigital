import { describe, it, expect, beforeEach } from 'vitest';
import { validateFaqJsonLdLive } from '../sanitizeFaq';
import { getSanitizePolicy, __resetSanitizePolicyForTests } from '../sanitizePolicy';

describe('sanitizePolicy', () => {
  beforeEach(() => __resetSanitizePolicyForTests());

  it('em test env retorna severity=throw', () => {
    const p = getSanitizePolicy();
    expect(p.env).toBe('test');
    expect(p.severity).toBe('throw');
    expect(p.exposeDevPanels).toBe(false);
  });

  it('permite override para simular prod', () => {
    __resetSanitizePolicyForTests({ env: 'prod', severity: 'strict', verboseLogs: false });
    expect(getSanitizePolicy().severity).toBe('strict');
  });
});

describe('validateFaqJsonLdLive', () => {
  it('valida caso canônico', () => {
    const r = validateFaqJsonLdLive([{ question: 'O que é fé?', answer: 'Virtude teologal.' }]);
    expect(r.ok).toBe(true);
    expect(r.jsonLd?.mainEntity).toHaveLength(1);
    expect(r.droppedIndices).toEqual([]);
  });

  it('descarta itens vazios e reporta índices', () => {
    const r = validateFaqJsonLdLive([
      { question: 'Válido?', answer: 'Sim.' },
      { question: '', answer: 'x' },
      { question: 'Y', answer: '' },
    ]);
    expect(r.ok).toBe(true);
    expect(r.droppedIndices).toEqual([1, 2]);
  });

  it('marca inválido quando nenhum item elegível', () => {
    const r = validateFaqJsonLdLive([{ question: '', answer: '' }]);
    expect(r.ok).toBe(false);
    expect(r.jsonLd).toBeNull();
    expect(r.issues.length).toBeGreaterThan(0);
  });

  it('remove tags perigosas antes de validar', () => {
    const r = validateFaqJsonLdLive([
      { question: 'Q<script>x</script>', answer: 'A<iframe></iframe> ok' },
    ]);
    expect(r.ok).toBe(true);
    expect(JSON.stringify(r.jsonLd)).not.toMatch(/<script|<iframe/i);
  });
});
