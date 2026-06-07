// Map of common Bible book names/abbreviations in Portuguese to API abbreviations
const BIBLE_BOOK_MAP: Record<string, string> = {
  'Gn': 'gn', 'Gên': 'gn', 'Gênesis': 'gn',
  'Ex': 'ex', 'Êx': 'ex', 'Êxodo': 'ex',
  'Lv': 'lv', 'Levítico': 'lv',
  'Nm': 'nm', 'Números': 'nm',
  'Dt': 'dt', 'Deuteronômio': 'dt',
  'Js': 'js', 'Josué': 'js',
  'Jz': 'jz', 'Juízes': 'jz',
  'Rt': 'rt', 'Rute': 'rt',
  '1Sm': '1sm', '1 Sm': '1sm', '1Samuel': '1sm',
  '2Sm': '2sm', '2 Sm': '2sm', '2Samuel': '2sm',
  '1Rs': '1rs', '1 Rs': '1rs', '1Reis': '1rs',
  '2Rs': '2rs', '2 Rs': '2rs', '2Reis': '2rs',
  '1Cr': '1cr', '1 Cr': '1cr', '1Crônicas': '1cr',
  '2Cr': '2cr', '2 Cr': '2cr', '2Crônicas': '2cr',
  'Esd': 'esd', 'Esdras': 'esd',
  'Ne': 'ne', 'Neemias': 'ne',
  'Tb': 'tb', 'Tobias': 'tb',
  'Jdt': 'jdt', 'Judite': 'jdt',
  'Est': 'est', 'Ester': 'est',
  '1Mc': '1mc', '1 Mc': '1mc', '1Macabeus': '1mc',
  '2Mc': '2mc', '2 Mc': '2mc', '2Macabeus': '2mc',
  'Jó': 'job', 'Job': 'job',
  'Sl': 'sl', 'Salmos': 'sl', 'Salmo': 'sl',
  'Pr': 'pr', 'Provérbios': 'pr',
  'Ecl': 'ecl', 'Eclesiastes': 'ecl', 'Qo': 'ecl',
  'Ct': 'ct', 'Cânticos': 'ct', 'Cântico': 'ct',
  'Sb': 'sb', 'Sabedoria': 'sb',
  'Eclo': 'eclo', 'Eclesiástico': 'eclo', 'Sir': 'eclo',
  'Is': 'is', 'Isaías': 'is',
  'Jr': 'jr', 'Jeremias': 'jr',
  'Lm': 'lm', 'Lamentações': 'lm',
  'Br': 'br', 'Baruc': 'br',
  'Ez': 'ez', 'Ezequiel': 'ez',
  'Dn': 'dn', 'Daniel': 'dn',
  'Os': 'os', 'Oseias': 'os',
  'Jl': 'jl', 'Joel': 'jl',
  'Am': 'am', 'Amós': 'am',
  'Ab': 'ab', 'Abdias': 'ab',
  'Jn': 'jn', 'Jonas': 'jn',
  'Mq': 'mq', 'Miqueias': 'mq',
  'Na': 'na', 'Naum': 'na',
  'Hab': 'hab', 'Habacuc': 'hab',
  'Sf': 'sf', 'Sofonias': 'sf',
  'Ag': 'ag', 'Ageu': 'ag',
  'Zc': 'zc', 'Zacarias': 'zc',
  'Ml': 'ml', 'Malaquias': 'ml',
  'Mt': 'mt', 'Mateus': 'mt',
  'Mc': 'mc', 'Marcos': 'mc',
  'Lc': 'lc', 'Lucas': 'lc',
  'Jo': 'jo', 'João': 'jo',
  'At': 'at', 'Atos': 'at',
  'Rm': 'rm', 'Romanos': 'rm',
  '1Cor': '1co', '1 Cor': '1co', '1Co': '1co', '1 Co': '1co', '1Coríntios': '1co',
  '2Cor': '2co', '2 Cor': '2co', '2Co': '2co', '2 Co': '2co', '2Coríntios': '2co',
  'Gl': 'gl', 'Gálatas': 'gl',
  'Ef': 'ef', 'Efésios': 'ef',
  'Fl': 'fl', 'Filipenses': 'fl',
  'Cl': 'cl', 'Colossenses': 'cl',
  '1Ts': '1ts', '1 Ts': '1ts', '1Tessalonicenses': '1ts',
  '2Ts': '2ts', '2 Ts': '2ts', '2Tessalonicenses': '2ts',
  '1Tm': '1tm', '1 Tm': '1tm', '1Timóteo': '1tm',
  '2Tm': '2tm', '2 Tm': '2tm', '2Timóteo': '2tm',
  'Tt': 'tt', 'Tito': 'tt',
  'Fm': 'fm', 'Filemon': 'fm', 'Filêmon': 'fm',
  'Hb': 'hb', 'Hebreus': 'hb',
  'Tg': 'tg', 'Tiago': 'tg',
  '1Pd': '1pe', '1 Pd': '1pe', '1Pe': '1pe', '1 Pe': '1pe', '1Pedro': '1pe',
  '2Pd': '2pe', '2 Pd': '2pe', '2Pe': '2pe', '2 Pe': '2pe', '2Pedro': '2pe',
  '1Jo': '1jo', '1 Jo': '1jo', '1João': '1jo',
  '2Jo': '2jo', '2 Jo': '2jo', '2João': '2jo',
  '3Jo': '3jo', '3 Jo': '3jo', '3João': '3jo',
  'Jd': 'jd', 'Judas': 'jd',
  'Ap': 'ap', 'Apocalipse': 'ap',
};

