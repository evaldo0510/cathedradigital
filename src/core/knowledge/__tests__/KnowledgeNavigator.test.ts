import { describe, it, expect } from 'vitest';
import { KnowledgeNavigator, COMPOSED_STUDY_STAGES } from '../KnowledgeNavigator';

describe('KnowledgeNavigator', () => {
  it('composedStudy devolve os 7 estágios canônicos para um tema com relações completas', () => {
    const steps = KnowledgeNavigator.composedStudy('theme:esperanca');
    expect(steps.length).toBe(COMPOSED_STUDY_STAGES.length);
    expect(steps.map((s) => s.stage)).toEqual(
      COMPOSED_STUDY_STAGES.map((s) => s.stage),
    );
    expect(steps[0].node.kind).toBe('bible');
    expect(steps[0].node.id).toBe('bible:romanos:8');
  });

  it('expand(depth=1) inclui o próprio nó e seus vizinhos diretos', () => {
    const nodes = KnowledgeNavigator.expand('theme:eucaristia', 1);
    const ids = nodes.map((n) => n.id);
    expect(ids).toContain('theme:eucaristia');
    expect(ids).toContain('bible:joao:6');
    expect(ids).toContain('catechism:1322');
  });

  it('pathBetween encontra caminho mínimo entre dois nós conectados', () => {
    const path = KnowledgeNavigator.pathBetween('theme:eucaristia', 'theme:graca');
    expect(path).not.toBeNull();
    expect(path![0].id).toBe('theme:eucaristia');
    expect(path![path!.length - 1].id).toBe('theme:graca');
  });

  it('pathBetween devolve o próprio nó quando origem = destino', () => {
    const path = KnowledgeNavigator.pathBetween('theme:esperanca', 'theme:esperanca');
    expect(path).toEqual([expect.objectContaining({ id: 'theme:esperanca' })]);
  });

  it('pathBetween devolve null quando não há caminho', () => {
    const path = KnowledgeNavigator.pathBetween('theme:esperanca', 'nonexistent:node');
    expect(path).toBeNull();
  });
});
