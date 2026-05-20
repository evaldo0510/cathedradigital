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
import { ComingSoonSection } from './ComingSoon';

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
      {/* NÚCLEO PRINCIPAL - ACESSO RÁPIDO */}
      <section className="space-y-16">
        <div className="flex items-center gap-10">
          <div className="h-px flex-1 bg-border/30" />
          <h2 className="text-premium-tiny font-bold uppercase tracking-[0.6em] text-primary/30 whitespace-nowrap">
            Portais da Sabedoria
          </h2>
          <div className="h-px flex-1 bg-border/30" />
        </div>
        
        <HomeMainDoors t={t} />
      </section>

      {/* RITUAL DO DIA - NÚCLEO DE LEITURA/CONTEMPLAÇÃO */}
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

      {/* LOGOS IA INTEGRADA */}
      <section className="space-y-12">
        <div className="flex items-center gap-10">
          <div className="h-px flex-1 bg-border/30" />
          <h2 className="text-premium-tiny font-bold uppercase tracking-[0.5em] text-primary/30 whitespace-nowrap">
            Logos IA
          </h2>
          <div className="h-px flex-1 bg-border/30" />
        </div>
        
        <HomeCard
          onClick={() => onNavigate(AppRoute.BUSCAR)}
          className="p-12 md:p-20 lg:p-24 flex flex-col items-center text-center gap-12 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.01] to-transparent pointer-events-none" />
          
          <div className="relative z-10 w-24 h-24 rounded-3xl bg-primary/[0.03] border border-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-700 shadow-premium">
            <Icons.Search className="w-12 h-12" />
          </div>
          
          <div className="relative z-10 space-y-6 max-w-2xl">
            <h3 className="text-4xl font-display font-medium text-primary tracking-tight">Mestre Contemplativo</h3>
            <p className="text-xl text-primary/60 leading-relaxed font-serif italic">
              "A inteligência a serviço da fé, guiada pela Tradição viva da Igreja."
            </p>
            <p className="text-base text-muted-foreground/60 leading-relaxed max-w-xl mx-auto">
              Aprofunde-se na Palavra, no Catecismo e nos Documentos do Magistério com o auxílio do Logos.
            </p>
          </div>
          
          <HomeButton variant="primary" onClick={() => onNavigate(AppRoute.BUSCAR)} className="min-w-[240px] relative z-10">
            Iniciar Diálogo Espiritual
          </HomeButton>
        </HomeCard>
      </section>

      {/* EM BREVE */}
      <ComingSoonSection className="pt-24" />

      {/* FOOTER QUOTE */}
      <div className="pt-32 text-center opacity-20 hover:opacity-40 transition-opacity duration-1000">
        <p className="text-sm font-serif italic max-w-sm mx-auto leading-relaxed">
          "A beleza salvará o mundo." — Dostoievski
        </p>
      </div>
    </div>
  );
};

export default HomeMainContent;