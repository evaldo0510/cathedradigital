import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isLegitimateClick } from '@/lib/navigation-utils';
import { BIBLE_DATA, BibleBook } from '@/data/bible-books';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';

interface SagradoSummaryProps {
  onSelectBook: (book: BibleBook) => void;
  activeBook: BibleBook | null;
  setActiveBook: (book: BibleBook) => void;
}

const SagradoSummary: React.FC<SagradoSummaryProps> = ({ onSelectBook, activeBook, setActiveBook }) => {
  const { settings } = useReadingSettings();
  
  const allBooks = [...BIBLE_DATA['Antigo Testamento'], ...BIBLE_DATA['Novo Testamento']].flatMap(cat => cat.books);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-primary/10 rounded-premium overflow-hidden bg-white/30 backdrop-blur-sm shadow-premium">
      {/* Sidebar de Livros */}
      <div className="lg:col-span-4 border-r border-primary/10 flex flex-col h-[600px]">
        <div className="p-6 border-b border-primary/10 bg-primary/5">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40">Índice das Escrituras</h4>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar py-2" role="listbox" aria-label="Lista de Livros">
          {['Antigo Testamento', 'Novo Testamento'].map((testament) => (
            <div key={testament} className="mb-4">
              <div className="px-6 py-2 sticky top-0 bg-white/10 backdrop-blur-md z-10">
                 <span className="text-[9px] font-black uppercase tracking-[0.2em] text-secondary/70">{testament}</span>
              </div>
              {BIBLE_DATA[testament as keyof typeof BIBLE_DATA].map((category) => (
                <div key={category.name} className="space-y-0.5">
                   <div className="px-8 py-2 text-[9px] font-black uppercase tracking-[0.15em] text-primary/25">{category.name}</div>
                   {category.books.map((book) => (
                     <button
                       key={book.abbr}
                       onClick={(e) => isLegitimateClick(e) && setActiveBook(book)}
                       aria-selected={activeBook?.abbr === book.abbr}
                       role="option"
                       onKeyDown={(e) => {
                         if ((e.key === 'Enter' || e.key === ' ') && isLegitimateClick(e)) {
                           e.preventDefault();
                           setActiveBook(book);
                         }
                       }}
                       className={cn(
                         "w-full flex items-center justify-between px-8 py-3.5 transition-all duration-500 group relative outline-none focus-visible:ring-inset",
                         activeBook?.abbr === book.abbr 

                           ? "bg-white/90 text-primary shadow-sm ring-1 ring-primary/5" 
                           : "text-primary/50 hover:bg-white/40 hover:text-primary focus-visible:bg-white/40 focus-visible:text-primary"
                       )}
                     >
                       <span className={cn(
                         "text-[13px] font-serif tracking-wide transition-all duration-500",
                         activeBook?.abbr === book.abbr ? "font-bold translate-x-1" : "font-normal group-hover:translate-x-0.5"
                       )}>
                         {book.name}
                       </span>
                       <span className="text-[9px] font-black tracking-widest opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity text-secondary/60">{book.abbr}</span>
                       {activeBook?.abbr === book.abbr && (
                         <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-secondary rounded-r-full shadow-[0_0_8px_rgba(var(--secondary),0.4)]" />
                       )}
                     </button>
                   ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Detalhes do Livro / Seleção de Capítulos */}
      <div className="lg:col-span-8 bg-white/40 flex flex-col h-[600px] relative overflow-hidden">
        {activeBook ? (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-1000 ease-out">
            <div className="p-16 border-b border-primary/5 flex flex-col items-center text-center bg-gradient-to-b from-white/20 to-transparent">
              <div className="mb-6 flex items-center gap-4">
                <div className="h-px w-8 bg-secondary/20" />
                <span className="text-[10px] font-black tracking-[0.6em] text-secondary/60 uppercase">LIVRO SAGRADO</span>
                <div className="h-px w-8 bg-secondary/20" />
              </div>
              <h3 className="font-display text-6xl text-primary/90 mb-4 tracking-tight">{activeBook.name}</h3>
              <p className="font-serif italic text-primary/50 text-base max-w-sm leading-relaxed">
                {activeBook.description || `${activeBook.chapters} capítulos de sabedoria e revelação divina.`}
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-12 no-scrollbar">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {Array.from({ length: activeBook.chapters }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={(e) => isLegitimateClick(e) && onSelectBook(activeBook)}
                    aria-label={`Capítulo ${num}`}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && isLegitimateClick(e)) {
                        e.preventDefault();
                        onSelectBook(activeBook);
                      }
                    }}
                    className="aspect-square flex flex-col items-center justify-center rounded-2xl border border-primary/5 bg-white/60 hover:bg-white hover:border-secondary/40 hover:shadow-premium-md hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60 focus-visible:ring-offset-2 focus-visible:bg-white transition-all duration-500 group outline-none"
                  >
                    <span className="font-display text-3xl text-primary/20 group-hover:text-secondary group-focus-visible:text-secondary transition-colors mb-0.5">{num}</span>
                    <span className="text-[7px] font-black uppercase tracking-[0.2em] text-primary/10 group-hover:text-primary/40 group-focus-visible:text-primary/40">CAP</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-10 border-t border-primary/5 bg-white/20 flex justify-center backdrop-blur-md">
               <Button 
                 onClick={(e) => isLegitimateClick(e) && onSelectBook(activeBook)}
                 className="rounded-full px-12 py-7 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all duration-500 font-display tracking-[0.3em] uppercase text-[10px] shadow-premium-lg"
               >
                 Abrir Escrituras
               </Button>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-40">
            <Icons.BookOpen className="w-16 h-16 mb-6 text-primary/10" />
            <p className="font-serif italic">Selecione um livro para iniciar seu estudo</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SagradoSummary;
