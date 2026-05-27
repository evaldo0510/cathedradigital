import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../../constants';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import { toast } from 'sonner';
import bookDataRaw from '../../data/evaldo-poeta-book.json';

interface Chapter {
  title: string;
  content: string;
  poetry: string;
}

interface Part {
  title: string;
  chapters: Chapter[];
}

const InnerFreedomBook: React.FC = () => {
  const { settings } = useReadingSettings();
  const [currentPart, setCurrentPart] = useState(0);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [bookData, setBookData] = useState<{ parts: Part[] } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Use imported data
  useEffect(() => {
    if (bookDataRaw) {
      setBookData(bookDataRaw as { parts: Part[] });
    }
  }, []);

  const totalChapters = bookData?.parts.reduce((acc, part) => acc + part.chapters.length, 0) || 0;
  
  const currentChapterData = bookData?.parts[currentPart]?.chapters[currentChapter];

  const handleNext = () => {
    if (!bookData) return;
    if (currentChapter < bookData.parts[currentPart].chapters.length - 1) {
      setCurrentChapter(prev => prev + 1);
    } else if (currentPart < bookData.parts.length - 1) {
      setCurrentPart(prev => prev + 1);
      setCurrentChapter(0);
    }
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrev = () => {
    if (!bookData) return;
    if (currentChapter > 0) {
      setCurrentChapter(prev => prev - 1);
    } else if (currentPart > 0) {
      const prevPart = currentPart - 1;
      setCurrentPart(prevPart);
      setCurrentChapter(bookData.parts[prevPart].chapters.length - 1);
    }
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExportPDF = () => {
    toast.info("Preparando edição premium para exportação...");
    window.print();
  };

  if (!isReading) {
    return (
      <div className="min-h-[90vh] flex flex-col items-center justify-center p-8 bg-card relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 border border-primary rounded-full animate-pulse" />
          <div className="absolute bottom-10 right-10 w-96 h-96 border border-primary rounded-full opacity-50" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-12 z-10"
        >
          <div className="space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-primary/60">Obra Completa</span>
            <h1 className="text-5xl md:text-7xl font-display font-medium text-primary tracking-tighter leading-none">
              PRISÃO E LIBERDADE <br />
              <span className="text-foreground italic">INTERIOR</span>
            </h1>
            <p className="text-xl font-light text-muted-foreground italic">Evaldo Poeta</p>
          </div>

          <div className="w-24 h-px bg-primary/20 mx-auto" />

          <div className="space-y-6">
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
              Uma jornada autobiográfica profunda através das dores invisíveis até o despertar da consciência plena.
            </p>
            
            <Button 
              onClick={() => setIsReading(true)}
              className="w-full py-8 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-[0.3em] shadow-premium-hover transition-all group"
            >
              Iniciar Leitura <Icons.ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="flex justify-center gap-8 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
            <span>15.5 x 23 cm</span>
            <span>Edição Premium</span>
            <span>PCH Method</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row relative print:bg-white print:text-black">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          aside, footer, .md\\:hidden { display: none !important; }
          main { width: 100% !important; padding: 0 !important; margin: 0 !important; }
          .max-w-2xl { max-w-none !important; width: 100% !important; }
          h2 { font-size: 32pt !important; margin-top: 50pt !important; }
          p { font-size: 12pt !important; line-height: 1.6 !important; }
          blockquote { font-size: 18pt !important; border-left: 2pt solid #000; padding-left: 20pt !important; }
          .page-break { page-break-before: always; }
          @page {
            size: 15.5cm 23cm;
            margin: 2cm;
          }
        }
      `}</style>
      {/* Navigation Sidebar */}
      <aside className="hidden md:flex w-72 border-r border-border/10 p-8 flex-col gap-8 sticky top-20 h-[calc(100vh-80px)]">
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary">Sumário</h3>
          <div className="h-px w-full bg-primary/10" />
        </div>
        
        <nav className="flex-1 overflow-y-auto space-y-6 no-scrollbar">
          {bookData?.parts.map((part, pIdx) => (
            <div key={pIdx} className="space-y-3">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">{part.title}</h4>
              <ul className="space-y-1">
                {part.chapters.map((chap, cIdx) => (
                  <li key={cIdx}>
                    <button 
                      onClick={() => { setCurrentPart(pIdx); setCurrentChapter(cIdx); }}
                      className={cn(
                        "text-left text-[11px] py-1.5 px-3 rounded-full transition-all w-full",
                        currentPart === pIdx && currentChapter === cIdx 
                          ? "bg-primary/10 text-primary font-bold" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {chap.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <Button 
          variant="outline" 
          onClick={handleExportPDF}
          className="mt-auto rounded-full text-[10px] font-bold uppercase tracking-widest gap-2"
        >
          <Icons.Download className="w-3 h-3" /> Exportar PDF
        </Button>
      </aside>

      {/* Reader Area */}
      <main className="flex-1 p-6 md:p-20 overflow-y-auto no-scrollbar" ref={scrollRef}>
        <div className="max-w-2xl mx-auto space-y-24 pb-32">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentPart}-${currentChapter}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-16 print:space-y-8"
            >
              {/* Header */}
              <header className="space-y-6 text-center md:text-left">
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary/60">
                  {bookData?.parts[currentPart].title}
                </span>
                <h2 className="text-4xl md:text-6xl font-display font-medium tracking-tight text-foreground leading-none">
                  {currentChapterData?.title}
                </h2>
                <div className="w-12 h-1 bg-primary/20 hidden md:block" />
              </header>

              {/* Narrative Content */}
              <div className="prose prose-stone dark:prose-invert max-w-none">
                <p className="text-xl md:text-2xl leading-relaxed font-light text-foreground/80 first-letter:text-6xl first-letter:font-display first-letter:mr-3 first-letter:float-left first-letter:text-primary">
                  {currentChapterData?.content}
                </p>
              </div>

              {/* Poetry Section (PCH) */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  transition: { delay: 0.3 }
                }}
                className="bg-muted/30 p-12 md:p-20 rounded-[40px] border border-border/5 relative overflow-hidden group"
              >
                <motion.div 
                  animate={{ 
                    scale: [1, 1.02, 1],
                    opacity: [0.05, 0.08, 0.05]
                  }}
                  transition={{ 
                    duration: 8, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute top-0 right-0 p-8 pointer-events-none"
                >
                  <Icons.Feather className="w-48 h-48 rotate-12" />
                </motion.div>
                <div className="relative z-10 space-y-8">
                  <span className="text-[9px] font-black uppercase tracking-[0.5em] text-primary/40 block">Poesia Cognitiva Hipnótica</span>
                  <blockquote className="text-2xl md:text-4xl font-display italic text-primary leading-tight whitespace-pre-line relative">
                    <span className="absolute -left-8 -top-4 text-6xl opacity-10">"</span>
                    {currentChapterData?.poetry}
                    <span className="absolute -right-4 -bottom-8 text-6xl opacity-10">"</span>
                  </blockquote>
                </div>
              </motion.div>

              {/* Footer / Controls */}
              <footer className="flex items-center justify-between pt-16 border-t border-border/10 print:hidden">
                <Button 
                  variant="ghost" 
                  onClick={handlePrev}
                  disabled={currentPart === 0 && currentChapter === 0}
                  className="rounded-full gap-2 px-6"
                >
                  <Icons.ArrowLeft className="w-4 h-4" /> Anterior
                </Button>

                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                  Página {currentChapter + 1} de {totalChapters}
                </div>

                <Button 
                  onClick={handleNext}
                  disabled={currentPart === (bookData?.parts.length || 0) - 1 && currentChapter === (bookData?.parts[currentPart].chapters.length || 0) - 1}
                  className="bg-primary text-primary-foreground rounded-full gap-2 px-6"
                >
                  Próximo <Icons.ArrowRight className="w-4 h-4" />
                </Button>
              </footer>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Nav Overlay */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/80 backdrop-blur-xl border border-border/20 p-2 rounded-full shadow-premium z-50 print:hidden">
        <Button variant="ghost" size="icon" onClick={handlePrev} className="rounded-full"><Icons.ArrowLeft className="w-4 h-4" /></Button>
        <span className="text-[10px] font-bold px-4">{currentChapter + 1} / {totalChapters}</span>
        <Button variant="ghost" size="icon" onClick={handleNext} className="rounded-full"><Icons.ArrowRight className="w-4 h-4" /></Button>
      </div>
    </div>
  );
};

export default InnerFreedomBook;
