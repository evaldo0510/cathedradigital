import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../constants';
import SEOHead from '@/components/SEOHead';
import { AppRoute } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Book, 
  Bookmark, 
  FileText, 
  Tag, 
  Loader2, 
  ChevronRight, 
  Hash, 
  Search, 
  X, 
  BookOpen, 
  Quote, 
  Info, 
  Zap,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FaithTerm {
  term: string;
  definition: string;
  reference?: string;
  category?: string;
  deepInterpretation?: string;
  practicalApplication?: string;
  bibleVerses?: string[];
  catechismReferences?: string[];
  magisteriumReferences?: string[];
}

const FAITH_TERMS: FaithTerm[] = [
// ... keep existing terms

  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);
  
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredTerms = useMemo(() => {
    let result = FAITH_TERMS;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.term.toLowerCase().includes(q) || 
        t.definition.toLowerCase().includes(q)
      );
    }
    
    if (selectedLetter) {
      result = result.filter(t => t.term.toUpperCase().startsWith(selectedLetter));
    }
    
    return result.sort((a, b) => a.term.localeCompare(b.term));
  }, [searchQuery, selectedLetter]);

  const groupedTerms = useMemo(() => {
    const groups: Record<string, FaithTerm[]> = {};
    filteredTerms.forEach(t => {
      const firstLetter = t.term[0].toUpperCase();
      if (!groups[firstLetter]) groups[firstLetter] = [];
      groups[firstLetter].push(t);
    });
    return groups;
  }, [filteredTerms]);

  const handleLetterClick = (letter: string) => {
    if (selectedLetter === letter) {
      setSelectedLetter(null);
    } else {
      setSelectedLetter(letter);
      setSearchQuery('');
    }
  };

  return (
    <>
      <SEOHead 
        title="A–Z da Fé | Cathedra" 
        description="Explore o índice alfabético de termos bíblicos e teológicos da Bíblia Ave Maria. Uma ferramenta interativa para aprofundar seu conhecimento da fé."
        path="/az-faith"
      />
      
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        {/* Header */}
        <div className="text-center space-y-2 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full mb-2">
            <Icons.BookOpen className="w-3.5 h-3.5 text-primary" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Índice Bíblico Ave Maria</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">A–Z da Fé</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto italic font-serif">
            Explore os fundamentos da nossa crença, de Gênesis ao Apocalipse.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative group max-w-md mx-auto">
          <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Buscar termo ou conceito..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedLetter(null);
            }}
            className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-sm"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <Icons.X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Alphabet Navigation */}
        <div className="flex flex-wrap justify-center gap-1.5 py-4">
          {alphabet.map(letter => {
            const hasTerms = FAITH_TERMS.some(t => t.term.toUpperCase().startsWith(letter));
            return (
              <button
                key={letter}
                onClick={() => handleLetterClick(letter)}
                disabled={!hasTerms && !selectedLetter}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-[10px] font-black transition-all
                  ${selectedLetter === letter 
                    ? 'bg-primary text-primary-foreground shadow-md scale-110' 
                    : hasTerms 
                      ? 'bg-card border border-border text-foreground hover:border-primary/50' 
                      : 'opacity-30 cursor-not-allowed'}`}
              >
                {letter}
              </button>
            );
          })}
        </div>

        {/* List of Terms */}
        <div className="space-y-8 mt-4">
          <AnimatePresence mode="popLayout">
            {Object.entries(groupedTerms).length > 0 ? (
              Object.entries(groupedTerms).sort().map(([letter, terms]) => (
                <motion.div 
                  key={letter}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-4 px-2">
                    <span className="text-xl font-serif font-black text-primary/40">{letter}</span>
                    <div className="h-px flex-1 bg-border/50" />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {terms.map((t) => (
                      <div 
                        key={t.term}
                        className={`bg-card border rounded-2xl transition-all overflow-hidden ${
                          expandedTerm === t.term ? 'border-primary/50 shadow-sm' : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <button
                          onClick={() => setExpandedTerm(expandedTerm === t.term ? null : t.term)}
                          className="w-full text-left p-4 flex items-center justify-between gap-4"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-foreground">{t.term}</h3>
                              {(t.deepInterpretation || t.practicalApplication) && (
                                <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" title="Hub de conteúdo disponível" />
                              )}
                            </div>
                            {t.category && (
                              <span className="text-[8px] uppercase tracking-widest text-primary/70 font-black">{t.category}</span>
                            )}
                          </div>
                          <Icons.ArrowDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${expandedTerm === t.term ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <AnimatePresence>
                          {expandedTerm === t.term && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                                <div className="px-4 pb-6 space-y-6 border-t border-border pt-4">
                                  {/* Explicação Simples */}
                                  <div className="space-y-2">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary/60 flex items-center gap-2">
                                      <Icons.Info className="w-3 h-3" />
                                      Explicação Simples
                                    </h4>
                                    <p className="text-sm text-foreground leading-relaxed font-serif">
                                      {t.definition}
                                    </p>
                                  </div>

                                  {/* Interpretação Profunda */}
                                  {t.deepInterpretation && (
                                    <div className="space-y-2 p-3 bg-primary/5 rounded-xl border border-primary/10">
                                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                        <Icons.Sparkles className="w-3 h-3" />
                                        Interpretação Profunda
                                      </h4>
                                      <p className="text-xs text-muted-foreground leading-relaxed italic">
                                        {t.deepInterpretation}
                                      </p>
                                    </div>
                                  )}

                                  {/* Aplicação Prática */}
                                  {t.practicalApplication && (
                                    <div className="space-y-2">
                                      <h4 className="text-[10px] font-black uppercase tracking-widest text-secondary flex items-center gap-2">
                                        <Icons.Target className="w-3 h-3" />
                                        Aplicação Prática
                                      </h4>
                                      <p className="text-xs text-foreground/80 leading-relaxed">
                                        {t.practicalApplication}
                                      </p>
                                    </div>
                                  )}

                                  {/* Conexões */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                    {/* Bíblia */}
                                    {(t.reference || (t.bibleVerses && t.bibleVerses.length > 0)) && (
                                      <div className="space-y-2">
                                        <h5 className="text-[9px] font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                                          <Icons.Bible className="w-2.5 h-2.5" />
                                          Escrituras
                                        </h5>
                                        <div className="flex flex-wrap gap-1.5">
                                          {t.bibleVerses ? t.bibleVerses.map(v => (
                                            <span key={v} className="text-[9px] bg-muted/50 px-2 py-0.5 rounded-full border border-border/50 text-foreground/70">
                                              {v}
                                            </span>
                                          )) : t.reference && (
                                            <span className="text-[9px] bg-muted/50 px-2 py-0.5 rounded-full border border-border/50 text-foreground/70">
                                              {t.reference}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Catecismo */}
                                    {t.catechismReferences && t.catechismReferences.length > 0 && (
                                      <div className="space-y-2">
                                        <h5 className="text-[9px] font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                                          <Icons.FileText className="w-2.5 h-2.5" />
                                          Catecismo
                                        </h5>
                                        <div className="flex flex-wrap gap-1.5">
                                          {t.catechismReferences.map(r => (
                                            <span key={r} className="text-[9px] bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10 text-primary/80">
                                              {r}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Magistério */}
                                    {t.magisteriumReferences && t.magisteriumReferences.length > 0 && (
                                      <div className="space-y-2">
                                        <h5 className="text-[9px] font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                                          <Icons.Globe className="w-2.5 h-2.5" />
                                          Magistério
                                        </h5>
                                        <div className="flex flex-wrap gap-1.5">
                                          {t.magisteriumReferences.map(m => (
                                            <span key={m} className="text-[9px] bg-secondary/5 px-2 py-0.5 rounded-full border border-secondary/10 text-secondary-foreground/80">
                                              {m}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`${AppRoute.STUDY_MODE}?topic=${encodeURIComponent(t.term)}`);
                                    }}
                                    className="w-full py-2 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors mt-4"
                                  >
                                    <Icons.Brain className="w-3.5 h-3.5" />
                                    Aprofundar com Colloquium IA
                                  </button>
                                </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 space-y-3"
              >
                <div className="w-12 h-12 bg-muted/20 rounded-full flex items-center justify-center mx-auto">
                  <Icons.Search className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-foreground font-bold">Nenhum termo encontrado</p>
                  <p className="text-xs text-muted-foreground">Tente uma busca diferente ou limpe os filtros.</p>
                </div>
                {(searchQuery || selectedLetter) && (
                  <button 
                    onClick={() => { setSearchQuery(''); setSelectedLetter(null); }}
                    className="text-xs font-black uppercase tracking-widest text-primary hover:underline"
                  >
                    Limpar Filtros
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default AZFaithPage;
