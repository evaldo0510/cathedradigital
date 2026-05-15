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
    <div className="app-container stack-spacing pb-64">
      {/* CONTINUE JORNADA */}
      <section className="space-y-12">
        <div className="flex items-center gap-10">
          <div className="h-px flex-1 bg-border/30" />
          <h2 className="text-premium-tiny font-bold uppercase tracking-[0.6em] text-primary/30 whitespace-nowrap">
            Memória da Jornada
          </h2>
          <div className="h-px flex-1 bg-border/30" />
        </div>
        
        <HomeCard
          onClick={() => onNavigate(AppRoute.JORNADAS)}
          padding="lg"
          className="flex flex-col md:flex-row items-center justify-between gap-12 group"
        >
          <div className="flex items-center gap-12 text-center md:text-left flex-col md:flex-row">
            <div className="w-20 h-20 rounded-3xl bg-primary/[0.02] border border-border/40 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-700 shadow-inner">
              <Icons.Flame className="w-10 h-10" />
            </div>
            <div>
              <p className="text-premium-tiny font-bold uppercase tracking-widest text-primary/30 mb-4">Seu Próximo Passo</p>
              <h3 className="text-3xl font-bold text-primary tracking-tight">
                {user ? 'Retomar caminhada de fé' : 'Inicie sua caminhada hoje'}
              </h3>
              <p className="mt-4 text-base text-primary/50 max-w-md leading-relaxed">
                {user 
                  ? 'Continue de onde parou e aprofunde seu conhecimento com as trilhas de formação.' 
                  : 'Descubra trilhas personalizadas para sua vida espiritual e comece hoje.'}
              </p>
            </div>
          </div>
          <HomeButton variant="primary" onClick={() => onNavigate(AppRoute.JORNADAS)} className="min-w-[180px]">
            {user ? 'Continuar' : 'Começar'}
          </HomeButton>
        </HomeCard>
      </section>

      {/* RITUAL DO DIA */}
      <section className="space-y-12">
        <div className="flex items-center gap-10">
          <div className="h-px flex-1 bg-border/30" />
          <h2 className="text-premium-tiny font-bold uppercase tracking-[0.5em] text-primary/30 whitespace-nowrap">
            Ritual do Dia
          </h2>
          <div className="h-px flex-1 bg-border/30" />
        </div>
        <div className="max-w-4xl mx-auto w-full">
          <RitualDoDia />
        </div>
      </section>

      {/* TEMAS PRINCIPAIS */}
      <section className="space-y-12">
        <div className="flex items-center gap-10">
          <div className="h-px flex-1 bg-border/30" />
          <h2 className="text-premium-tiny font-bold uppercase tracking-[0.5em] text-primary/30 whitespace-nowrap">
            Temas Principais
          </h2>
          <div className="h-px flex-1 bg-border/30" />
        </div>
        <HomeMainDoors t={t} />
      </section>

      {/* CATECISMO */}
      <section className="space-y-12">
        <div className="flex items-center gap-10">
          <div className="h-px flex-1 bg-border/30" />
          <h2 className="text-premium-tiny font-bold uppercase tracking-[0.5em] text-primary/30 whitespace-nowrap">
            Catecismo
          </h2>
          <div className="h-px flex-1 bg-border/30" />
        </div>
        <HomeCard 
          onClick={() => onNavigate(AppRoute.CATECHISM)}
          padding="xl"
          className="text-center space-y-12 group"
        >
          <div className="w-24 h-24 rounded-3xl bg-secondary/[0.02] border border-secondary/20 flex items-center justify-center text-secondary mx-auto group-hover:rotate-12 transition-transform duration-700">
            <Icons.Catechism className="w-12 h-12" />
          </div>
          <div className="space-y-6">
            <h3 className="text-4xl font-bold text-primary tracking-tight">Catecismo da Igreja</h3>
            <p className="max-w-2xl mx-auto text-lg text-primary/60 leading-relaxed font-serif italic opacity-80">
              "O Catecismo deve apresentar, com fidelidade e de modo orgânico, o ensinamento da Sagrada Escritura, da Tradição viva na Igreja e do Magistério autêntico."
            </p>
          </div>
          <HomeButton variant="outline" className="mx-auto min-w-[220px]">
            Explorar Doutrina
          </HomeButton>
        </HomeCard>
      </section>

      {/* TRILHAS */}
      <section className="space-y-12">
        <div className="flex items-center gap-12">
          <div className="h-px flex-1 bg-border/30" />
          <h2 className="text-premium-tiny font-bold uppercase tracking-[0.6em] text-primary/30 whitespace-nowrap">
            Trilhas de Formação
          </h2>
          <div className="h-px flex-1 bg-border/30" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          <HomeCard padding="md" className="space-y-8 h-full">
            <div className="w-12 h-12 rounded-2xl bg-primary/[0.03] border border-border/40 flex items-center justify-center text-primary">
              <Icons.Star className="w-6 h-6" />
            </div>
            <div className="space-y-3">
              <h4 className="text-xl font-bold text-primary">Fundamentos da Fé</h4>
              <p className="text-primary/50 leading-relaxed">Para quem está iniciando sua jornada espiritual agora.</p>
            </div>
            <HomeButton variant="ghost" className="p-0 h-auto text-primary/60 hover:text-primary transition-all text-premium-tiny group" onClick={() => onNavigate(AppRoute.JORNADAS)}>
              Explorar Trilhas <Icons.ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </HomeButton>
          </HomeCard>
          
          <HomeCard padding="md" className="space-y-8 h-full">
            <div className="w-12 h-12 rounded-2xl bg-secondary/[0.03] border border-secondary/20 flex items-center justify-center text-secondary">
              <Icons.BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-3">
              <h4 className="text-xl font-bold text-primary">Estudo Bíblico</h4>
              <p className="text-primary/50 leading-relaxed">Aprofunde seu conhecimento das Escrituras Sagradas.</p>
            </div>
            <HomeButton variant="ghost" className="p-0 h-auto text-secondary/60 hover:text-secondary transition-all text-premium-tiny group" onClick={() => onNavigate(AppRoute.BIBLE)}>
              Ver Planos <Icons.ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </HomeButton>
          </HomeCard>
        </div>
      </section>

      {/* FOOTER QUOTE */}
      <div className="pt-24 text-center opacity-20 hover:opacity-40 transition-opacity duration-1000">
        <p className="text-sm font-serif italic max-w-sm mx-auto leading-relaxed">
          "A beleza salvará o mundo." — Dostoievski
        </p>
      </div>
    </div>
  );
};

export default HomeMainContent;