import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BackToThemeBanner: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const from = searchParams.get('from');
  const tema = searchParams.get('tema');

  if (from !== 'temas' || !tema) return null;

  return (
    <div className="sticky top-0 z-40 -mx-4 px-4 py-2 bg-background/95 backdrop-blur-sm border-b border-border/50 mb-3 sm:mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(`/app/temas?tema=${tema}`)}
        className="rounded-xl h-8 sm:h-9 px-3 text-primary hover:bg-primary/5 font-bold text-[10px] sm:text-xs uppercase tracking-widest gap-1.5"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <Tag className="w-3 h-3" />
        Voltar ao tema: {tema.replace(/-/g, ' ')}
      </Button>
    </div>
  );
};

export default BackToThemeBanner;
