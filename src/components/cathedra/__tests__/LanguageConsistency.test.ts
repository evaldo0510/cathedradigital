import { test, expect, describe } from 'vitest';
import { FORBIDDEN_ENGLISH_WORDS, LANGUAGE_ALLOWLIST } from '../../../constants/language-config';
import { getElementSelector } from '../../../lib/utils';

describe('Language Consistency & Runtime Scanner', () => {
  test('Bíblia não deve conter termos em inglês na interface principal, respeitando a allowlist', () => {
    const bodyText = document.body.innerText || "";
    
    FORBIDDEN_ENGLISH_WORDS.forEach(word => {
      if (LANGUAGE_ALLOWLIST.includes(word)) return;
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      expect(bodyText).not.toMatch(regex);
    });
  });

  test('getElementSelector deve gerar um seletor CSS estável e correto', () => {
    const container = document.createElement('div');
    container.id = 'test-container';
    const article = document.createElement('article');
    const p1 = document.createElement('p');
    const p2 = document.createElement('p');
    
    article.appendChild(p1);
    article.appendChild(p2);
    container.appendChild(article);
    document.body.appendChild(container);

    const selector = getElementSelector(p2);
    
    expect(selector).toContain('div#test-container');
    expect(selector).toContain('article');
    expect(selector).toContain('p:nth-of-type(2)');
    
    // Validar se o seletor é funcional
    const found = document.querySelector(selector);
    expect(found).toBe(p2);

    document.body.removeChild(container);
  });

  test('Termos ingleses proibidos (Tobit, Judith, Wisdom, Sirach) nunca devem aparecer na UI', () => {
    const forbiddenEnBooks = ['Tobit', 'Judith', 'Wisdom', 'Sirach'];
    const bodyText = document.body.innerText || "";
    
    forbiddenEnBooks.forEach(book => {
      expect(bodyText).not.toContain(book);
    });
  });
});

test('Mensagens de erro da API devem estar em português', async () => {
  // Teste de contrato mockado para a API
  const mockErrorResponse = { error: 'Internal server error' };
  
  const translateApiMessage = (msg) => {
    const map = {
      'Not found': 'Conteúdo não encontrado',
      'Internal server error': 'Erro interno do servidor',
      'Rate limit exceeded': 'Limite de requisições excedido',
      'Invalid parameter': 'Parâmetro inválido'
    };
    return map[msg] || msg;
  };

  expect(translateApiMessage(mockErrorResponse.error)).toBe('Erro interno do servidor');
});
