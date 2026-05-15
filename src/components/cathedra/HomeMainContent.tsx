import React, { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';
import { Icons } from '@/constants';
import { HomeCard } from './HomeCard';
import { HomeButton } from './HomeButton';
import RitualDoDia from './RitualDoDia';
// HomeMainDoors removed for minimalism
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
    <div className="content-section">
      <div className="premium-grid-2">
        {/* CONTINUE JORNADA */}
        <section className="space-y-10 lg:max-w-xl mx-auto w-full" aria-labelledby="section-jornada">
          <div className="flex items-center gap-6">
            <h2 id="section-jornada" className="heading-section-label whitespace-nowrap">
              Jornada
            </h2>
            <div className="h-px w-full bg-white/[0.08]" />
          </div>
          
          <HomeCard
            onClick={() => onNavigate(AppRoute.JORNADAS)}
            padding="md"
            className="flex flex-col justify-between gap-12 group min-h-[400px]"
          >
            <div className="space-y-10">
              <div className="w-14 h-14 rounded-premium-sm bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-primary/80 group-hover:bg-white/[0.05] transition-all duration-700 shadow-premium-subtle">
                <Icons.Flame className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className="heading-card">
                  {user ? 'Retomar Jornada' : 'Inicie sua Caminhada'}
                </h3>
                <p className="mt-5 text-base text-primary/40 leading-relaxed max-w-sm">
                  {user 
                    ? 'Continue de onde parou em suas trilhas de formação espiritual.' 
                    : 'Descubra trilhas personalizadas baseadas na Tradição Viva.'}
                </p>
              </div>
            </div>
            <HomeButton variant="primary" onClick={() => onNavigate(AppRoute.JORNADAS)} className="w-full" aria-label={user ? 'Continuar sua jornada' : 'Começar nova jornada'}>
              {user ? 'Continuar' : 'Começar'}
            </HomeButton>
          </HomeCard>
        </section>

        {/* RITUAL DO DIA */}
        <section className="space-y-10 lg:max-w-xl mx-auto w-full" aria-labelledby="section-hoje">
          <div className="flex items-center gap-6">
            <h2 id="section-hoje" className="heading-section-label whitespace-nowrap">
              Hoje
            </h2>
            <div className="h-px w-full bg-white/[0.08]" />
          </div>
          <div className="pt-2">
            <RitualDoDia />
          </div>
        </section>

        {/* CATECISMO */}
        <section className="space-y-10 lg:max-w-xl mx-auto w-full" aria-labelledby="section-doutrina">
          <div className="flex items-center gap-6">
            <h2 id="section-doutrina" className="heading-section-label whitespace-nowrap">
              Doutrina
            </h2>
            <div className="h-px w-full bg-white/[0.08]" />
          </div>
          <HomeCard 
            onClick={() => onNavigate(AppRoute.CATECHISM)}
            padding="md"
            className="flex flex-col justify-between gap-12 group min-h-[400px]"
          >
            <div className="space-y-10">
              <div className="w-14 h-14 rounded-premium-sm bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-primary/80 group-hover:bg-white/[0.05] transition-all duration-700 shadow-premium-subtle">
                <Icons.Catechism className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className="heading-card">Catecismo</h3>
                <p className="mt-5 text-base text-primary/40 leading-relaxed font-serif italic max-w-sm">
                  "O Catecismo apresenta fielmente o ensinamento da Tradição viva na Igreja."
                </p>
              </div>
            </div>
            <HomeButton variant="outline" className="w-full" aria-label="Explorar o Catecismo">
              Explorar Doutrina
            </HomeButton>
          </HomeCard>
        </section>

        {/* TRILHAS */}
        <section className="space-y-10 lg:max-w-xl mx-auto w-full" aria-labelledby="section-trilhas">
          <div className="flex items-center gap-6">
            <h2 id="section-trilhas" className="heading-section-label whitespace-nowrap">
              Trilhas
            </h2>
            <div className="h-px w-full bg-white/[0.08]" />
          </div>
          <div className="grid grid-cols-1 gap-10">
            <HomeCard padding="md" className="space-y-8 min-h-[190px] flex flex-col justify-center" onClick={() => onNavigate(AppRoute.TEMAS)}>
              <div className="flex items-center justify-between">
                <h4 className="heading-item">Temas da Fé</h4>
                <Icons.Star className="w-5 h-5 text-primary/20" aria-hidden="true" />
              </div>
              <p className="text-base text-primary/40 leading-relaxed max-w-sm">Aprofunde-se em tópicos específicos da doutrina e espiritualidade.</p>
              <HomeButton variant="ghost" className="p-0 min-h-0 h-auto text-[11px] text-primary/30 hover:text-primary transition-all group tracking-[0.2em] uppercase font-bold justify-start" onClick={() => onNavigate(AppRoute.TEMAS)} aria-label="Explorar temas da fé">
                Explorar <Icons.ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </HomeButton>
            </HomeCard>
            
            <HomeCard padding="md" className="space-y-8 min-h-[190px] flex flex-col justify-center" onClick={() => onNavigate(AppRoute.BIBLE)}>
              <div className="flex items-center justify-between">
                <h4 className="heading-item">Estudo Bíblico</h4>
                <Icons.BookOpen className="w-5 h-5 text-primary/20" aria-hidden="true" />
              </div>
              <p className="text-base text-primary/40 leading-relaxed max-w-sm">Aprofunde seu conhecimento das Escrituras através de planos guiados.</p>
              <HomeButton variant="ghost" className="p-0 min-h-0 h-auto text-[11px] text-primary/30 hover:text-primary transition-all group tracking-[0.2em] uppercase font-bold justify-start" onClick={() => onNavigate(AppRoute.BIBLE)} aria-label="Ver planos de estudo bíblico">
                Ver Planos <Icons.ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
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