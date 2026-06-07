import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BibleBook, BIBLE_DATA } from '@/data/bible-books';


interface BibleHomeProps {
  onSelectBook: (book: BibleBook) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const BibleHome: React.FC<BibleHomeProps> = ({ onSelectBook, searchQuery, setSearchQuery }) => {
  return (
    <div className="space-y-8 pb-12 max-w-lg mx-auto px-4">
      {/* Hero Section */}
      <div className="text-center space-y-4 pt-4">
        <div className="relative inline-block">
          <Icons.BookOpen className="w-12 h-12 mx-auto text-secondary/20" />
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full"
          />
        </div>
        <h1 className="text-3xl font-display font-light uppercase tracking-[0.2em] text-primary">Sacra Biblia</h1>
        <p className="text-sm italic text-primary/60 font-serif leading-relaxed px-4">
          "Lâmpada para os meus pés é a tua palavra e luz para os meus caminhos."
        </p>
      </div>

      {/* Continue Reading Widget */}
      <div className="grid grid-cols-1 gap-4">
        <button 
          onClick={() => {
            const last = localStorage.getItem('cathedra_bible_last_read');
            if (last) {
              const p = JSON.parse(last);
              onSelectBook(Object.values(BIBLE_DATA).flat().flatMap(cat => cat.books).find(b => b.abbr === p.bookAbbr)!);
            }
          }}
          className="p-6 rounded-2xl border border-primary/5 bg-background hover:bg-primary/[0.02] transition-all text-left group shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-secondary">Continuar Leitura</span>
            <Icons.ChevronRight className="w-4 h-4 text-primary/20 group-hover:text-secondary transition-colors" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-display text-primary/80">
              {localStorage.getItem('cathedra_bible_last_read') 
                ? JSON.parse(localStorage.getItem('cathedra_bible_last_read')!).bookName 
                : 'Nenhum progresso'}
            </span>
            <span className="text-xs text-primary/40 font-serif">
               {localStorage.getItem('cathedra_bible_last_read') 
                ? `Capítulo ${JSON.parse(localStorage.getItem('cathedra_bible_last_read')!).chapter}` 
                : 'Comece sua jornada hoje'}
            </span>
          </div>
        </button>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Icons.Calendar, label: 'Leitura do Dia', action: () => {} },
          { icon: Icons.Bookmark, label: 'Favoritos', action: () => {} },
          { icon: Icons.Book, label: 'Biblioteca', action: () => {} }
        ].map((item) => (
          <button key={item.label} onClick={item.action} className="flex flex-col items-center p-4 rounded-2xl border border-primary/5 bg-background hover:bg-primary/[0.02] transition-all group">
            <item.icon className="w-5 h-5 text-primary/30 group-hover:text-secondary transition-colors mb-2" />
            <span className="text-[10px] font-bold uppercase tracking-tight text-primary/40 text-center">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Bible Library - Accordion Style */}
      <div className="space-y-4">
        <div className="flex items-center gap-4 px-2">
          <div className="h-px flex-1 bg-primary/5" />
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/30">Cânone Sagrado</h4>
          <div className="h-px flex-1 bg-primary/5" />
        </div>
        
        {/* Books List handled by the parent component but we can add placeholders here if needed */}
      </div>
    </div>
  );
};
