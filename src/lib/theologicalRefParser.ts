// Unified parser that detects both Bible and Catechism references in text

import { parseBibleReferences, type ParsedSegment } from './bibleRefParser';
import { parseCatechismReferences, type CatechismSegment } from './catechismRefParser';

export interface TheologicalSegment {
  type: 'text' | 'bibleRef' | 'catechismRef';
  value: string;
  // Bible fields
  abbr?: string;
  chapter?: number;
  verse?: number;
  // Catechism fields
  paragraph?: number;
}

export function parseTheologicalReferences(text: string): TheologicalSegment[] {
  if (!text) return [{ type: 'text', value: '' }];
  // First pass: parse catechism references
  const catechismSegments = parseCatechismReferences(text);
  
  // Second pass: parse bible references within text segments
  const result: TheologicalSegment[] = [];
  
  for (const seg of catechismSegments) {
    if (seg.type === 'catechismRef') {
      result.push({ type: 'catechismRef', value: seg.value, paragraph: seg.paragraph });
    } else {
      // Parse bible references within this text segment
      const bibleSegments = parseBibleReferences(seg.value);
      for (const bSeg of bibleSegments) {
        if (bSeg.type === 'bibleRef') {
          result.push({ type: 'bibleRef', value: bSeg.value, abbr: bSeg.abbr, chapter: bSeg.chapter, verse: bSeg.verse });
        } else {
          result.push({ type: 'text', value: bSeg.value });
        }
      }
    }
  }

  return result.length > 0 ? result : [{ type: 'text', value: text }];
}
