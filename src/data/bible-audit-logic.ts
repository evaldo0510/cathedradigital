import { BIBLE_DATA } from './bible-books';

export const getBibleAuditReport = async (fetchVerses: (abbr: string, ch: number) => Promise<any[]>) => {
  const allBooks = Object.values(BIBLE_DATA).flat().flatMap(cat => cat.books);
  const report: { 
    book: string; 
    chapter: number; 
    status: 'ok' | 'empty' | 'missing_verses' | 'language_violation';
    verseCount: number;
    languageIssues?: string[];
  }[] = [];

  const FORBIDDEN_EN = [
    'the', 'and', 'shall', 'unto', 'from', 'Tobit', 'Judith', 'Wisdom', 'Sirach', 'Baruch', 'Maccabees', 'Chapter', 'Verse'
  ];

  // Comprehensive Sanity Check for Premium Certification
  const booksToSanityCheck = [
    ...allBooks.filter(b => ['Tobias', 'Judite', 'Sabedoria', 'Baruc', '1 Macabeus', '2 Macabeus', 'Eclesiástico', 'Abdias'].includes(b.name)),
    allBooks.find(b => b.name === 'Salmos')!,
    allBooks.find(b => b.name === 'Gênesis')!,
    allBooks.find(b => b.name === 'Mateus')!,
    allBooks.find(b => b.name === 'Apocalipse')!
  ].filter(Boolean);

  for (const book of booksToSanityCheck) {
    const chaptersToCheck = [1, book.chapters];
    if (book.name === 'Salmos') chaptersToCheck.push(23, 119, 151);
    
    for (const ch of [...new Set(chaptersToCheck)]) {
      if (ch > book.chapters && book.name !== 'Salmos') continue;
      
      try {
        const verses = await fetchVerses(book.abbr, ch);
        if (!verses || verses.length === 0) {
          report.push({ book: book.name, chapter: ch, status: 'empty', verseCount: 0 });
        } else {
          // Check for English terms (Language Consistency Validation)
          const languageIssues: string[] = [];
          verses.forEach(v => {
            const text = v.text || '';
            FORBIDDEN_EN.forEach(term => {
              const regex = new RegExp(`\\b${term}\\b`, 'i');
              if (regex.test(text)) {
                languageIssues.push(`V${v.number}: "${term}" detected`);
              }
            });
          });

          if (languageIssues.length > 0) {
            report.push({ 
              book: book.name, 
              chapter: ch, 
              status: 'language_violation', 
              verseCount: verses.length,
              languageIssues: [...new Set(languageIssues)].slice(0, 5) // Top 5 issues
            });
          } else {
            report.push({ book: book.name, chapter: ch, status: 'ok', verseCount: verses.length });
          }
        }
      } catch (e) {
        report.push({ book: book.name, chapter: ch, status: 'empty', verseCount: 0 });
      }
    }
  }

  return report;
};
