import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface ShortcutInputProps {
  label: string;
  value: string;
  onChange: (newValue: string) => void;
  reservedKeys?: string[];
}

const RESERVED_KEYS = ['t', 'w', 'n', 'r', 's', 'f', 'l', 'b', 'h', 'd'];

export const ShortcutInput: React.FC<ShortcutInputProps> = ({ label, value, onChange, reservedKeys = RESERVED_KEYS }) => {
  const [currentValue, setCurrentValue] = useState(value);
  const { toast } = useToast();

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    // Only allow single characters/letters
    if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
      const newKey = e.key.toLowerCase();
      
      if (reservedKeys.includes(newKey)) {
        toast({
          title: "Conflito de Atalho",
          description: `A tecla 'Alt + ${newKey.toUpperCase()}' é reservada pelo navegador ou sistema. Por favor, escolha outra.`,
          variant: "destructive",
        });
        return;
      }

      setCurrentValue(newKey);
      onChange(newKey);
    }
  };

  return (
    <div className="flex items-center justify-between gap-spacing-md p-spacing-md rounded-premium-sm bg-primary/[0.02] border border-border/10">
      <div className="space-y-spacing-2xs">
        <p className="text-premium-xs font-bold text-primary">{label}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Alt + tecla</p>
      </div>
      <div className="relative w-spacing-3xl">
        <Input
          value={currentValue.toUpperCase()}
          onKeyDown={handleKeyDown}
          readOnly
          className="text-center font-bold text-primary h-spacing-xl rounded-premium-lg border-primary/20 bg-background focus:ring-1 focus:ring-primary/20"
        />
      </div>
    </div>
  );
};
