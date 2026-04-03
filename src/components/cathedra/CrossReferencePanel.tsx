import React from 'react';
import { Icons } from '../../constants';

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
  onNavigateToCIC?: (paragraph: number) => void;
  onNavigateToBible?: (abbr: string, chapter: number) => void;
}

const CrossReferencePanel: React.FC<CrossReferencePanelProps> = ({
  type,
  cicParagraphs = [],
  bibleRefs = [],
  onNavigateToCIC,
  onNavigateToBible,
}) => {
  const hasRefs = type === 'bible' ? cicParagraphs.length > 0 : bibleRefs.length > 0;
  if (!hasRefs) return null;

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
          <Icons.Cross className="w-3 h-3 text-primary" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-primary">
          Nexus Theologicus
        </span>
      </div>

      {type === 'bible' && cicParagraphs.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Parágrafos do Catecismo relacionados:</p>
          <div className="flex flex-wrap gap-1.5">
            {cicParagraphs.map(p => (
              <button
                key={p}
                onClick={() => onNavigateToCIC?.(p)}
                className="px-2.5 py-1 rounded-lg bg-card border border-border text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-all"
              >
                §{p}
              </button>
            ))}
          </div>
        </div>
      )}

      {type === 'catechism' && bibleRefs.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Referências bíblicas:</p>
          <div className="flex flex-wrap gap-1.5">
            {bibleRefs.map((ref, i) => (
              <button
                key={i}
                onClick={() => onNavigateToBible?.(ref.abbr, ref.chapter)}
                className="px-2.5 py-1 rounded-lg bg-card border border-border text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-all"
              >
                {ref.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CrossReferencePanel;
