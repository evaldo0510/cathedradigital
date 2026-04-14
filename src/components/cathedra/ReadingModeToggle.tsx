import React from 'react';
import { Icons } from '@/constants';
import { useReadingMode } from '@/hooks/useReadingMode';

const ReadingModeToggle: React.FC = () => {
  const { isNight, toggle } = useReadingMode();

  return (
    <button
      onClick={toggle}
      className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-50 p-3 rounded-full bg-card border border-border shadow-lg hover:shadow-xl transition-all group"
      title={isNight ? 'Modo diurno' : 'Modo leitura noturna'}
    >
      {isNight ? (
        <Sun className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
      ) : (
        <Moon className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" />
      )}
    </button>
  );
};

export default ReadingModeToggle;
