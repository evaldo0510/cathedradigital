import { describe, it, expect } from 'vitest';
import { normalizeCatechismText } from './catechismTextNormalizer';

describe('normalizeCatechismText', () => {
  it('remove caracteres invisíveis e NBSP', () => {
    const input = '\uFEFFPalavra\u00A0da\u200BSanta Sé.';
    expect(normalizeCatechismText(input)).toBe('Palavra da Santa Sé.');
  });

  it('normaliza quebras de linha e espaços múltiplos', () => {
    const input = 'Linha 1.\r\n\r\n\r\nLinha 2.   Texto  colado.';
    expect(normalizeCatechismText(input)).toBe('Linha 1.\n\nLinha 2. Texto colado.');
  });

  it('adiciona espaço após pontuação faltante', () => {
    const input = 'Cristo é Senhor.Ele reina.';
    expect(normalizeCatechismText(input)).toContain('Senhor. Ele');
  });

  it('remove espaço antes de pontuação', () => {
    expect(normalizeCatechismText('Cristo , Senhor .')).toBe('Cristo, Senhor.');
  });

  it('separa notas de rodapé coladas', () => {
    const input = 'A Igreja12 ensina.';
    expect(normalizeCatechismText(input)).toBe('A Igreja ensina.');
  });

  it('extrai marcadores de lista inline', () => {
    const input = 'Os sinais são: – primeiro; – segundo; – terceiro.';
    const out = normalizeCatechismText(input);
    expect(out).toMatch(/- primeiro/);
    expect(out).toMatch(/- segundo/);
  });

  it('preserva itens markdown já formatados', () => {
    const input = 'Lista:\n- item um\n- item dois';
    expect(normalizeCatechismText(input)).toBe('Lista:\n- item um\n- item dois');
  });

  it('é idempotente', () => {
    const input = 'Texto \u00A0 com  problemas.Outro.';
    const once = normalizeCatechismText(input);
    expect(normalizeCatechismText(once)).toBe(once);
  });

  it('retorna string vazia para null/undefined', () => {
    expect(normalizeCatechismText(null)).toBe('');
    expect(normalizeCatechismText(undefined)).toBe('');
  });
});
