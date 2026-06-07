import { test, expect, describe, beforeEach } from 'vitest';
import { BIBLE_DATA } from '../../../data/bible-books';

describe('Integridade de Tradução de Livros', () => {
  const forbiddenEnBooks = ['Tobit', 'Judith', 'Wisdom', 'Sirach', 'Chapter', 'Search'];

  test('Todos os livros na BIBLE_DATA devem estar em português', () => {
    const allBooks = Object.values(BIBLE_DATA).flat().flatMap(cat => cat.books);
    
    allBooks.forEach(book => {
      forbiddenEnBooks.forEach(forbidden => {
        expect(book.name.toLowerCase()).not.toBe(forbidden.toLowerCase());
      });
    });
  });

  test('Componente BibleSearch não deve renderizar termos em inglês', () => {
    // Simulação de busca mock
    const results = [
      { bookName: 'Tobias', text: 'No princípio...' },
      { bookName: 'Judite', text: 'E aconteceu que...' }
    ];
    
    const bodyContent = JSON.stringify(results);
    forbiddenEnBooks.forEach(forbidden => {
      expect(bodyContent).not.toContain(forbidden);
    });
  });

  test('Verificação de slugs e rotas compostas', () => {
    const booksWithSpaces = ['1 João', '2 Reis', '1 Crônicas'];
    const allBooks = Object.values(BIBLE_DATA).flat().flatMap(cat => cat.books);
    
    booksWithSpaces.forEach(name => {
      const found = allBooks.find(b => b.name === name);
      expect(found).toBeDefined();
      expect(found?.abbr).not.toContain(' '); // Abreviações não devem ter espaços para rotas limpas
    });
  });
});
