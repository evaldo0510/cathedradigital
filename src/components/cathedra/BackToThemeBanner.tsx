import { Icons } from '@/constants';
import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { AppRoute } from '@/types';

const BackToThemeBanner: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const from = searchParams.get('from');
  const tema = searchParams.get('tema');

  if (from !== 'temas' || !tema) return null;

  return (
    <div className="fixed top-spacing-3xl left-0 right-0 z-50 px-spacing-md py-spacing-xs bg-background  border-b border-primary/20 shadow-premium-md animate-in fade-in slide-in-from-top-spacing-xs duration-300 back-to-theme-banner">
      <div className="w-full">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`${AppRoute.TEMAS}/${tema}`)}
          className="rounded-premium-full h-spacing-xl sm:h-spacing-xl px-spacing-sm text-primary hover:bg-primary/5 font-bold text-premium-xs sm:text-premium-xs uppercase tracking-widest gap-spacing-2xs"
        >
          <Icons.ArrowLeft className="w-spacing-sm h-spacing-sm" />
          <Icons.Tag className="w-spacing-sm h-spacing-sm" />
          Voltar ao tema: {tema.replace(/-/g, ' ')}
        </Button>
      </div>
    </div>
  );
};

export default BackToThemeBanner;
