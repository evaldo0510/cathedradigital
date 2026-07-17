import { describe, it, expect } from 'vitest';
import { KnowledgeResolver } from '../KnowledgeResolver';

describe('KnowledgeResolver', () => {
  it('resolve devolve o nó + URL para nós com rota', () => {
    const r = KnowledgeResolver.resolve('bible:romanos:8');
    expect(r).not.toBeNull();
    expect(r!.node.id).toBe('bible:romanos:8');
    expect(typeof r!.url).toBe('string');
    expect(r!.url).toContain('romanos');
  });

  it('resolve devolve url=null para nós sem rota', () => {
    const r = KnowledgeResolver.resolve('application:esperanca-provacao');
    expect(r).not.toBeNull();
    expect(r!.url).toBeNull();
  });

  it('resolve devolve null para nó inexistente', () => {
    expect(KnowledgeResolver.resolve('theme:inexistente')).toBeNull();
  });

  it('resolveMany filtra silenciosamente ids desconhecidos', () => {
    const list = KnowledgeResolver.resolveMany([
      'theme:esperanca',
      'theme:inexistente',
      'bible:joao:6',
    ]);
    expect(list.length).toBe(2);
    expect(list.map((r) => r.node.id)).toEqual(['theme:esperanca', 'bible:joao:6']);
  });
});
