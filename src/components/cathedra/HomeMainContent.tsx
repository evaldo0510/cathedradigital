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
    <div className="app-container space-y-48 md:space-y-64 pb-48 md:pb-64">
      {/* CONTINUE JORNADA */}
      <section className="space-y-12">
        <div className="flex items-center gap-6">
          <div className="h-px flex-1 bg-border/40" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground whitespace-nowrap">
            Continue sua Jornada
          </h2>
          <div className="h-px flex-1 bg-border/40" />
        </div>
        
        <HomeCard
          onClick={() => onNavigate(AppRoute.JORNADAS)}
          className="p-10 flex flex-col md:flex-row items-center justify-between gap-8 group"
        >
          <div className="flex items-center gap-8 text-center md:text-left flex-col md:flex-row">
            <div className="w-20 h-20 rounded-3xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500 shadow-inner">
              <Icons.Flame className="w-10 h-10" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Seu Próximo Passo</p>
              <h3 className="text-2xl md:text-3xl font-serif text-foreground">
                {user ? 'Retomar caminhada de fé' : 'Inicie sua caminhada hoje'}
              </h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
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
      <section className="space-y-12">
        <div className="flex items-center gap-6">
          <div className="h-px flex-1 bg-border/40" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground whitespace-nowrap">
            Ritual do Dia
          </h2>
          <div className="h-px flex-1 bg-border/40" />
        </div>
        <div className="max-w-2xl mx-auto">
          <RitualDoDia />
        </div>
      </section>

      {/* TEMAS PRINCIPAIS */}
      <section className="space-y-12">
        <div className="flex items-center gap-6">
          <div className="h-px flex-1 bg-border/40" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground whitespace-nowrap">
            Temas Principais
          </h2>
          <div className="h-px flex-1 bg-border/40" />
        </div>
        <HomeMainDoors t={t} />
      </section>

      {/* CATECISMO */}
      <section className="space-y-12">
        <div className="flex items-center gap-6">
          <div className="h-px flex-1 bg-border/40" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground whitespace-nowrap">
            Catecismo
          </h2>
          <div className="h-px flex-1 bg-border/40" />
        </div>
        <HomeCard 
          onClick={() => onNavigate(AppRoute.CATECHISM)}
          className="p-12 text-center space-y-8 group border-primary/5 hover:border-primary/20"
        >
          <div className="w-24 h-24 rounded-[2.5rem] bg-secondary/5 flex items-center justify-center text-secondary mx-auto group-hover:rotate-12 transition-transform duration-700">
            <Icons.Catechism className="w-12 h-12" />
          </div>
          <div className="space-y-4">
            <h3 className="text-3xl md:text-4xl font-serif text-foreground">Catecismo da Igreja</h3>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed font-serif italic">
              "O Catecismo deve apresentar, com fidelidade e de modo orgânico, o ensinamento da Sagrada Escritura, da Tradição viva na Igreja e do Magistério autêntico."
            </p>
          </div>
          <HomeButton variant="outline" className="mx-auto px-12">
            Explorar Doutrina
          </HomeButton>
        </HomeCard>
      </section>

      {/* TRILHAS */}
      <section className="space-y-12">
        <div className="flex items-center gap-6">
          <div className="h-px flex-1 bg-border/40" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground whitespace-nowrap">
            Trilhas de Formação
          </h2>
          <div className="h-px flex-1 bg-border/40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <HomeCard className="p-8 space-y-6 hover:border-primary/20">
            <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
              <Icons.Star className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xl font-bold font-serif">Fundamentos da Fé</h4>
              <p className="text-sm text-muted-foreground mt-2">Para quem está iniciando sua jornada espiritual agora.</p>
            </div>
            <HomeButton variant="ghost" className="p-0 h-auto text-primary hover:bg-transparent" onClick={() => onNavigate(AppRoute.JORNADAS)}>
              Explorar Trilhas <Icons.ChevronRight className="ml-2 w-4 h-4" />
            </HomeButton>
          </HomeCard>
          
          <HomeCard className="p-8 space-y-6 hover:border-secondary/20">
            <div className="w-12 h-12 rounded-2xl bg-secondary/5 flex items-center justify-center text-secondary">
              <Icons.BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xl font-bold font-serif">Estudo Bíblico</h4>
              <p className="text-sm text-muted-foreground mt-2">Aprofunde seu conhecimento das Escrituras Sagradas.</p>
            </div>
            <HomeButton variant="ghost" className="p-0 h-auto text-secondary hover:bg-transparent" onClick={() => onNavigate(AppRoute.BIBLE)}>
              Ver Planos <Icons.ChevronRight className="ml-2 w-4 h-4" />
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