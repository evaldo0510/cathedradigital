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

const SectionHeader = ({ label }: { label: string }) => (
  <div className="flex items-center gap-6">
    <h2 className="text-premium-small heading-section-label">
      {label}
    </h2>
    <div className="h-px flex-1 bg-primary/5" />
  </div>
);

const HomeMainContent: React.FC<HomeMainContentProps> = ({ user, profile, onNavigate, t }) => {
  const openLogosChat = () => {
    const chatBtn = document.querySelector('button[aria-label*="Logos"]') as HTMLButtonElement;
    if (chatBtn) chatBtn.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-16 md:space-y-24 py-12 md:py-20 px-6 md:px-0">
      {/* 2. CONTINUAR JORNADA */}
      <section className="space-y-6">
        <SectionHeader label={user ? "Retomar Jornada" : "Iniciar Jornada"} />
        <HomeCard
          onClick={() => onNavigate(AppRoute.JORNADAS)}
          padding="md"
          className="group border-primary/5 bg-primary/[0.01]"
        >
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/[0.02] border border-primary/5 flex items-center justify-center text-secondary group-hover:scale-105 transition-transform duration-700">
                <Icons.Flame className="w-6 h-6" />
              </div>
              <div>
                <h3 className="heading-card">
                  {user ? 'Continuar Caminhada' : 'Inicie sua Jornada'}
                </h3>
                <p className="text-sm text-primary/40 mt-1">
                  {user 
                    ? 'Retome sua formação espiritual de onde parou.' 
                    : 'Descubra uma trilha personalizada para sua alma.'}
                </p>
              </div>
            </div>
            <HomeButton variant="primary" size="sm" onClick={() => onNavigate(AppRoute.JORNADAS)} className="hidden md:flex">
              {user ? 'Continuar' : 'Começar'}
            </HomeButton>
            <Icons.ChevronRight className="w-5 h-5 text-primary/10 group-hover:translate-x-1 transition-all md:hidden" />
          </div>
        </HomeCard>
      </section>

      {/* 3. RITUAL DO DIA */}
      <section className="space-y-6">
        <SectionHeader label="Ritual do Dia" />
        <RitualDoDia />
      </section>

      {/* 4. TRILHAS PRINCIPAIS */}
      <section className="space-y-6">
        <SectionHeader label="Trilhas Principais" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <HomeCard padding="sm" className="group border-primary/5" onClick={() => onNavigate(AppRoute.TEMAS)}>
            <div className="flex items-center gap-5">
              <CathedraIcon icon={Icons.Star} size={IconSizePreset.TINY} variant="primary" />
              <div>
                <h4 className="text-sm font-bold text-primary uppercase tracking-widest heading-item">Temas da Fé</h4>
                <p className="text-[10px] text-primary/30 uppercase tracking-widest mt-1 text-premium-body">Doutrina e Vida</p>
              </div>
            </div>
          </HomeCard>
          
          <HomeCard padding="sm" className="group border-primary/5" onClick={() => onNavigate(AppRoute.BIBLE)}>
            <div className="flex items-center gap-5">
              <CathedraIcon icon={Icons.BookOpen} size={IconSizePreset.TINY} variant="primary" />
              <div>
                <h4 className="text-sm font-bold text-primary uppercase tracking-widest heading-item">Estudo Bíblico</h4>
                <p className="text-[10px] text-primary/30 uppercase tracking-widest mt-1 text-premium-body">Sagradas Escrituras</p>
              </div>
            </div>
          </HomeCard>
        </div>
      </section>

      {/* 5. CATECISMO */}
      <section className="space-y-6">
        <SectionHeader label="Catecismo" />
        <HomeCard 
          onClick={() => onNavigate(AppRoute.CATECHISM)}
          padding="md"
          className="group border-primary/5 bg-primary/[0.01]"
        >
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/[0.02] border border-primary/5 flex items-center justify-center text-secondary group-hover:rotate-6 transition-transform duration-700">
                <Icons.Catechism className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary tracking-tight heading-card">Doutrina da Igreja</h3>
                <p className="text-sm text-primary/40 mt-1 text-premium-body">"O ensinamento da Tradição viva na Igreja."</p>
              </div>
            </div>
            <Icons.ChevronRight className="w-5 h-5 text-primary/10 group-hover:translate-x-1 transition-all" />
          </div>
        </HomeCard>
      </section>

      {/* 6. LOGOS */}
      <section className="space-y-6">
        <SectionHeader label="Logos" />
        <HomeCard 
          padding="md"
          className="group border-primary/5 bg-primary/[0.01]"
          onClick={openLogosChat}
        >
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 rounded-full bg-primary/[0.02] border border-primary/5 flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-700">
                <Icons.Compass className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary tracking-tight heading-card">Mestre Contemplativo</h3>
                <p className="text-sm text-primary/40 mt-1 text-premium-body">Diálogos teológicos para iluminar sua caminhada.</p>
              </div>
            </div>
            <Icons.Sparkles className="w-4 h-4 text-primary/10 group-hover:text-primary/30 transition-all" />
          </div>
        </HomeCard>
      </section>

      {/* FOOTER QUOTE */}
      <div className="pt-24 pb-12 text-center opacity-5">
        <p className="text-[9px] font-serif italic max-w-sm mx-auto leading-relaxed tracking-[0.2em] uppercase text-premium-body">
          "A beleza salvará o mundo." <br/> — Dostoievski
        </p>
      </div>
    </div>
  );
};

export default HomeMainContent;
