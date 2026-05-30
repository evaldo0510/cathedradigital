import { Button } from '@/components/ui/button';
import React from 'react';
import { Icons } from '@/constants';
import { useReadingMode } from '@/hooks/useReadingMode';

const ReadingModeToggle: React.FC = () => {
  const { isNight, toggle } = useReadingMode();

  return (
    <Button
      onClick={toggle}
      className="fixed bottom-4xl right-md lg:bottom-lg lg:right-lg z-50 p-sm rounded-full bg-card border border-border shadow-premium hover:shadow-premium-hover transition-all group"
      title={isNight ? 'Modo diurno' : 'Modo leitura noturna'}
    >
      {isNight ? (
        <Icons.Sun className="w-md h-md text-primary group-hover:scale-110 transition-transform" />
      ) : (
        <Icons.Moon className="w-md h-md text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" />
      )}
    </Button>
  );
};

export default ReadingModeToggle;
