import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Icons } from '@/constants';
import { AppRoute } from '@/types';
import { Button } from '@/components/ui/button';
import { GuidedReadingFlow } from '@/components/cathedra/GuidedReadingFlow';
import AppHeader from '@/components/cathedra/AppHeader';
import SEOHead from '@/components/SEOHead';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import { useAuth } from '@/hooks/useAuth';
import { useLang } from '@/hooks/useLang';
import { useReadingMode } from '@/hooks/useReadingMode';

const GuidedReadingPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useReadingSettings();
  const { user, signOut } = useAuth();
  const { lang, setLang } = useLang();
  const { isNight, toggle } = useReadingMode();

  const handleToggleSidebar = () => {
    // Implement or dispatch event if needed
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-1000">
      <AppHeader 
        user={user}
        isDark={isNight}
        onToggleDark={toggle}
        lang={lang}
        onChangeLang={setLang}
        onSignOut={signOut}
        onOpenSidebar={handleToggleSidebar}
      />
      
      <SEOHead 
        title="Jornada de Leitura Guiada"
        description="Uma experiência contemplativa e organizada para sua leitura espiritual diária."
        path="/jornada-guiada"
      />

      <main className="app-container py-spacing-4xl md:py-spacing-4xl flex flex-col items-center">
        <header className="text-center space-y-spacing-xl mb-spacing-3xl md:mb-spacing-4xl max-w-spacing-2xl mx-auto">
          <div className="inline-flex items-center gap-spacing-md px-spacing-lg py-spacing-xs bg-primary/[0.01] border border-border/10 rounded-premium-full text-[10px] font-black uppercase tracking-[0.5em] text-primary/40">
            <div className="w-spacing-2xs h-spacing-2xs rounded-premium-full bg-primary animate-pulse" />
            Experiência Guiada
          </div>
          
          <h1 className="text-premium-5xl md:text-7xl font-display font-medium tracking-tighter text-primary">
            Jornada de Luz
          </h1>
          
          <p className="text-premium-xl text-muted-foreground/40 font-serif italic leading-relaxed">
            "Para onde eu for, que a Tua Palavra seja minha lâmpada."
          </p>
        </header>

        <section className="w-full flex justify-center">
          <GuidedReadingFlow />
        </section>

        <footer className="mt-spacing-4xl text-center space-y-spacing-lg opacity-30 hover:opacity-100 transition-opacity duration-1000">
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-primary/40">
            Mosteiro Digital Moderno
          </p>
          <div className="h-spacing-3xl w-px bg-gradient-to-b from-primary/20 to-transparent mx-auto" />
        </footer>
      </main>
    </div>
  );
};

export default GuidedReadingPage;