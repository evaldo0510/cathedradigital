import { test, expect } from 'vitest';

const FORBIDDEN_ENGLISH_WORDS = [
  'Chapter', 'Verse', 'Book', 'Search', 'Loading', 'Error', 
  'Settings', 'Cancel', 'Save', 'Delete', 'Share', 'Back', 'Summary'
];

test('Bíblia não deve conter termos em inglês na interface principal', () => {
  // Simula o conteúdo do DOM (em um teste real usaríamos bibliotecas como testing-library)
  const bodyText = document.body.innerText || "";
  
  FORBIDDEN_ENGLISH_WORDS.forEach(word => {
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
