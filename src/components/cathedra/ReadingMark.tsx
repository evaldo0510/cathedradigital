import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/constants';
import { toast } from 'sonner';
import { useReadingMarks } from '@/hooks/useReadingMarks';

interface ReadingMarkProps {
  contentType: 'bible' | 'catechism' | 'magisterium';
  contentId: string;
  label?: string;
  chapter?: number;
  paragraph?: number;
  position?: number;
}

const ReadingMark: React.FC<ReadingMarkProps> = ({ 
  contentType, 
  contentId, 
  label,
  chapter,
  paragraph,
  position
}) => {
  const { marks, addMark, deleteMark } = useReadingMarks();
  const [existingMarkId, setExistingMarkId] = useState<string | null>(null);

  useEffect(() => {
    const found = marks.find(m => m.content_type === contentType && m.content_id === contentId && !m.is_last_read);
    setExistingMarkId(found ? found.id : null);
  }, [marks, contentType, contentId]);

  const toggleMark = async () => {
    if (existingMarkId) {
      await deleteMark(existingMarkId);
      toast.info('Marca de leitura removida');
    } else {
      await addMark({
        content_type: contentType,
        content_id: contentId,
        label: label || contentId,
        chapter,
        paragraph,
        position,
        url: window.location.pathname + window.location.search
      });
      toast.success('Marca de leitura adicionada', {
        description: 'Você pode retornar a este ponto depois.'
      });
    }
  };

  const isMarked = !!existingMarkId;

  return (
    <Button
      onClick={toggleMark}
      variant="ghost"
      size="icon"
      className={`rounded-premium-full transition-all active:scale-95 ${isMarked ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'}`}
      title={isMarked ? "Remover marca de leitura" : "Marcar para ler depois"}
    >
      <Icons.Bookmark className={`w-spacing-md h-spacing-md ${isMarked ? 'fill-current' : ''}`} />
    </Button>
  );
};

export default ReadingMark;