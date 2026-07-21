/**
 * ReaderTypographyControl — três presets de conforto de leitura.
 * Persistência via `useReaderTypography` (localStorage).
 */
import React from 'react';
import { Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReaderTypography, type ReaderDensity } from '@/hooks/useReaderTypography';

const ORDER: ReaderDensity[] = ['compact', 'normal', 'large'];

export const ReaderTypographyControl: React.FC = () => {
  const { density, setDensity, presets } = useReaderTypography();

  return (
    <div
      role="radiogroup"
      aria-label="Conforto de leitura"
      className="flex items-center gap-spacing-2xs rounded-premium border border-border bg-card/50 px-spacing-2xs py-spacing-3xs"
    >
      <Type aria-hidden className="w-4 h-4 text-muted-foreground mr-spacing-3xs" />
      {ORDER.map((d) => {
        const active = d === density;
        return (
          <Button
            key={d}
            type="button"
            role="radio"
            aria-checked={active}
            variant={active ? 'pill-active' : 'pill'}
            size="pill"
            onClick={() => setDensity(d)}
            className={active ? 'font-bold' : ''}
          >
            {presets[d].label}
          </Button>
        );
      })}
    </div>
  );
};

export default ReaderTypographyControl;
