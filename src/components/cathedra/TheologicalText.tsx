import React from 'react';
import { useNavigate } from 'react-router-dom';
import { parseTheologicalReferences } from '@/lib/theologicalRefParser';
import BibleVersePopover from './BibleVersePopover';
import CatechismPopover from './CatechismPopover';

interface TheologicalTextProps {
  text: string;
  className?: string;
}

/**
 * Renderiza um texto livre transformando referências bíblicas (Jo 3,16) e
 * do catecismo (§2053) em bolhas interativas (popovers).
 */
const TheologicalText: React.FC<TheologicalTextProps> = ({ text, className }) => {
  const navigate = useNavigate();
  if (!text) return null;

  const segments = parseTheologicalReferences(text);

  const handleNavigateToBible = (abbr: string, chapter: number, verse?: number) => {
    const params = new URLSearchParams({ book: abbr, chapter: String(chapter) });
    if (verse) params.set('verse', String(verse));
    navigate(`/bible?${params.toString()}`);
  };

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.type === 'bibleRef' && seg.abbr && seg.chapter) {
          return (
            <BibleVersePopover
              key={i}
              abbr={seg.abbr}
              chapter={seg.chapter}
              verse={seg.verse}
              label={seg.value}
              onNavigate={handleNavigateToBible}
            />
          );
        }
        if (seg.type === 'catechismRef' && seg.paragraph) {
          return <CatechismPopover key={i} paragraph={seg.paragraph} />;
        }
        return <React.Fragment key={i}>{seg.value}</React.Fragment>;
      })}
    </span>
  );
};

export default TheologicalText;
