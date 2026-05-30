import { Button } from '@/components/ui/button';
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { FaithTerm } from '../AZFaithPage';

interface EncyclopediaTermListProps {
  terms: FaithTerm[];
  selectedTerm: FaithTerm | null;
  onTermClick: (term: FaithTerm) => void;
}

const EncyclopediaTermList: React.FC<EncyclopediaTermListProps> = ({
  terms,
  selectedTerm,
  onTermClick,
}) => {
  return (
    <div className="md:col-span-4 space-y-1 max-h-[60vh] overflow-y-auto pr-xs scrollbar-thin">
      {terms.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-xl italic">Nenhum termo encontrado.</p>
      )}
      {terms.map(t => {
        const isActive = selectedTerm?.term === t.term;
        return (
          <Button
            key={t.term}
            onClick={() => onTermClick(t)}
            aria-pressed={isActive}
            className={`w-full text-left px-md py-sm rounded-full transition-all flex items-center justify-between group focus-visible:ring-2 focus-visible:ring-primary outline-none
              ${isActive
                ? 'bg-primary/10 border border-primary/20 text-foreground'
                : 'hover:bg-muted/50 text-foreground/80'
              }`}
          >

            <span className="font-semibold text-sm truncate">{t.term}</span>
            <ChevronRight className={`w-md h-md shrink-0 transition-transform ${isActive ? 'text-primary rotate-90' : 'text-muted-foreground/40 group-hover:text-muted-foreground'}`} />
          </Button>
        );
      })}
    </div>
  );
};

export default EncyclopediaTermList;
