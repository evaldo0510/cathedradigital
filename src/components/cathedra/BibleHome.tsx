import React from 'react';

import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { BibleBook, BIBLE_DATA } from '@/data/bible-books';
import { EditorialHero } from '@/components/editorial/harmony';




interface BibleHomeProps {
  onSelectBook: (book: BibleBook) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const BibleHome: React.FC<BibleHomeProps> = ({ onSelectBook, searchQuery, setSearchQuery }) => {
  const navigate = useNavigate();
  const lastReadRaw = localStorage.getItem('cathedra_bible_last_read');
  const lastRead = React.useMemo(() => lastReadRaw ? JSON.parse(lastReadRaw) : null, [lastReadRaw]);

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen bg-background">
      {/* Desktop Sidebar: Sacred Visuals */}
      <div className="hidden md:flex md:w-[40%] sticky top-0 h-screen overflow-hidden bg-primary/5 border-r border-primary/5">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-transparent to-background" />
        
        <div className="relative z-10 w-full flex flex-col items-center justify-center p-spacing-2xl text-center space-y-spacing-xl">
          <div className="w-24 h-24 rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/20 shadow-premium backdrop-blur-sm">
            <Icons.Book className="w-10 h-10 text-secondary" />
          </div>
          <div className="space-y-spacing-xs">
            <h2 className="font-display text-5xl text-primary tracking-tight leading-none italic">Sacra Scriptura</h2>
            <p className="text-xs uppercase tracking-[0.4em] text-secondary font-bold">Verbum Domini</p>
          </div>
          <div className="max-w-xs mx-auto">
            <div className="h-px w-12 bg-secondary/30 mx-auto mb-spacing-md" />
            <p className="text-sm font-serif italic text-primary/60 leading-relaxed">
              "Toda a Escritura é inspirada por Deus e útil para ensinar, para repreender, para corrigir e para formar na justiça."
            </p>
            <p className="mt-2 text-[10px] uppercase tracking-widest text-primary/40 font-bold">2 Timóteo 3, 16</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-spacing-xl md:pt-spacing-3xl">
        <div className="max-w-lg mx-auto px-4 space-y-8 pb-24">
      <EditorialHero align="center" density="balanced" rule={false}>
        <EditorialHero.Eyebrow>Sacra Scriptura</EditorialHero.Eyebrow>
        <EditorialHero.Title>Bíblia</EditorialHero.Title>
        <EditorialHero.Subtitle>
          "Lâmpada para os meus pés é a tua palavra e luz para os meus caminhos."
        </EditorialHero.Subtitle>
      </EditorialHero>



      {/* Continue Reading Widget */}
      <div className="grid grid-cols-1 gap-4">
        {lastRead ? (
          <button 
            onClick={() => {
              const allBooks = Object.values(BIBLE_DATA).flat().flatMap(cat => cat.books);
              const book = allBooks.find(b => b.abbr === lastRead.bookAbbr);
              if (book) onSelectBook(book);
            }}
            className="p-4 rounded-3xl border border-primary/5 bg-card hover:bg-primary/[0.01] transition-all text-left group shadow-premium-sm"
          >
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-[9px] font-black uppercase tracking-widest text-secondary/80">Bíblia • Continuar Lendo</h2>
              <div className="flex items-center gap-1.5">
                 {lastRead.timestamp && (
                   <span className="text-[8px] text-primary/30 font-bold uppercase">{new Date(lastRead.timestamp).toLocaleDateString()}</span>
                 )}
                 <Icons.ChevronRight className="w-3 h-3 text-primary/20 group-hover:text-secondary transition-colors" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-lg font-display text-primary/80 leading-tight">
                  {lastRead.bookName}
                </span>
                <span className="text-[10px] text-primary/40 font-serif">
                  Capítulo {lastRead.chapter}
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-secondary/5 flex items-center justify-center">
                 <Icons.BookOpen className="w-4 h-4 text-secondary/40" />
              </div>
            </div>
          </button>
        ) : null}
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Icons.Calendar, label: 'Leitura Diária', action: () => navigate('/hoje') },
          { icon: Icons.Bookmark, label: 'Marcadores', action: () => navigate('/favorites') },
          { icon: Icons.Book, label: 'Biblioteca', action: () => navigate('/biblioteca') }
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
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/30">Cânone Sagrado</h2>
          <div className="h-px flex-1 bg-primary/5" />
        </div>
        
        {/* Books List handled by the parent component but we can add placeholders here if needed */}
      </div>
        </div>
      </div>
    </div>
  );
};
