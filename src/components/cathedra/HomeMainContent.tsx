import React, { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';
import { Icons } from '@/constants';
import { HomeCard } from './HomeCard';
import { HomeButton } from './HomeButton';
import RitualDoDia from './RitualDoDia';
import HomeMainDoors from './HomeMainDoors';
import { SectionSkeleton } from './HomeSkeletons';

interface HomeMainContentProps {
  user: any;
  profile: any;
  onNavigate: (route: string) => void;
  t: (key: string) => string;
}

const HomeMainContent: React.FC<HomeMainContentProps> = ({ user, profile, onNavigate, t }) => {
  const navigate = useNavigate();

  return (
    <div className="app-container space-y-32 md:space-y-48 pb-32 md:pb-48">
      {/* CONTINUE JORNADA */}
      <section className="space-y-12">
        <div className="flex items-center gap-10">
          <div className="h-px flex-1 bg-border/40" />
          <h2 className="text-[10px] font-bold uppercase tracking-[0.6em] text-muted-foreground/40 whitespace-nowrap">
            Memória da Jornada
          </h2>
          <div className="h-px flex-1 bg-border/40" />
        </div>
        
        <HomeCard
          onClick={() => onNavigate(AppRoute.JORNADAS)}
          className="p-8 md:p-12 lg:p-14 flex flex-col md:flex-row items-center justify-between gap-10 group"
        >
          <div className="flex items-center gap-8 text-center md:text-left flex-col md:flex-row">
            <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500 shadow-inner">
              <Icons.Flame className="w-8 h-8" />
            </div>
            <div>
              <p className="text-premium-tiny font-bold uppercase tracking-widest text-muted-foreground mb-3">Seu Próximo Passo</p>
              <h3 className="text-foreground">
                {user ? 'Retomar caminhada de fé' : 'Inicie sua caminhada hoje'}
              </h3>
              <p className="mt-3 max-w-md leading-relaxed">
                {user 
                  ? 'Continue de onde parou e aprofunde seu conhecimento.' 
                  : 'Descubra trilhas personalizadas para sua vida espiritual.'}
              </p>
            </div>
          </div>
          <HomeButton variant="primary" onClick={() => onNavigate(AppRoute.JORNADAS)}>
            {user ? 'Continuar' : 'Começar'}
          </HomeButton>
        </HomeCard>
      </section>

      {/* RITUAL DO DIA */}
      <section className="space-y-10">
        <div className="flex items-center gap-6">
          <div className="h-px flex-1 bg-border/40" />
          <h2 className="text-[10px] font-bold uppercase tracking-[0.5em] text-muted-foreground/40 whitespace-nowrap">
            Ritual do Dia
          </h2>
          <div className="h-px flex-1 bg-border/40" />
        </div>
        <div className="max-w-3xl mx-auto w-full">
          <RitualDoDia />
        </div>
      </section>

      {/* TEMAS PRINCIPAIS */}
      <section className="space-y-10">
        <div className="flex items-center gap-6">
          <div className="h-px flex-1 bg-border/40" />
          <h2 className="text-[10px] font-bold uppercase tracking-[0.5em] text-muted-foreground/40 whitespace-nowrap">
            Temas Principais
          </h2>
          <div className="h-px flex-1 bg-border/40" />
        </div>
        <HomeMainDoors t={t} />
      </section>

      {/* CATECISMO */}
      <section className="space-y-10">
        <div className="flex items-center gap-6">
          <div className="h-px flex-1 bg-border/40" />
          <h2 className="text-[10px] font-bold uppercase tracking-[0.5em] text-muted-foreground/40 whitespace-nowrap">
            Catecismo
          </h2>
          <div className="h-px flex-1 bg-border/40" />
        </div>
        <HomeCard 
          onClick={() => onNavigate(AppRoute.CATECHISM)}
          className="p-10 md:p-16 lg:p-20 text-center space-y-10 group"
        >
          <div className="w-20 h-20 rounded-premium-sm bg-secondary/5 flex items-center justify-center text-secondary mx-auto group-hover:rotate-12 transition-transform duration-700">
            <Icons.Catechism className="w-10 h-10" />
          </div>
          <div className="space-y-4">
            <h3 className="text-foreground">Catecismo da Igreja</h3>
            <p className="max-w-xl mx-auto leading-relaxed italic opacity-80">
              "O Catecismo deve apresentar, com fidelidade e de modo orgânico, o ensinamento da Sagrada Escritura, da Tradição viva na Igreja e do Magistério autêntico."
            </p>
          </div>
          <HomeButton variant="outline" className="mx-auto px-10 h-12">
            Explorar Doutrina
          </HomeButton>
        </HomeCard>
      </section>

      {/* TRILHAS */}
      <section className="space-y-12">
        <div className="flex items-center gap-10">
          <div className="h-px flex-1 bg-border/40" />
          <h2 className="text-[10px] font-bold uppercase tracking-[0.6em] text-muted-foreground/40 whitespace-nowrap">
            Trilhas de Formação
          </h2>
          <div className="h-px flex-1 bg-border/40" />
        </div>
        <div className="premium-grid">
          <HomeCard className="p-8 md:p-10 lg:p-12 space-y-6">
            <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
              <Icons.Star className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif">Fundamentos da Fé</h4>
              <p className="mt-2 leading-relaxed">Para quem está iniciando sua jornada espiritual agora.</p>
            </div>
            <HomeButton variant="ghost" className="p-0 h-auto text-primary hover:bg-transparent text-premium-tiny" onClick={() => onNavigate(AppRoute.JORNADAS)}>
              Explorar Trilhas <Icons.ChevronRight className="ml-1 w-3.5 h-3.5" />
            </HomeButton>
          </HomeCard>
          
          <HomeCard className="p-8 md:p-10 lg:p-12 space-y-6">
            <div className="w-10 h-10 rounded-2xl bg-secondary/5 flex items-center justify-center text-secondary">
              <Icons.BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif">Estudo Bíblico</h4>
              <p className="mt-2 leading-relaxed">Aprofunde seu conhecimento das Escrituras Sagradas.</p>
            </div>
            <HomeButton variant="ghost" className="p-0 h-auto text-secondary hover:bg-transparent text-premium-tiny" onClick={() => onNavigate(AppRoute.BIBLE)}>
              Ver Planos <Icons.ChevronRight className="ml-1 w-3.5 h-3.5" />
            </HomeButton>
          </HomeCard>
        </div>
      </section>

      {/* FOOTER QUOTE */}
      <div className="pt-16 text-center opacity-30 select-none">
        <p className="text-xs font-serif italic max-w-sm mx-auto leading-relaxed">
          "A beleza salvará o mundo." — Dostoievski
        </p>
      </div>
    </div>
  );
};

export default HomeMainContent;