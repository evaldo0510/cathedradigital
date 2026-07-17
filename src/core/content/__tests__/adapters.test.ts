import { describe, it, expect } from 'vitest';
import { BibleAdapter } from '../adapters/BibleAdapter';
import { CatechismAdapter } from '../adapters/CatechismAdapter';
import { MagisteriumAdapter } from '../adapters/MagisteriumAdapter';
import { isValidId } from '@/core/knowledge';

describe('Content adapters (Sprint 2.0.4B-1)', () => {
  describe('BibleAdapter', () => {
    it('get devolve ReaderContent com id canônico', async () => {
      const c = await BibleAdapter.get({ book: 'romanos', chapter: 8 });
      expect(c).not.toBeNull();
      expect(c!.kind).toBe('bible');
      expect(isValidId(c!.id)).toBe(true);
      expect(c!.sections.length).toBeGreaterThan(0);
    });
    it('get devolve null quando não encontra', async () => {
      expect(await BibleAdapter.get({ book: 'inexistente', chapter: 1 })).toBeNull();
    });
    it('search devolve hits com snippet', async () => {
      const hits = await BibleAdapter.search('esperança');
      expect(hits.length).toBeGreaterThan(0);
      expect(hits[0].kind).toBe('bible');
      expect(hits[0].snippet).toBeTruthy();
    });
  });

  describe('CatechismAdapter', () => {
    it('get devolve parágrafo canônico', async () => {
      const c = await CatechismAdapter.get({ paragraph: 1817 });
      expect(c).not.toBeNull();
      expect(c!.kind).toBe('catechism');
      expect(c!.subtitle).toContain('1817');
      expect(isValidId(c!.id)).toBe(true);
    });
    it('search normaliza query e filtra corretamente', async () => {
      const hits = await CatechismAdapter.search('eucaristia');
      expect(hits.some((h) => h.label.includes('1322'))).toBe(true);
    });
  });

  describe('MagisteriumAdapter', () => {
    it('get devolve documento com autor no subtitle', async () => {
      const c = await MagisteriumAdapter.get({ doc: 'spe-salvi' });
      expect(c).not.toBeNull();
      expect(c!.subtitle).toBe('Bento XVI');
      expect(c!.metadata?.author).toBe('Bento XVI');
      expect(isValidId(c!.id)).toBe(true);
    });
    it('search encontra por autor', async () => {
      const hits = await MagisteriumAdapter.search('João Paulo');
      expect(hits.some((h) => h.label === 'Ecclesia de Eucharistia')).toBe(true);
    });
  });
});