function lookupAbbr(raw: string): string | null {
  const trimmed = raw.trim();
  if (BIBLE_BOOK_MAP[trimmed]) return BIBLE_BOOK_MAP[trimmed];
  for (const [key, val] of Object.entries(BIBLE_BOOK_MAP)) {
    if (key.toLowerCase() === trimmed.toLowerCase()) return val;
  }
  return null;
}

export interface ParsedSegment {
  type: 'text' | 'bibleRef';
  value: string;
  abbr?: string;
  chapter?: number;
  verse?: number;
}

// Full reference pattern: (Book) (Chapter)[, (Verse)[-(EndVerse)]]
const FULL_REF_PATTERN = (bookNames: string[]) => 
  new RegExp(`(?:cf\\.?\\s*)?(${bookNames.join('|')})\\s+(\\d{1,3})(?:[,.:]\\s*(\\d{1,3})(?:\\s*[-–]\\s*\\d{1,3})?)?`, 'g');

// Short reference pattern (only numbers): (Chapter)[, (Verse)[-(EndVerse)]]
const SHORT_REF_PATTERN = new RegExp(`(\\d{1,3})(?:[,.:]\\s*(\\d{1,3})(?:\\s*[-–]\\s*\\d{1,3})?)?`, 'g');

export function parseBibleReferences(text: string): ParsedSegment[] {
  if (!text) return [];
  const bookNames = Object.keys(BIBLE_BOOK_MAP)
    .sort((a, b) => b.length - a.length)
    .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  
  const fullRefPattern = FULL_REF_PATTERN(bookNames);
  const segments: ParsedSegment[] = [];
  
  // First, split by likely delimiters to process parts
  const parts = text.split(/([;]|\band\b|\be\b)/g);
  
  let currentBookAbbr: string | null = null;
  
  parts.forEach(part => {
    if (part === ';' || part === 'and' || part === 'e') {
      segments.push({ type: 'text', value: part });
      return;
    }

    let lastIndex = 0;
    let match: RegExpExecArray | null;
    
    // Try full reference match first in this part
    fullRefPattern.lastIndex = 0;
    while ((match = fullRefPattern.exec(part)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ type: 'text', value: part.slice(lastIndex, match.index) });
      }
      
      const bookRaw = match[1];
      const chapter = parseInt(match[2]);
      const verse = match[3] ? parseInt(match[3]) : undefined;
      const abbr = lookupAbbr(bookRaw);

      if (abbr) {
        currentBookAbbr = abbr;
        segments.push({ type: 'bibleRef', value: match[0], abbr, chapter, verse });
      } else {
        segments.push({ type: 'text', value: match[0] });
      }
      lastIndex = match.index + match[0].length;
    }
    
    // If no full match found but we have a current book, try short match
    if (lastIndex === 0 && currentBookAbbr) {
      const shortPattern = SHORT_REF_PATTERN;
      shortPattern.lastIndex = 0;
      while ((match = shortPattern.exec(part)) !== null) {
        if (match.index > lastIndex) {
          segments.push({ type: 'text', value: part.slice(lastIndex, match.index) });
        }
        
        const chapter = parseInt(match[1]);
        const verse = match[2] ? parseInt(match[2]) : undefined;
        
        segments.push({ type: 'bibleRef', value: match[0], abbr: currentBookAbbr, chapter, verse });
        lastIndex = match.index + match[0].length;
      }
    }

    if (lastIndex < part.length) {
      segments.push({ type: 'text', value: part.slice(lastIndex) });
    }
  });

  return segments.length > 0 ? segments : [{ type: 'text', value: text }];
}
