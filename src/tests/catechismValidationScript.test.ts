import { describe, it, expect } from 'vitest';
import { CATECHISM_LOCAL_DATA } from '../src/data/catechism';

describe('Script de Validação do Catecismo', () => {
  const items = Object.values(CATECHISM_LOCAL_DATA);
  const totalItems = items.length;

  it('deve ter pelo menos um registro para validar', () => {
    expect(totalItems).toBeGreaterThan(0);
  });

  it('todos os registros devem ter tipo e type consistentes', () => {
    const invalidTypes = items.filter(item => item.tipo !== 'catecismo' || item.type !== 'catechism');
    expect(invalidTypes.length).toBe(0);
  });

  it('todos os registros devem ter pelo menos uma tag', () => {
    const recordsWithoutTags = items.filter(item => !item.tags || item.tags.length === 0);
    expect(recordsWithoutTags.length).toBe(0);
  });

  it('as porcentagens calculadas devem ser matematicamente consistentes', () => {
    // Simulando a lógica do script de validação
    const emptyTagsCount = items.filter(item => !item.tags || item.tags.length === 0).length;
    const percentage = (emptyTagsCount / totalItems) * 100;
    
    expect(percentage).toBeGreaterThanOrEqual(0);
    expect(percentage).toBeLessThanOrEqual(100);
    
    // Verificando se a porcentagem faz sentido com o total
    if (emptyTagsCount === 0) {
      expect(percentage).toBe(0);
    }
  });

  it('o ID de cada registro deve ser único', () => {
    const ids = items.map(item => item.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
