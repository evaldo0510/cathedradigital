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
        <section className="space-y-8" aria-labelledby="section-jornada">
          <div className="flex items-center gap-6">
            <h2 id="section-jornada">
              Jornada
            </h2>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          
          <HomeCard
            onClick={() => onNavigate(AppRoute.JORNADAS)}
            padding="md"
            className="flex flex-col justify-between gap-10 group"
          >
            <div className="space-y-8">
              <div className="w-12 h-12 rounded-premium-sm bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-primary/80 group-hover:bg-white/[0.05] transition-all duration-700 shadow-premium-subtle">
                <Icons.Flame className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="heading-card">
                  {user ? 'Retomar Jornada' : 'Inicie sua Caminhada'}
                </h3>
                <p className="mt-4 text-sm text-primary/40 leading-relaxed max-w-sm">
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
        <section className="space-y-8" aria-labelledby="section-hoje">
          <div className="flex items-center gap-6">
            <h2 id="section-hoje">
              Hoje
            </h2>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          <div className="pt-2">
            <RitualDoDia />
          </div>
        </section>

        {/* CATECISMO */}
        <section className="space-y-8" aria-labelledby="section-doutrina">
          <div className="flex items-center gap-6">
            <h2 id="section-doutrina">
              Doutrina
            </h2>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          <HomeCard 
            onClick={() => onNavigate(AppRoute.CATECHISM)}
            padding="md"
            className="flex flex-col justify-between gap-10 group"
          >
            <div className="space-y-8">
              <div className="w-12 h-12 rounded-premium-sm bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-primary/80 group-hover:bg-white/[0.05] transition-all duration-700 shadow-premium-subtle">
                <Icons.Catechism className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="heading-card">Catecismo</h3>
                <p className="mt-4 text-sm text-primary/40 leading-relaxed font-serif italic max-w-sm">
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
        <section className="space-y-8" aria-labelledby="section-trilhas">
          <div className="flex items-center gap-6">
            <h2 id="section-trilhas">
              Trilhas
            </h2>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          <div className="grid grid-cols-1 gap-8">
            <HomeCard padding="md" className="space-y-6" onClick={() => onNavigate(AppRoute.TEMAS)}>
              <div className="flex items-center justify-between">
                <h4 className="heading-item">Temas da Fé</h4>
                <Icons.Star className="w-4 h-4 text-primary/20" aria-hidden="true" />
              </div>
              <p className="text-sm text-primary/40 leading-relaxed">Aprofunde-se em tópicos específicos da doutrina e espiritualidade.</p>
              <HomeButton variant="ghost" className="p-0 h-auto text-[10px] text-primary/30 hover:text-primary transition-all group tracking-[0.1em] uppercase font-bold" onClick={() => onNavigate(AppRoute.TEMAS)} aria-label="Explorar temas da fé">
                Explorar <Icons.ChevronRight className="ml-1 w-3 h-3 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </HomeButton>
            </HomeCard>
            
            <HomeCard padding="md" className="space-y-6" onClick={() => onNavigate(AppRoute.BIBLE)}>
              <div className="flex items-center justify-between">
                <h4 className="heading-item">Estudo Bíblico</h4>
                <Icons.BookOpen className="w-4 h-4 text-primary/20" aria-hidden="true" />
              </div>
              <p className="text-sm text-primary/40 leading-relaxed">Aprofunde seu conhecimento das Escrituras através de planos guiados.</p>
              <HomeButton variant="ghost" className="p-0 h-auto text-[10px] text-primary/30 hover:text-primary transition-all group tracking-[0.1em] uppercase font-bold" onClick={() => onNavigate(AppRoute.BIBLE)} aria-label="Ver planos de estudo bíblico">
                Ver Planos <Icons.ChevronRight className="ml-1 w-3 h-3 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
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