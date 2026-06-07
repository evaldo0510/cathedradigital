import { expect, test, describe } from 'vitest';
import { BIBLE_DATA } from '../data/bible-books';
import { FORBIDDEN_ENGLISH_WORDS } from '../constants/language-config';

describe('Bible Language Consistency', () => {
  test('BIBLE_DATA should not contain forbidden English words in book names', () => {
    const allBooks = Object.values(BIBLE_DATA).flat().flatMap(cat => cat.books);
    
    allBooks.forEach(book => {
      FORBIDDEN_ENGLISH_WORDS.forEach(word => {
        expect(book.name.toLowerCase()).not.toContain(word.toLowerCase());
      });
      
      // Specifically check for deuterocanonical English names
      const englishDeutero = ['tobit', 'judith', 'wisdom', 'sirach', 'baruch', 'maccabees'];
      englishDeutero.forEach(word => {
        expect(book.name.toLowerCase()).not.toBe(word);
      });
    });
  });

  test('Abbreviations should follow Portuguese convention', () => {
    const allBooks = Object.values(BIBLE_DATA).flat().flatMap(cat => cat.books);
    const commonEnglishAbbr = ['Gn', 'Ex', 'Lv', 'Nm', 'Dt']; // Some are same, but check others
    
    // Tb vs Tob, Jdt vs Jud
    const book = allBooks.find(b => b.name === 'Tobias');
    if (book) expect(book.abbr).toBe('Tb');
    
    const judite = allBooks.find(b => b.name === 'Judite');
    if (judite) expect(judite.abbr).toBe('Jdt');
    
    const sabedoria = allBooks.find(b => b.name === 'Sabedoria');
    if (sabedoria) expect(sabedoria.abbr).toBe('Sb');
  });
});
