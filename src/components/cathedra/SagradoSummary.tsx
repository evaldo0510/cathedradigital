import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
        <div className="flex-1 overflow-y-auto no-scrollbar py-2">
          {['Antigo Testamento', 'Novo Testamento'].map((testament) => (
            <div key={testament} className="mb-4">
              <div className="px-6 py-2">
                 <span className="text-[9px] font-bold uppercase tracking-widest text-secondary/60">{testament}</span>
              </div>
              {BIBLE_DATA[testament as keyof typeof BIBLE_DATA].map((category) => (
                <div key={category.name} className="space-y-0.5">
                   <div className="px-8 py-1.5 text-[10px] font-medium text-primary/30 italic">{category.name}</div>
                   {category.books.map((book) => (
                     <button
                       key={book.abbr}
                       onClick={() => setActiveBook(book)}
                       className={cn(
                         "w-full flex items-center justify-between px-8 py-3 transition-all duration-300 group",
                         activeBook?.abbr === book.abbr 
                           ? "bg-white/60 text-primary border-r-2 border-secondary" 
                           : "text-primary/50 hover:bg-white/40 hover:text-primary"
                       )}
                     >
                       <span className={cn(
                         "text-sm font-serif transition-colors",
                         activeBook?.abbr === book.abbr ? "font-bold" : "font-normal"
                       )}>
                         {book.name}
                       </span>
                       <span className="text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity text-secondary">{book.abbr}</span>
                     </button>
                   ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Detalhes do Livro / Seleção de Capítulos */}
      <div className="lg:col-span-8 bg-white/40 flex flex-col h-[600px]">
        {activeBook ? (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="p-12 border-b border-primary/5 flex flex-col items-center text-center">
              <span className="text-[10px] font-black tracking-[0.5em] text-secondary/40 uppercase mb-4">LIVRO SAGRADO</span>
              <h3 className="font-display text-5xl text-primary/90 mb-2">{activeBook.name}</h3>
              <p className="font-serif italic text-primary/40 text-sm max-w-md">
                {activeBook.chapters} capítulos de sabedoria e revelação divina.
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-12 no-scrollbar">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {Array.from({ length: activeBook.chapters }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() => onSelectBook(activeBook)}
                    className="aspect-square flex flex-col items-center justify-center rounded-xl border border-primary/5 bg-white/50 hover:bg-white hover:border-secondary/30 hover:shadow-premium-sm transition-all group"
                  >
                    <span className="font-display text-2xl text-primary/30 group-hover:text-secondary transition-colors mb-1">{num}</span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-primary/10 group-hover:text-primary/30">CAP</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-8 border-t border-primary/5 bg-primary/5 flex justify-center">
               <Button 
                 onClick={() => onSelectBook(activeBook)}
                 className="rounded-full px-8 bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-display tracking-widest uppercase text-[10px]"
               >
                 Começar Leitura do Livro
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
