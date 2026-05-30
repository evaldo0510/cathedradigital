import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppRoute } from '@/types';

const BackToThemeBanner: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const from = searchParams.get('from');
  const tema = searchParams.get('tema');

  if (from !== 'temas' || !tema) return null;

  return (
    <div className="fixed top-3xl left-0 right-0 z-50 px-md py-xs bg-background  border-b border-primary/20 shadow-md animate-in fade-in slide-in-from-top-xs duration-300 back-to-theme-banner">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`${AppRoute.TEMAS}/${tema}`)}
          className="rounded-full h-xl sm:h-xl px-sm text-primary hover:bg-primary/5 font-bold text-xs sm:text-xs uppercase tracking-widest gap-2xs"
        >
          <ArrowLeft className="w-sm h-sm" />
          <Tag className="w-sm h-sm" />
          Voltar ao tema: {tema.replace(/-/g, ' ')}
        </Button>
      </div>
    </div>
  );
};

export default BackToThemeBanner;
