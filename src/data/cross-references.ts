// Bible ↔ Catechism cross-reference map
// Maps Bible book abbreviation + chapter to relevant CIC paragraphs
// and CIC paragraphs to relevant Bible references

export interface CrossRef {
  cicParagraphs?: number[];
  bibleRefs?: { abbr: string; chapter: number; verse?: number; label: string }[];
}

// Bible → Catechism (book:chapter → CIC paragraphs)
export const BIBLE_TO_CIC: Record<string, number[]> = {
  'Gn:1': [290, 355, 385],
  'Gn:2': [355, 371, 373],
  'Gn:3': [385, 389, 396, 397, 399],
  'Gn:12': [59, 145],
  'Gn:15': [145, 146],
  'Gn:22': [145, 2572],
  'Ex:3': [205, 207],
  'Ex:12': [1334, 1340],
  'Ex:19': [63, 751],
  'Ex:20': [2083, 2084],
  'Sl:23': [2803],
  'Sl:51': [1422, 1431],
  'Sl:104': [290, 295],
  'Sl:130': [2559],
  'Is:7': [497],
  'Is:9': [712],
  'Is:53': [571, 601, 615],
  'Jr:31': [64, 715],
  'Mt:1': [422, 456, 497],
  'Mt:3': [1213, 1223],
  'Mt:5': [1716, 1720, 1724],
  'Mt:6': [2759, 2761, 2803],
  'Mt:16': [424, 440, 552],
  'Mt:22': [2083, 2196],
  'Mt:26': [1322, 1337, 1339],
  'Mt:28': [2, 849, 1213],
  'Mc:1': [1213, 1223],
  'Mc:10': [1601, 1614],
  'Mc:14': [1322, 1337],
  'Lc:1': [146, 148, 484, 490],
  'Lc:2': [512, 525, 529],
  'Lc:11': [2759, 2761],
  'Lc:15': [1422, 1443, 1846],
  'Lc:22': [1322, 1337],
  'Lc:23': [571, 595, 601],
  'Lc:24': [638, 645, 659],
  'Jo:1': [65, 241, 423, 456],
  'Jo:3': [1213, 1257],
  'Jo:6': [1322, 1324, 1373],
  'Jo:14': [683, 687, 729],
  'Jo:15': [1108, 1823],
  'Jo:17': [811, 820],
  'Jo:19': [571, 595, 601, 616],
  'Jo:20': [638, 645, 1422, 1441],
  'At:2': [731, 1287, 2623],
  'Rm:3': [1996],
  'Rm:5': [385, 388, 402],
  'Rm:6': [1213, 1227],
  'Rm:8': [683, 693, 2559],
  '1Cor:10': [1322, 1331, 1334],
  '1Cor:11': [1322, 1329, 1356],
  '1Cor:12': [683, 791, 799],
  '1Cor:13': [1823, 1826],
  '2Cor:5': [1468, 1999],
  'Gl:4': [422, 683],
  'Ef:1': [1, 52],
  'Ef:4': [631, 791],
  'Ef:5': [1601, 1616],
  'Fl:2': [456, 461],
  'Fl:3': [131, 133, 2653],
  'Cl:1': [291, 331],
  '1Tm:6': [52],
  'Hb:1': [65, 102],
  'Hb:9': [571, 1085],
  'Hb:11': [145, 146, 147],
  'Tg:5': [1499, 1510],
  '1Pd:2': [1141, 1268],
  '1Jo:4': [214, 231, 1604],
  'Ap:1': [198],
  'Ap:21': [677, 1044, 1045],
  'Ap:22': [1130, 2853],
};

