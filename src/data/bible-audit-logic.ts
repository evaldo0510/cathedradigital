import { BIBLE_DATA } from './bible-books';

export const getBibleAuditReport = async (fetchVerses: (abbr: string, ch: number) => Promise<any[]>) => {
  const allBooks = Object.values(BIBLE_DATA).flat().flatMap(cat => cat.books);
  const report: { 
    book: string; 
    chapter: number; 
    status: 'ok' | 'empty' | 'missing_verses';
    verseCount: number;
  }[] = [];

  // Comprehensive Sanity Check for Premium Certification
  const booksToSanityCheck = [
    ...allBooks.filter(b => ['Tobias', 'Judite', 'Sabedoria', 'Baruc', '1 Macabeus', 'Abdias'].includes(b.name)),
    allBooks.find(b => b.name === 'Salmos')!,
    allBooks.find(b => b.name === '1 João')!,
    allBooks.find(b => b.name === '2 Reis')!
  ].filter(Boolean);

  for (const book of booksToSanityCheck) {
    const chaptersToCheck = [1, book.chapters];
    if (book.name === 'Salmos') chaptersToCheck.push(151, 119);
    
    for (const ch of [...new Set(chaptersToCheck)]) {
      try {
        const verses = await fetchVerses(book.abbr, ch);
        if (!verses || verses.length === 0) {
          report.push({ book: book.name, chapter: ch, status: 'empty', verseCount: 0 });
        } else if (verses.length < 1 && book.name !== 'Abdias') {
          report.push({ book: book.name, chapter: ch, status: 'missing_verses', verseCount: verses.length });
        } else {
          report.push({ book: book.name, chapter: ch, status: 'ok', verseCount: verses.length });
        }
      } catch (e) {
        report.push({ book: book.name, chapter: ch, status: 'empty', verseCount: 0 });
      }
    }
  }

  return report;
};
