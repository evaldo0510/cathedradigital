import React, { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';
import { Icons } from '@/constants';
import { HomeCard } from './HomeCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  return (
    <div className="app-container stack-spacing pb-64">
      {/* CONTINUE JORNADA */}
      <section className="space-y-16">
        <div className="flex items-center gap-12">
          <div className="h-px flex-1 bg-border/30" />
          <h2 className="text-premium-tiny font-bold uppercase tracking-[0.6em] text-primary/30 whitespace-nowrap">
            Memória da Jornada
          </h2>
          <div className="h-px flex-1 bg-border/30" />
        </div>
        
        <Card
          variant="interactive"
          onClick={() => onNavigate(AppRoute.JORNADAS)}
          padding="lg"
          className="flex flex-col md:flex-row items-center justify-between gap-16"
        >
          <div className="flex items-center gap-14 text-center md:text-left flex-col md:flex-row">
            <div className="w-24 h-24 rounded-premium-sm bg-primary/[0.02] border border-border/40 flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-1000 shadow-inner">
              <Icons.Flame className="w-12 h-12" strokeWidth={1} />
            </div>
            <div className="space-y-4">
              <p className="text-premium-tiny font-bold uppercase tracking-[0.4em] text-primary/30">Seu Próximo Passo</p>
              <h3 className="text-4xl font-bold text-primary tracking-tight">
                {user ? 'Retomar caminhada' : 'Inicie sua caminhada'}
              </h3>
              <p className="text-lg text-primary/50 max-w-lg leading-relaxed font-serif italic">
                {user 
                  ? 'Onde o silêncio encontra a Verdade, sua formação continua.' 
                  : 'Descubra o caminho da perfeição através da sabedoria católica.'}
              </p>
            </div>
          </div>
          <Button variant="primary" onClick={() => onNavigate(AppRoute.JORNADAS)} className="min-w-[200px] h-16 rounded-full text-[11px] font-bold uppercase tracking-[0.3em]">
            {user ? 'Continuar' : 'Começar'}
          </Button>
        </Card>
      </section>

      {/* RITUAL DO DIA */}
      <section className="space-y-16">
        <div className="flex items-center gap-12">
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
      <section className="space-y-16">
        <div className="flex items-center gap-12">
          <div className="h-px flex-1 bg-border/30" />
          <h2 className="text-premium-tiny font-bold uppercase tracking-[0.5em] text-primary/30 whitespace-nowrap">
            Temas Principais
          </h2>
          <div className="h-px flex-1 bg-border/30" />
        </div>
        <HomeMainDoors t={t} />
      </section>

      {/* CATECISMO */}
      <section className="space-y-16">
        <div className="flex items-center gap-12">
          <div className="h-px flex-1 bg-border/30" />
          <h2 className="text-premium-tiny font-bold uppercase tracking-[0.5em] text-primary/30 whitespace-nowrap">
            Catecismo
          </h2>
          <div className="h-px flex-1 bg-border/30" />
        </div>
        <Card 
          variant="interactive"
          onClick={() => onNavigate(AppRoute.CATECHISM)}
          padding="xl"
          className="text-center space-y-16"
        >
          <div className="w-28 h-28 rounded-premium-sm bg-secondary/[0.02] border border-secondary/20 flex items-center justify-center text-secondary mx-auto group-hover:rotate-6 transition-transform duration-1000">
            <Icons.Catechism className="w-14 h-14" strokeWidth={1} />
          </div>
          <div className="space-y-8">
            <h3 className="text-5xl font-bold text-primary tracking-tight">Catecismo da Igreja</h3>
            <p className="max-w-3xl mx-auto text-xl text-primary/60 leading-relaxed font-serif italic opacity-80">
              "O Catecismo deve apresentar, com fidelidade e de modo orgânico, o ensinamento da Sagrada Escritura, da Tradição viva na Igreja e do Magistério autêntico."
            </p>
          </div>
          <Button variant="outline" className="mx-auto min-w-[240px] h-16 rounded-full text-[11px] font-bold uppercase tracking-[0.3em]">
            Explorar Doutrina
          </Button>
        </Card>
      </section>

      {/* TRILHAS */}
      <section className="space-y-16">
        <div className="flex items-center gap-14">
          <div className="h-px flex-1 bg-border/30" />
          <h2 className="text-premium-tiny font-bold uppercase tracking-[0.6em] text-primary/30 whitespace-nowrap">
            Trilhas de Formação
          </h2>
          <div className="h-px flex-1 bg-border/30" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
          <Card variant="interactive" padding="lg" className="space-y-10 h-full flex flex-col justify-between">
            <div className="space-y-10">
              <div className="w-16 h-16 rounded-2xl bg-primary/[0.03] border border-border/40 flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-700">
                <Icons.Star className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <div className="space-y-4">
                <h4 className="text-2xl font-bold text-primary">Fundamentos da Fé</h4>
                <p className="text-lg text-primary/50 leading-relaxed font-serif italic">Para quem está iniciando sua jornada espiritual agora.</p>
              </div>
            </div>
            <Button variant="ghost" className="p-0 h-auto text-primary/60 hover:text-primary transition-all text-premium-tiny uppercase tracking-[0.3em]" onClick={() => onNavigate(AppRoute.JORNADAS)}>
              Explorar Trilhas <Icons.ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Card>
          
          <Card variant="interactive" padding="lg" className="space-y-10 h-full flex flex-col justify-between">
            <div className="space-y-10">
              <div className="w-16 h-16 rounded-2xl bg-secondary/[0.03] border border-secondary/20 flex items-center justify-center text-secondary group-hover:scale-105 transition-transform duration-700">
                <Icons.BookOpen className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <div className="space-y-4">
                <h4 className="text-2xl font-bold text-primary">Estudo Bíblico</h4>
                <p className="text-lg text-primary/50 leading-relaxed font-serif italic">Aprofunde seu conhecimento das Escrituras Sagradas.</p>
              </div>
            </div>
            <Button variant="ghost" className="p-0 h-auto text-secondary/60 hover:text-secondary transition-all text-premium-tiny uppercase tracking-[0.3em]" onClick={() => onNavigate(AppRoute.BIBLE)}>
              Ver Planos <Icons.ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Card>
        </div>
      </section>

      {/* FOOTER QUOTE */}
      <div className="pt-32 text-center opacity-20 hover:opacity-40 transition-opacity duration-1000">
        <p className="text-base font-serif italic max-w-sm mx-auto leading-relaxed">
          "A beleza salvará o mundo." — Dostoievski
        </p>
      </div>
    </div>
  );
};

export default HomeMainContent;