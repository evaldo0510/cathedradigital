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

const GuidedReadingPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useReadingSettings();

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-1000">
      <AppHeader />
      
      <SEOHead 
        title="Jornada de Leitura Guiada | Cathedra Digital"
        description="Uma experiência contemplativa e organizada para sua leitura espiritual diária."
      />

      <main className="app-container py-32 md:py-48 flex flex-col items-center">
        <header className="text-center space-y-8 mb-20 md:mb-32 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-4 px-6 py-2 bg-primary/[0.01] border border-border/10 rounded-full text-[10px] font-black uppercase tracking-[0.5em] text-primary/40">
            <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
            Experiência Guiada
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-medium tracking-tighter text-primary">
            Jornada de Luz
          </h1>
          
          <p className="text-xl text-muted-foreground/40 font-serif italic leading-relaxed">
            "Para onde eu for, que a Tua Palavra seja minha lâmpada."
          </p>
        </header>

        <section className="w-full flex justify-center">
          <GuidedReadingFlow />
        </section>

        <footer className="mt-32 text-center space-y-6 opacity-30 hover:opacity-100 transition-opacity duration-1000">
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-primary/40">
            Mosteiro Digital Moderno
          </p>
          <div className="h-20 w-px bg-gradient-to-b from-primary/20 to-transparent mx-auto" />
        </footer>
      </main>
    </div>
  );
};

export default GuidedReadingPage;