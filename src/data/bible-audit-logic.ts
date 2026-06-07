import { BIBLE_DATA } from './bible-books';

export const getBibleAuditReport = async (fetchVerses: (abbr: string, ch: number) => Promise<any[]>) => {
  const allBooks = Object.values(BIBLE_DATA).flat().flatMap(cat => cat.books);
  const report: { 
    book: string; 
    chapter: number; 
    status: 'ok' | 'empty' | 'missing_verses';
    verseCount: number;
  }[] = [];

  // Sample check: Check first and last chapter of each book to be efficient
  // or a few random ones if too many.
  for (const book of allBooks) {
    const chaptersToCheck = [1, book.chapters];
    if (book.chapters > 2) {
      chaptersToCheck.push(Math.floor(book.chapters / 2));
    }

    for (const ch of [...new Set(chaptersToCheck)]) {
      try {
        const verses = await fetchVerses(book.abbr, ch);
        if (!verses || verses.length === 0) {
          report.push({ book: book.name, chapter: ch, status: 'empty', verseCount: 0 });
        } else if (verses.length < 5 && book.name !== '3 João' && book.name !== '2 João' && book.name !== 'Judas' && book.name !== 'Abdias') {
          // Heuristic for missing verses (unless it's a very short book)
          report.push({ book: book.name, chapter: ch, status: 'missing_verses', verseCount: verses.length });
        }
      } catch (e) {
        report.push({ book: book.name, chapter: ch, status: 'empty', verseCount: 0 });
      }
    }
  }

  return report;
};
