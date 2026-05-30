import { Button } from '@/components/ui/button';
import React from 'react';
import { Icons } from '@/constants';
import { useReadingMode } from '@/hooks/useReadingMode';

const ReadingModeToggle: React.FC = () => {
  const { isNight, toggle } = useReadingMode();

  return (
    <Button
      onClick={toggle}
      className="fixed bottom-spacing-4xl right-spacing-md lg:bottom-spacing-lg lg:right-spacing-lg z-50 p-spacing-sm rounded-premium-full bg-card border border-border shadow-premium hover:shadow-premium-hover transition-all group"
      title={isNight ? 'Modo diurno' : 'Modo leitura noturna'}
    >
      {isNight ? (
        <Icons.Sun className="w-spacing-md h-spacing-md text-primary group-hover:scale-110 transition-transform" />
      ) : (
        <Icons.Moon className="w-spacing-md h-spacing-md text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" />
      )}
    </Button>
  );
};

export default ReadingModeToggle;
