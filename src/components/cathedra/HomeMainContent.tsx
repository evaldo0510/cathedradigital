import React from 'react';
import { AppRoute } from '@/types';
import { Icons } from '@/constants';
import { HomeCard } from './HomeCard';
import { HomeButton } from './HomeButton';
import RitualDoDia from './RitualDoDia';
import { CathedraIcon, IconSizePreset } from './CathedraIcon';

interface HomeMainContentProps {
  user: any;
  profile: any;
  onNavigate: (route: string) => void;
  t: (key: string) => string;
}

const HomeMainContent: React.FC<HomeMainContentProps> = ({ user, profile, onNavigate, t }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-24 md:space-y-32">
      {/* 1. CONTINUE JORNADA */}
      <section className="space-y-12" aria-labelledby="section-jornada">
        <div className="section-divider-header">
          <h2 id="section-jornada" className="heading-section-label whitespace-nowrap">
            Jornada
          </h2>
          <div className="divider-line" />
        </div>
        
        <HomeCard
          onClick={() => onNavigate(AppRoute.JORNADAS)}
          padding="lg"
          className="flex flex-col md:flex-row items-center gap-12 group transition-all duration-1000"
        >
          <div className="w-20 h-20 rounded-premium bg-primary/5 border border-primary/10 flex items-center justify-center text-primary/60 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-700 shrink-0">
            <Icons.Flame className="w-10 h-10" aria-hidden="true" />
          </div>
          <div className="space-y-6 flex-1 text-center md:text-left">
            <div>
              <h3 className="heading-card">
                {user ? 'Retomar sua Jornada' : 'Inicie sua Caminhada'}
              </h3>
              <p className="mt-4 text-base text-primary/40 leading-relaxed max-w-xl mx-auto md:mx-0">
                {user 
                  ? 'Continue sua formação espiritual guiada pela sabedoria milenar.' 
                  : 'Descubra uma trilha personalizada baseada na sua realidade espiritual.'}
              </p>
            </div>
            <HomeButton variant="primary" onClick={() => onNavigate(AppRoute.JORNADAS)} className="w-full md:w-auto px-12" aria-label={user ? 'Continuar sua jornada' : 'Começar nova jornada'}>
              {user ? 'Continuar' : 'Começar'}
            </HomeButton>
          </div>
        </HomeCard>
      </section>

      {/* 2. RITUAL DO DIA */}
      <section className="space-y-12" aria-labelledby="section-hoje">
        <div className="section-divider-header">
          <h2 id="section-hoje" className="heading-section-label whitespace-nowrap">
            Ritual do Dia
          </h2>
          <div className="divider-line" />
        </div>
        <div className="max-w-2xl mx-auto w-full">
          <RitualDoDia />
        </div>
      </section>

      {/* 3. TRILHAS PRINCIPAIS */}
      <section className="space-y-12" aria-labelledby="section-trilhas">
        <div className="section-divider-header">
          <h2 id="section-trilhas" className="heading-section-label whitespace-nowrap">
            Trilhas Principais
          </h2>
          <div className="divider-line" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <HomeCard padding="lg" className="space-y-8 group transition-all duration-1000" onClick={() => onNavigate(AppRoute.TEMAS)}>
            <div className="flex items-center justify-between">
              <CathedraIcon icon={Icons.Star} size={IconSizePreset.TINY} variant="primary" />
              <Icons.ChevronRight className="w-5 h-5 text-primary/10 group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <h4 className="heading-item">Temas da Fé</h4>
              <p className="mt-4 text-sm text-primary/40 leading-relaxed">Aprofunde-se na doutrina e espiritualidade.</p>
            </div>
          </HomeCard>
          
          <HomeCard padding="lg" className="space-y-8 group transition-all duration-1000" onClick={() => onNavigate(AppRoute.BIBLE)}>
            <div className="flex items-center justify-between">
              <CathedraIcon icon={Icons.BookOpen} size={IconSizePreset.TINY} variant="primary" />
              <Icons.ChevronRight className="w-5 h-5 text-primary/10 group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <h4 className="heading-item">Estudo Bíblico</h4>
              <p className="mt-4 text-sm text-primary/40 leading-relaxed">Escrituras através de planos guiados.</p>
            </div>
          </HomeCard>
        </div>
      </section>

      {/* 4. CATECISMO */}
      <section className="space-y-12" aria-labelledby="section-catecismo">
        <div className="section-divider-header">
          <h2 id="section-catecismo" className="heading-section-label whitespace-nowrap">
            Catecismo
          </h2>
          <div className="divider-line" />
        </div>
        
        <HomeCard 
          onClick={() => onNavigate(AppRoute.CATECHISM)}
          padding="lg"
          className="group transition-all duration-1000 bg-primary/[0.01]"
        >
          <div className="flex flex-col md:flex-row gap-12 items-center text-center md:text-left">
            <div className="w-20 h-20 rounded-premium-sm bg-secondary/5 border border-secondary/10 flex items-center justify-center text-secondary group-hover:bg-secondary/10 transition-all duration-700 shrink-0">
              <Icons.Catechism className="w-10 h-10" aria-hidden="true" />
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="heading-card">Doutrina da Igreja</h3>
                <p className="mt-4 text-base text-primary/40 leading-relaxed font-serif italic max-w-xl">
                  "O Catecismo apresenta fielmente o ensinamento da Tradição viva na Igreja."
                </p>
              </div>
              <HomeButton variant="outline" className="w-full md:w-auto px-12" aria-label="Explorar o Catecismo">
                Explorar Catecismo
              </HomeButton>
            </div>
          </div>
        </HomeCard>
      </section>

      {/* 5. LOGOS */}
      <section className="space-y-12" aria-labelledby="section-logos">
        <div className="section-divider-header">
          <h2 id="section-logos" className="heading-section-label whitespace-nowrap">
            Logos
          </h2>
          <div className="divider-line" />
        </div>
        
        <HomeCard 
          padding="lg"
          className="group transition-all duration-1000 border-primary/5 bg-primary/[0.01]"
          onClick={() => {
            const chatBtn = document.querySelector('button[aria-label*="Logos"]') as HTMLButtonElement;
            if (chatBtn) chatBtn.click();
          }}
        >
          <div className="flex flex-col md:flex-row gap-12 items-center text-center md:text-left">
            <div className="w-20 h-20 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/10 transition-all duration-700 shrink-0">
              <Icons.Compass className="w-10 h-10" aria-hidden="true" />
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="heading-card">Mestre Contemplativo</h3>
                <p className="mt-4 text-base text-primary/40 leading-relaxed max-w-xl font-serif italic">
                  "O Verbo se fez carne e habitou entre nós." — Diálogos teológicos para iluminar sua caminhada de fé.
                </p>
              </div>
              <HomeButton variant="outline" className="w-full md:w-auto px-12" aria-label="Dialogar com Logos">
                Dialogar
              </HomeButton>
            </div>
          </div>
        </HomeCard>
      </section>

      {/* FOOTER QUOTE */}
      <div className="pt-24 text-center opacity-10">
        <p className="text-[10px] font-serif italic max-w-xs mx-auto uppercase tracking-widest leading-loose">
          "A beleza salvará o mundo." <br/> — Dostoievski
        </p>
      </div>
    </div>
  );
};

export default HomeMainContent;
