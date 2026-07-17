import { describe, it, expect } from 'vitest';
import { ReaderService, createReaderServiceWith } from '../services/ReaderService';
import type { ContentAdapter, ContentAdapters } from '../adapters';

describe('ReaderService', () => {
  it('readableKinds lista bible/catechism/magisterium', () => {
    expect(ReaderService.readableKinds()).toEqual(['bible', 'catechism', 'magisterium']);
  });

  it('canRead é true para kinds atendidos e false para os demais', () => {
    expect(ReaderService.canRead('bible')).toBe(true);
    expect(ReaderService.canRead('theme')).toBe(false);
    expect(ReaderService.canRead('prayer')).toBe(false);
  });

  it('get delega ao adapter correto por kind', async () => {
    const c = await ReaderService.get('catechism', { paragraph: 1817 });
    expect(c?.kind).toBe('catechism');
  });

  it('get devolve null para kind não legível', async () => {
    expect(await ReaderService.get('theme', {})).toBeNull();
  });

  it('search agrega resultados de todos os adapters', async () => {
    const hits = await ReaderService.search('esperança');
    const kinds = new Set(hits.map((h) => h.kind));
    expect(kinds.size).toBeGreaterThanOrEqual(2);
  });

  it('search vazia devolve []', async () => {
    expect(await ReaderService.search('   ')).toEqual([]);
  });

  it('searchIn restringe ao adapter informado', async () => {
    const hits = await ReaderService.searchIn('catechism', 'eucaristia');
    expect(hits.every((h) => h.kind === 'catechism')).toBe(true);
  });

  it('createReaderServiceWith permite injetar adapters de teste', async () => {
    const fake: ContentAdapter = {
      kind: 'bible',
      label: 'fake',
      async get() {
        return {
          id: 'bible:fake:1',
          kind: 'bible',
          title: 'Fake',
          sections: [{ body: 'x' }],
        };
      },
      async search() {
        return [{ nodeId: 'bible:fake:1', kind: 'bible', label: 'Fake' }];
      },
    };
    const adapters: ContentAdapters = {
      bible: fake,
      catechism: fake,
      magisterium: fake,
    };
    const svc = createReaderServiceWith(adapters);
    const c = await svc.get('bible', {});
    expect(c?.title).toBe('Fake');
  });
});
