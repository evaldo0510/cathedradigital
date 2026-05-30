import React from 'react';
import { Icons } from '../../constants';
import BibleVersePopover from './BibleVersePopover';
import CatechismPopover from './CatechismPopover';
import MagisteriumPopover from './MagisteriumPopover';

interface BibleRef {
  abbr: string;
  chapter: number;
  verse?: number;
  label: string;
}

interface CrossReferencePanelProps {
  type: 'bible' | 'catechism';
  cicParagraphs?: number[];
  bibleRefs?: BibleRef[];
  documents?: { id: string; name: string; label: string }[];
  onNavigateToCIC?: (paragraph: number) => void;
  onNavigateToBible?: (abbr: string, chapter: number) => void;
  onNavigateToDoc?: (docId: string) => void;
}

const CrossReferencePanel: React.FC<CrossReferencePanelProps> = ({
  type,
  cicParagraphs = [],
  bibleRefs = [],
  documents = [],
  onNavigateToCIC,
  onNavigateToBible,
  onNavigateToDoc,
}) => {
  const hasRefs = (cicParagraphs.length > 0 || bibleRefs.length > 0 || documents.length > 0);
  if (!hasRefs) return null;

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-premium p-md space-y-3">
      <div className="flex items-center gap-xs">
        <div className="w-lg h-lg rounded-premium bg-primary/10 flex items-center justify-center">
          <Icons.Cross className="w-sm h-sm text-primary" />
        </div>
        <span className="text-premium-tiny font-black uppercase tracking-[0.15em] text-primary">
          Nexus Theologicus
        </span>
      </div>

      {type === 'bible' && cicParagraphs.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Parágrafos do Catecismo relacionados:</p>
          <div className="flex flex-wrap gap-2xs">
            {cicParagraphs.map(p => (
              <CatechismPopover
                key={p}
                paragraph={p}
                onNavigate={onNavigateToCIC}
              />
            ))}
          </div>
        </div>
      )}

      {type === 'bible' && documents.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Documentos do Magistério relacionados:</p>
          <div className="flex flex-wrap gap-2xs">
            {documents.map((doc, i) => (
              <MagisteriumPopover
                key={i}
                documentName={doc.name}
                label={doc.label}
                onNavigate={() => onNavigateToDoc?.(doc.id)}
              />
            ))}
          </div>
        </div>
      )}

      {type === 'catechism' && documents.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Documentos do Magistério relacionados:</p>
          <div className="flex flex-wrap gap-2xs">
            {documents.map((doc, i) => (
              <MagisteriumPopover
                key={i}
                documentName={doc.name}
                label={doc.label}
                onNavigate={() => onNavigateToDoc?.(doc.id)}
              />
            ))}
          </div>
        </div>
      )}

      {type === 'catechism' && bibleRefs.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Referências bíblicas:</p>
          <div className="flex flex-wrap gap-2xs">
            {bibleRefs.map((ref, i) => (
              <BibleVersePopover
                key={i}
                abbr={ref.abbr}
                chapter={ref.chapter}
                verse={ref.verse}
                label={ref.label}
                onNavigate={onNavigateToBible}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CrossReferencePanel;
