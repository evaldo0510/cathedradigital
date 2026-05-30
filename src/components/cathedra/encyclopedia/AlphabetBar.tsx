import { Button } from '@/components/ui/button';
import React from 'react';

interface AlphabetBarProps {
  alphabet: string[];
  selectedLetter: string | null;
  letterStatus: Record<string, boolean>;
  onLetterClick: (letter: string) => void;
}

const AlphabetBar: React.FC<AlphabetBarProps> = ({
  alphabet,
  selectedLetter,
  letterStatus,
  onLetterClick,
}) => {
  return (
    <div className="flex justify-center gap-2xs flex-wrap mb-xl px-xs">
      {alphabet.map(letter => {
        const has = letterStatus[letter];
        const isActive = selectedLetter === letter;
        return (
          <Button
            key={letter}
            onClick={() => has && onLetterClick(letter)}
            disabled={!has}
            aria-label={`Letra ${letter}${!has ? ' (sem termos)' : ''}`}
            aria-pressed={isActive}
            className={`w-xl h-xl rounded-full text-xs font-black transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none
              ${isActive
                ? 'bg-primary text-primary-foreground shadow-premium'
                : has
                  ? 'bg-card border border-border text-foreground hover:border-primary/40 hover:text-primary'
                  : 'opacity-15 cursor-not-allowed'
              }`}
          >
            {letter}
          </Button>

        );
      })}
    </div>
  );
};

export default AlphabetBar;
