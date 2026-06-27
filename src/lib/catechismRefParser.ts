// Parses Catechism references like CIC §1324, CIC§1324, CIC 1324, §1324, CIC §§1324-1327
// Also handles comma-separated lists: §1324, 1325, 1327 or CIC §1324, §1325
// Returns segments of text and catechism references

export interface CatechismSegment {
  type: 'text' | 'catechismRef';
  value: string;
  paragraph?: number;
}

// Matches a single CIC/§ reference optionally followed by comma-separated numbers/§numbers
// e.g. "CIC §1324, 1325, §1327" or "§1324, 1325" or "CIC §§1324-1327, 1330"
const CIC_BLOCK_PATTERN = /(?:CIC\s*§§?\s*|§§?\s*)(\d{1,4})(?:\s*[-–]\s*\d{1,4})?(?:\s*[,;]\s*§?\s*(\d{1,4})(?:\s*[-–]\s*\d{1,4})?)*/g;

export function parseCatechismReferences(text: string): CatechismSegment[] {
  if (!text) return [];
  CIC_BLOCK_PATTERN.lastIndex = 0;
  const segments: CatechismSegment[] = [];
  let lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = CIC_BLOCK_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }

    // Extract ALL paragraph numbers from the matched block
    const block = match[0];
    const numberMatches = block.matchAll(/(\d{1,4})/g);
    const paragraphs: number[] = [];
    for (const nm of numberMatches) {
      const num = parseInt(nm[1]);
      if (num >= 1 && num <= 2865) {
        paragraphs.push(num);
      }
    }

    if (paragraphs.length > 0) {
      // Emit each paragraph as a separate catechismRef segment with separators as text
      // Re-parse the block to preserve original formatting
      let blockLastIndex = 0;
      const numPattern = /(\d{1,4})/g;
      let numMatch: RegExpExecArray | null;
      while ((numMatch = numPattern.exec(block)) !== null) {
        const num = parseInt(numMatch[1]);
        if (num < 1 || num > 2865) {
          // Not a valid paragraph, treat as text
          continue;
        }
        // Text before this number (prefix/separator). Strip trailing §/§§ + spaces
        // because the popover label already includes the § prefix — otherwise we'd
        // render "§§2053" or "CIC §§2053".
        if (numMatch.index > blockLastIndex) {
          const rawPrefix = block.slice(blockLastIndex, numMatch.index);
          const cleanedPrefix = rawPrefix.replace(/§+\s*$/u, '');
          if (cleanedPrefix.length > 0) {
            segments.push({ type: 'text', value: cleanedPrefix });
          }
        }
        segments.push({ type: 'catechismRef', value: `§${num}`, paragraph: num });
        blockLastIndex = numMatch.index + numMatch[0].length;
      }
      // Trailing text in block
      if (blockLastIndex < block.length) {
        segments.push({ type: 'text', value: block.slice(blockLastIndex) });
      }
    } else {
      segments.push({ type: 'text', value: block });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: 'text', value: text }];
}
