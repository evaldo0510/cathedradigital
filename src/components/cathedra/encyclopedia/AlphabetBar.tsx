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
    <div className="flex justify-center gap-1.5 flex-wrap mb-8 px-2">
      {alphabet.map(letter => {
        const has = letterStatus[letter];
        const isActive = selectedLetter === letter;
        return (
          <button
            key={letter}
            onClick={() => has && onLetterClick(letter)}
            disabled={!has}
            aria-label={`Letra ${letter}${!has ? ' (sem termos)' : ''}`}
            aria-pressed={isActive}
            className={`w-8 h-8 rounded-lg text-xs font-black transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none
              ${isActive
                ? 'bg-primary text-primary-foreground shadow-md'
                : has
                  ? 'bg-card border border-border text-foreground hover:border-primary/40 hover:text-primary'
                  : 'opacity-15 cursor-not-allowed'
              }`}
          >
            {letter}
          </button>

        );
      })}
    </div>
  );
};

export default AlphabetBar;
