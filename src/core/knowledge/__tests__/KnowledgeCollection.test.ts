import { describe, it, expect } from 'vitest';
import { KnowledgeCollectionRegistry } from '../KnowledgeCollection';

describe('KnowledgeCollectionRegistry', () => {
  it('all() inclui as coleções canônicas seed', () => {
    const ids = KnowledgeCollectionRegistry.all().map((c) => c.id);
    expect(ids).toContain('collection:enciclicas');
    expect(ids).toContain('collection:evangelhos');
  });

  it('members() resolve IDs em nós reais e ignora ids inexistentes', () => {
    const members = KnowledgeCollectionRegistry.members('collection:enciclicas');
    expect(members.length).toBeGreaterThan(0);
    expect(members.every((n) => n.kind === 'magisterium')).toBe(true);
  });

  it('collectionsOf devolve coleções que contêm o nó', () => {
    const cols = KnowledgeCollectionRegistry.collectionsOf('bible:joao:6');
    expect(cols.some((c) => c.id === 'collection:evangelhos')).toBe(true);
  });

  it('register adiciona coleção runtime', () => {
    KnowledgeCollectionRegistry.register({
      id: 'collection:test-runtime',
      label: 'Test',
      members: ['theme:esperanca'],
    });
    expect(KnowledgeCollectionRegistry.has('collection:test-runtime')).toBe(true);
  });
});
