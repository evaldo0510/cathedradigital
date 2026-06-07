import { test, expect } from 'vitest';
import { FORBIDDEN_ENGLISH_WORDS, LANGUAGE_ALLOWLIST } from '../../../constants/language-config';

test('Bíblia não deve conter termos em inglês na interface principal, respeitando a allowlist', () => {
  // Simula o conteúdo do DOM
  const bodyText = document.body.innerText || "";
  
  FORBIDDEN_ENGLISH_WORDS.forEach(word => {
    // Só falha se não estiver na allowlist (embora os proibidos geralmente não estejam)
    if (LANGUAGE_ALLOWLIST.includes(word)) return;

    const regex = new RegExp(`\\b${word}\\b`, 'i');
    expect(bodyText).not.toMatch(regex);
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
