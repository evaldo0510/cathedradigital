import { BIBLE_DATA } from '../src/data/bible-books';
import { FORBIDDEN_ENGLISH_WORDS } from '../src/constants/language-config';

async function runBibleScanner() {
  console.log('--- INICIANDO VARREDURA BÍBLICA DE IDIOMA ---');
  const results: any[] = [];
  const allBooks = Object.values(BIBLE_DATA).flat().flatMap(cat => cat.books);
  
  // Focar nos livros que causaram problemas anteriormente e alguns de controle
  const targetBooks = ['Tb', 'Jt', 'Sb', 'Eclo', 'Br', '1Mc', '2Mc', 'Gn', 'Jo', 'Mt', 'Sl'];
  const testBooks = allBooks.filter(b => targetBooks.includes(b.abbr));

  // Regex para palavras proibidas
  const forbiddenRegex = new RegExp(`\\b(${FORBIDDEN_ENGLISH_WORDS.join('|')})\\b`, 'i');

  for (const book of testBooks) {
    // 1. Validar Nome do Livro no Metadata
    if (forbiddenRegex.test(book.name)) {
      results.push({
        tipo: 'NOME DO LIVRO',
        livro: book.name,
        capitulo: '-',
        texto: book.name,
        fonte: 'src/data/bible-books.ts'
      });
    }
  }

  console.log('--- RESULTADO DA VARREDURA ESTÁTICA ---');
  if (results.length === 0) {
    console.log('✅ 0 Ocorrências de inglês encontradas nos metadados locais.');
  } else {
    console.table(results);
  }
}

runBibleScanner();
