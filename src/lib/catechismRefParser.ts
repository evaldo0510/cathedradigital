// Parses Catechism references like CIC §1324, CIC§1324, CIC 1324, §1324, CIC §§1324-1327
// Returns segments of text and catechism references

export interface CatechismSegment {
  type: 'text' | 'catechismRef';
  value: string;
  paragraph?: number;
}

// Pattern matches: CIC §1324, CIC§1324, CIC 1324, §1324, CIC §§1324
const CIC_PATTERN = /(?:CIC\s*§§?\s*(\d{1,4})(?:\s*[-–]\s*\d{1,4})?|§(\d{1,4})(?:\s*[-–]\s*\d{1,4})?)/g;

export function parseCatechismReferences(text: string): CatechismSegment[] {
  CIC_PATTERN.lastIndex = 0;
  const segments: CatechismSegment[] = [];
  let lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = CIC_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    const paragraph = parseInt(match[1] || match[2]);
    if (paragraph >= 1 && paragraph <= 2865) {
      segments.push({ type: 'catechismRef', value: match[0], paragraph });
    } else {
      segments.push({ type: 'text', value: match[0] });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: 'text', value: text }];
}
