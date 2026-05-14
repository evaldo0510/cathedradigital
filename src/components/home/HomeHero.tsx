import React, { useMemo, useContext } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LangContext } from '@/contexts/LangContext';
import { Icons } from '@/constants';

const HomeHero: React.FC = () => {
  const { profile } = useAuth();
  const { lang } = useContext(LangContext);

  const hour = new Date().getHours();
  const greeting = useMemo(() => {
    if (hour < 12) return lang === 'pt' ? 'Bom dia' : 'Good morning';
    if (hour < 18) return lang === 'pt' ? 'Boa tarde' : 'Good afternoon';
    return lang === 'pt' ? 'Boa noite' : 'Good evening';
  }, [hour, lang]);

  return (
    <div className="text-center space-y-12 py-10">
      <div className="space-y-6">
        <p className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em] text-primary/60">
          {greeting}, {profile?.name?.split(' ')[0] || 'fiel'}
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-9xl font-serif text-foreground leading-[1] tracking-tight">
          "Nem toda prisão <br /><span className="text-primary italic font-medium">é visível."</span>
        </h1>
      </div>
      
      <div className="flex items-center justify-center gap-4 flex-wrap">
         {(profile?.streak || 0) > 0 && (
          <div className="premium-card p-3 md:p-4 rounded-3xl flex items-center gap-3 backdrop-blur-sm shadow-sm">
            <Icons.Zap className="w-5 h-5 text-primary" />
            <span className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">{profile?.streak} {profile?.streak === 1 ? 'Dia' : 'Dias'}</span>
          </div>
        )}
        <div className="premium-card p-3 md:p-4 rounded-3xl flex items-center gap-3 backdrop-blur-sm shadow-sm">
          <Icons.Star className="w-5 h-5 text-primary" />
          <span className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">{profile?.xp || 0} XP</span>
        </div>
      </div>
    </div>
  );
};

export default HomeHero;