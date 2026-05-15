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
    <div className="w-full space-y-24 md:space-y-40">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-start">
        {/* CONTINUE JORNADA */}
        <section className="space-y-8">
          <div className="flex items-center gap-6">
            <h2 className="text-premium-tiny font-bold uppercase tracking-[0.4em] text-primary/30 whitespace-nowrap">
              Jornada
            </h2>
            <div className="h-px flex-1 bg-border/20" />
          </div>
          
          <HomeCard
            onClick={() => onNavigate(AppRoute.JORNADAS)}
            padding="md"
            className="flex flex-col justify-between gap-8 group"
          >
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-premium-sm bg-primary/[0.02] border border-border/40 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-700">
                <Icons.Flame className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-primary tracking-tight">
                  {user ? 'Retomar Jornada' : 'Inicie sua Caminhada'}
                </h3>
                <p className="mt-3 text-sm text-primary/50 leading-relaxed">
                  {user 
                    ? 'Continue de onde parou em suas trilhas de formação.' 
                    : 'Descubra trilhas personalizadas para sua vida espiritual.'}
                </p>
              </div>
            </div>
            <HomeButton variant="primary" onClick={() => onNavigate(AppRoute.JORNADAS)} className="w-full">
              {user ? 'Continuar' : 'Começar'}
            </HomeButton>
          </HomeCard>
        </section>

        {/* RITUAL DO DIA */}
        <section className="space-y-8">
          <div className="flex items-center gap-6">
            <h2 className="text-premium-tiny font-bold uppercase tracking-[0.4em] text-primary/30 whitespace-nowrap">
              Hoje
            </h2>
            <div className="h-px flex-1 bg-border/20" />
          </div>
          <div className="h-full">
            <RitualDoDia />
          </div>
        </section>

        {/* CATECISMO */}
        <section className="space-y-8">
          <div className="flex items-center gap-6">
            <h2 className="text-premium-tiny font-bold uppercase tracking-[0.4em] text-primary/30 whitespace-nowrap">
              Doutrina
            </h2>
            <div className="h-px flex-1 bg-border/20" />
          </div>
          <HomeCard 
            onClick={() => onNavigate(AppRoute.CATECHISM)}
            padding="md"
            className="h-full flex flex-col justify-between gap-8 group"
          >
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-premium-sm bg-secondary/[0.02] border border-secondary/20 flex items-center justify-center text-secondary group-hover:rotate-12 transition-transform duration-700">
                <Icons.Catechism className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-primary tracking-tight">Catecismo</h3>
                <p className="mt-3 text-sm text-primary/50 leading-relaxed font-serif italic">
                  "O Catecismo apresenta fielmente o ensinamento da Tradição viva na Igreja."
                </p>
              </div>
            </div>
            <HomeButton variant="outline" className="w-full">
              Explorar Doutrina
            </HomeButton>
          </HomeCard>
        </section>

        {/* TRILHAS */}
        <section className="space-y-8">
          <div className="flex items-center gap-6">
            <h2 className="text-premium-tiny font-bold uppercase tracking-[0.4em] text-primary/30 whitespace-nowrap">
              Trilhas
            </h2>
            <div className="h-px flex-1 bg-border/20" />
          </div>
          <div className="grid grid-cols-1 gap-6 h-full">
            <HomeCard padding="sm" className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-primary">Fundamentos da Fé</h4>
                <Icons.Star className="w-4 h-4 text-primary/40" />
              </div>
              <p className="text-xs text-primary/50">Para quem inicia sua jornada espiritual.</p>
              <HomeButton variant="ghost" className="p-0 h-auto text-[10px] text-primary/40 hover:text-primary transition-all group" onClick={() => onNavigate(AppRoute.JORNADAS)}>
                Explorar <Icons.ChevronRight className="ml-1 w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </HomeButton>
            </HomeCard>
            
            <HomeCard padding="sm" className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-primary">Estudo Bíblico</h4>
                <Icons.BookOpen className="w-4 h-4 text-secondary/40" />
              </div>
              <p className="text-xs text-primary/50">Aprofunde seu conhecimento das Escrituras.</p>
              <HomeButton variant="ghost" className="p-0 h-auto text-[10px] text-secondary/40 hover:text-secondary transition-all group" onClick={() => onNavigate(AppRoute.BIBLE)}>
                Ver Planos <Icons.ChevronRight className="ml-1 w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </HomeButton>
            </HomeCard>
          </div>
        </section>
      </div>

      {/* FOOTER QUOTE */}
      <div className="pt-12 text-center opacity-20">
        <p className="text-xs font-serif italic max-w-sm mx-auto">
          "A beleza salvará o mundo." — Dostoievski
        </p>
      </div>
    </div>
  );
};

export default HomeMainContent;