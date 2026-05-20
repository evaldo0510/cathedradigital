import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/constants';
import { toast } from 'sonner';

interface ReadingMarkProps {
  contentType: 'bible' | 'catechism' | 'magisterium';
  contentId: string;
  label?: string;
}

const ReadingMark: React.FC<ReadingMarkProps> = ({ contentType, contentId, label }) => {
  const [isMarked, setIsMarked] = useState(false);
  const STORAGE_KEY = 'cathedra_reading_marks';

  useEffect(() => {
    const marks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const key = `${contentType}:${contentId}`;
    setIsMarked(!!marks[key]);
  }, [contentType, contentId]);

  const toggleMark = () => {
    const marks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const key = `${contentType}:${contentId}`;
    
    if (isMarked) {
      delete marks[key];
      toast.info('Marca de leitura removida');
    } else {
      marks[key] = {
        label: label || contentId,
        timestamp: new Date().toISOString(),
        url: window.location.pathname + window.location.search
      };
      toast.success('Marca de leitura adicionada', {
        description: 'Você pode retornar a este ponto depois.'
      });
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(marks));
    setIsMarked(!isMarked);
  };

  return (
    <Button
      onClick={toggleMark}
      variant="ghost"
      size="icon"
      className={`rounded-full transition-all active:scale-95 ${isMarked ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'}`}
      title={isMarked ? "Remover marca de leitura" : "Marcar para ler depois"}
    >
      <Icons.Bookmark className={`w-4 h-4 ${isMarked ? 'fill-current' : ''}`} />
    </Button>
  );
};

export default ReadingMark;