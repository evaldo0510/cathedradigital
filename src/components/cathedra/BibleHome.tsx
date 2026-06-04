import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BibleBook } from '@/data/bible-books';

interface BibleHomeProps {
  onSelectBook: (book: BibleBook) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const BibleHome: React.FC<BibleHomeProps> = ({ onSelectBook, searchQuery, setSearchQuery }) => {
  return (
    <div className="space-y-spacing-3xl pb-spacing-4xl">
      {/* Hero Section - Bible Digital Premium Concept */}
      <div className="text-center space-y-spacing-md">
        <Icons.Logo className="w-spacing-4xl h-spacing-4xl mx-auto opacity-20 mb-spacing-md" />
        <h1 className="text-premium-4xl font-display font-light uppercase tracking-[0.2em] text-primary">Bíblia Sagrada</h1>
        <p className="text-premium-sm italic text-primary/50 font-serif max-w-prose mx-auto">
          "A Palavra de Deus é viva e eficaz, mais penetrante que qualquer espada de dois gumes."
        </p>
      </div>

      {/* Quick Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-spacing-md">
        {['Continuar Leitura', 'Leitura do Dia', 'Plano de Leitura', 'Favoritos'].map((item) => (
          <button key={item} className="p-spacing-lg rounded-premium border border-primary/5 bg-background hover:bg-primary/[0.02] transition-all text-left group">
            <span className="block text-[8px] font-black uppercase tracking-widest text-primary/30 mb-spacing-sm">{item}</span>
            <span className="block text-premium-sm font-bold text-primary/70 group-hover:text-primary transition-colors">Acessar...</span>
          </button>
        ))}
      </div>

      {/* Library Structure */}
      <div className="space-y-spacing-md">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/30 px-spacing-md">Biblioteca Sagrada</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-lg">
           {/* Placeholder for Library Categories */}
           <div className="bg-primary/[0.02] p-spacing-lg rounded-premium border border-primary/5">
             <h3 className="font-display mb-spacing-md">Antigo Testamento</h3>
             {/* List of categories... */}
           </div>
           <div className="bg-primary/[0.02] p-spacing-lg rounded-premium border border-primary/5">
             <h3 className="font-display mb-spacing-md">Novo Testamento</h3>
             {/* List of categories... */}
           </div>
        </div>
      </div>
    </div>
  );
};
