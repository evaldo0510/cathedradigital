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
    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/20 whitespace-nowrap">
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
    <div className="max-w-3xl mx-auto space-y-24 md:space-y-32 py-16 md:py-24 px-4 md:px-0">
      {/* 2. CONTINUAR JORNADA */}
      <section className="space-y-10">
        <SectionHeader label={user ? "Retomar Jornada" : "Iniciar Jornada"} />
        <HomeCard
          onClick={() => onNavigate(AppRoute.JORNADAS)}
          padding="none"
          className="group border-primary/5 bg-primary/[0.01] p-8 md:p-10"
        >
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-8">
              <div className="w-14 h-14 rounded-premium-sm bg-primary/[0.02] border border-primary/5 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform duration-700">
                <Icons.Flame className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-primary tracking-tight">
                  {user ? 'Continuar Caminhada' : 'Inicie sua Jornada'}
                </h3>
                <p className="text-sm text-primary/40 mt-1">
                  {user 
                    ? 'Retome sua formação espiritual de onde parou.' 
                    : 'Descubra uma trilha personalizada para sua alma.'}
                </p>
              </div>
            </div>
            <HomeButton variant="primary" onClick={() => onNavigate(AppRoute.JORNADAS)} className="hidden md:flex">
              {user ? 'Continuar' : 'Começar'}
            </HomeButton>
            <Icons.ChevronRight className="w-6 h-6 text-primary/10 group-hover:translate-x-1 transition-all md:hidden" />
          </div>
        </HomeCard>
      </section>

      {/* 3. RITUAL DO DIA */}
      <section className="space-y-10">
        <SectionHeader label="Ritual do Dia" />
        <RitualDoDia />
      </section>

      {/* 4. TRILHAS PRINCIPAIS */}
      <section className="space-y-10">
        <SectionHeader label="Trilhas Principais" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <HomeCard padding="md" className="group border-primary/5" onClick={() => onNavigate(AppRoute.TEMAS)}>
            <div className="flex items-center gap-6">
              <CathedraIcon icon={Icons.Star} size={IconSizePreset.TINY} variant="primary" />
              <div>
                <h4 className="text-sm font-bold text-primary uppercase tracking-widest">Temas da Fé</h4>
                <p className="text-[10px] text-primary/30 uppercase tracking-widest mt-1">Doutrina e Vida</p>
              </div>
            </div>
          </HomeCard>
          
          <HomeCard padding="md" className="group border-primary/5" onClick={() => onNavigate(AppRoute.BIBLE)}>
            <div className="flex items-center gap-6">
              <CathedraIcon icon={Icons.BookOpen} size={IconSizePreset.TINY} variant="primary" />
              <div>
                <h4 className="text-sm font-bold text-primary uppercase tracking-widest">Estudo Bíblico</h4>
                <p className="text-[10px] text-primary/30 uppercase tracking-widest mt-1">Sagradas Escrituras</p>
              </div>
            </div>
          </HomeCard>
        </div>
      </section>

      {/* 5. CATECISMO */}
      <section className="space-y-10">
        <SectionHeader label="Catecismo" />
        <HomeCard 
          onClick={() => onNavigate(AppRoute.CATECHISM)}
          padding="none"
          className="group border-primary/5 bg-primary/[0.01] p-8 md:p-10"
        >
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-8">
              <div className="w-14 h-14 rounded-premium-sm bg-primary/[0.02] border border-primary/5 flex items-center justify-center text-secondary group-hover:rotate-12 transition-transform duration-700">
                <Icons.Catechism className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-primary tracking-tight">Doutrina da Igreja</h3>
                <p className="text-sm text-primary/40 mt-1">"O ensinamento da Tradição viva na Igreja."</p>
              </div>
            </div>
            <Icons.ChevronRight className="w-6 h-6 text-primary/10 group-hover:translate-x-1 transition-all" />
          </div>
        </HomeCard>
      </section>

      {/* 6. LOGOS */}
      <section className="space-y-10">
        <SectionHeader label="Logos" />
        <HomeCard 
          padding="none"
          className="group border-primary/5 bg-primary/[0.01] p-8 md:p-10"
          onClick={openLogosChat}
        >
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-8">
              <div className="w-14 h-14 rounded-full bg-primary/[0.02] border border-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-700">
                <Icons.Compass className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-primary tracking-tight">Mestre Contemplativo</h3>
                <p className="text-sm text-primary/40 mt-1">Diálogos teológicos para iluminar sua caminhada.</p>
              </div>
            </div>
            <Icons.Sparkles className="w-5 h-5 text-primary/10 group-hover:text-primary/30 transition-all" />
          </div>
        </HomeCard>
      </section>

      {/* FOOTER QUOTE */}
      <div className="pt-32 text-center opacity-10">
        <p className="text-[10px] font-serif italic max-w-sm mx-auto leading-relaxed tracking-[0.2em] uppercase">
          "A beleza salvará o mundo." <br/> — Dostoievski
        </p>
      </div>
    </div>
  );
};

export default HomeMainContent;
