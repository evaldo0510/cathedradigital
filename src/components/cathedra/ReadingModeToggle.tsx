import { Button } from '@/components/cathedra/Button';
import React from 'react';
import { Icons } from '@/constants';
import { useReadingMode } from '@/hooks/useReadingMode';
import { cn } from '@/lib/utils';

const ReadingModeToggle: React.FC = () => {
  const { mode, toggle } = useReadingMode();

  return (
    <Button
      onClick={toggle}
      className="fixed bottom-24 right-4 lg:bottom-12 lg:right-12 z-50 p-4 rounded-full bg-background border border-border shadow-premium hover:shadow-premium-hover transition-all group overflow-hidden"
      title={`Mudar tema de leitura (Atual: ${mode})`}
    >
      <div className="relative w-6 h-6">
        <Icons.Sun className={cn(
          "absolute inset-0 transition-all duration-500",
          mode === 'normal' ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 -rotate-90"
        )} />
        <div className={cn(
          "absolute inset-0 flex items-center justify-center transition-all duration-500",
          mode === 'sepia' ? "opacity-100 scale-100" : "opacity-0 scale-50"
        )}>
          <div className="w-5 h-5 rounded-full bg-[#E5D3B3] border border-[#433422]/20" />
        </div>
        <Icons.Moon className={cn(
          "absolute inset-0 transition-all duration-500",
          mode === 'night' ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 90"
        )} />
      </div>
    </Button>
  );
};

export default ReadingModeToggle;