// Catechism → Bible (CIC paragraph → Bible references)
export const CIC_TO_BIBLE: Record<number, { abbr: string; chapter: number; verse?: number; label: string }[]> = {
  1: [{ abbr: 'Ef', chapter: 1, label: 'Ef 1' }],
  2: [{ abbr: 'Mt', chapter: 28, verse: 19, label: 'Mt 28,19-20' }],
  52: [{ abbr: '1Tm', chapter: 6, verse: 16, label: '1Tm 6,16' }],
  59: [{ abbr: 'Gn', chapter: 12, verse: 1, label: 'Gn 12,1' }],
  65: [{ abbr: 'Jo', chapter: 1, label: 'Jo 1' }, { abbr: 'Hb', chapter: 1, label: 'Hb 1' }],
  145: [{ abbr: 'Gn', chapter: 12, label: 'Gn 12' }, { abbr: 'Hb', chapter: 11, label: 'Hb 11' }],
  146: [{ abbr: 'Lc', chapter: 1, verse: 37, label: 'Lc 1,37' }],
  290: [{ abbr: 'Gn', chapter: 1, verse: 1, label: 'Gn 1,1' }],
  355: [{ abbr: 'Gn', chapter: 1, verse: 27, label: 'Gn 1,27' }],
  385: [{ abbr: 'Rm', chapter: 5, label: 'Rm 5' }],
  422: [{ abbr: 'Gl', chapter: 4, verse: 4, label: 'Gl 4,4-5' }, { abbr: 'Mt', chapter: 1, label: 'Mt 1' }],
  456: [{ abbr: 'Jo', chapter: 1, label: 'Jo 1' }, { abbr: 'Fl', chapter: 2, label: 'Fl 2' }],
  571: [{ abbr: 'Is', chapter: 53, label: 'Is 53' }, { abbr: 'Jo', chapter: 19, label: 'Jo 19' }],
  638: [{ abbr: 'At', chapter: 13, verse: 32, label: 'At 13,32-33' }, { abbr: 'Lc', chapter: 24, label: 'Lc 24' }],
  683: [{ abbr: '1Cor', chapter: 12, verse: 3, label: '1Cor 12,3' }, { abbr: 'Gl', chapter: 4, verse: 6, label: 'Gl 4,6' }],
  731: [{ abbr: 'At', chapter: 2, verse: 1, label: 'At 2,1' }],
  1213: [{ abbr: 'Mt', chapter: 28, verse: 19, label: 'Mt 28,19' }, { abbr: 'Jo', chapter: 3, label: 'Jo 3' }],
  1322: [{ abbr: 'Mt', chapter: 26, label: 'Mt 26' }, { abbr: '1Cor', chapter: 11, label: '1Cor 11' }],
  1324: [{ abbr: 'Jo', chapter: 6, label: 'Jo 6' }],
  1422: [{ abbr: 'Jo', chapter: 20, label: 'Jo 20' }, { abbr: 'Sl', chapter: 51, label: 'Sl 51' }],
  1601: [{ abbr: 'Gn', chapter: 2, label: 'Gn 2' }, { abbr: 'Ef', chapter: 5, label: 'Ef 5' }],
  1846: [{ abbr: 'Mt', chapter: 1, verse: 21, label: 'Mt 1,21' }],
  1996: [{ abbr: 'Rm', chapter: 3, label: 'Rm 3' }],
  2083: [{ abbr: 'Mt', chapter: 22, verse: 37, label: 'Mt 22,37' }],
  2559: [{ abbr: 'Sl', chapter: 130, verse: 1, label: 'Sl 130,1' }],
  2759: [{ abbr: 'Lc', chapter: 11, verse: 1, label: 'Lc 11,1' }],
  2761: [{ abbr: 'Jo', chapter: 16, verse: 24, label: 'Jo 16,24' }],
  2865: [{ abbr: 'Mt', chapter: 6, label: 'Mt 6' }],
};

export function getBibleCrossRefs(bookAbbr: string, chapter: number): number[] {
  return BIBLE_TO_CIC[`${bookAbbr}:${chapter}`] || [];
}

export function getCatechismCrossRefs(paragraph: number): { abbr: string; chapter: number; verse?: number; label: string }[] {
  return CIC_TO_BIBLE[paragraph] || [];
}
