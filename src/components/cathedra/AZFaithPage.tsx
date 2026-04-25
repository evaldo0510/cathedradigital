import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import { AppRoute } from '@/types';
import { motion } from 'framer-motion';
import { 
  Search, X, BookOpen, Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import AZFaithQuiz from './AZFaithQuiz';
import { useGlossary } from '@/hooks/useGlossary';
import AlphabetBar from './encyclopedia/AlphabetBar';
import EncyclopediaTermList from './encyclopedia/EncyclopediaTermList';
import EncyclopediaTermDetail from './encyclopedia/EncyclopediaTermDetail';

export interface FaithTerm {
  term: string;
  definition: string;
  reference?: string;
  category?: string;
  deepInterpretation?: string;
  practicalApplication?: string;
  bibleVerses?: string[];
  catechismReferences?: string[];
  magisteriumReferences?: string[];
  journey_id?: string;
}

const FEATURED_TERMS = ['Amor', 'Fé', 'Graça', 'Eucaristia', 'Trindade', 'Perdão'];

const AZFaithPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>('A');
  const [selectedTerm, setSelectedTerm] = useState<FaithTerm | null>(null);
  const [quizMode, setQuizMode] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);
  
  const { data: dbTerms, isLoading } = useGlossary();
  
  // Fallback to empty if loading, but in reality we should show a skeleton
  const allTerms = dbTerms || [];
  
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  
  const letterStatus = useMemo(() => {
    const status: Record<string, boolean> = {};
    alphabet.forEach(l => {
      status[l] = allTerms.some(t => t.term.toUpperCase().startsWith(l));
    });
    return status;
  }, [allTerms]);

  useEffect(() => {
    if (selectedTerm && window.innerWidth < 768) {
      setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedTerm]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q && allTerms.length > 0) {
      setSearchQuery(q);
      setSelectedLetter(null);
      
      const exactMatch = allTerms.find(t => t.term.toLowerCase() === q.toLowerCase());
      if (exactMatch) {
        setSelectedTerm(exactMatch);
      }
    }
  }, [location.search, allTerms]);

  const filteredTerms = useMemo(() => {
    let result = allTerms;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
      );
    } else if (selectedLetter) {
      result = result.filter(t => t.term.toUpperCase().startsWith(selectedLetter));
    }
    return result.sort((a, b) => a.term.localeCompare(b.term));
  }, [searchQuery, selectedLetter, allTerms]);

  const handleLetterClick = (letter: string) => {
    setSelectedLetter(letter);
    setSearchQuery('');
    setSelectedTerm(null);
  };

  const handleTermClick = (term: FaithTerm) => {
    setSelectedTerm(selectedTerm?.term === term.term ? null : term);
  };

  if (isLoading && allTerms.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="A–Z da Fé | Cathedra"
        description="Explore o índice alfabético de termos bíblicos e teológicos."
        path="/az-faith"
      />

      <div className="max-w-6xl mx-auto pb-32 px-4 md:px-8 animate-in fade-in duration-700">
        <header className="text-center space-y-6 pt-12 mb-16">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-primary/5 rounded-full border border-primary/10 shadow-inner">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Glossarium Fidei</span>
          </div>
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-foreground bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">A–Z da Fé</h1>
          <Button
            variant={quizMode ? 'default' : 'outline'}
            onClick={() => setQuizMode(!quizMode)}
            className="rounded-2xl gap-2 font-bold text-xs uppercase tracking-widest mt-2"
          >
            <Brain className="w-4 h-4" />
            {quizMode ? 'Voltar ao Índice' : '🧠 Testar Conhecimento'}
          </Button>
        </header>

        {quizMode ? (
          <AZFaithQuiz terms={allTerms} onClose={() => setQuizMode(false)} />
        ) : (
          <>
            <div className="relative max-w-lg mx-auto mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value) setSelectedLetter(null);
                }}
                className="w-full pl-11 pr-10 py-3 bg-card border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>

            <div className="flex justify-center gap-3 mb-6 flex-wrap">
              {FEATURED_TERMS.map(name => {
                const term = allTerms.find(t => t.term === name);
                if (!term) return null;
                const isActive = selectedTerm?.term === name;
                return (
                  <motion.button
                    key={name}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleTermClick(term)}
                    className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider border transition-all relative overflow-hidden group focus-visible:ring-4 focus-visible:ring-primary outline-none
                      ${isActive
                        ? 'bg-primary text-primary-foreground border-primary shadow-lg ring-4 ring-primary/10'
                        : 'bg-card/40 backdrop-blur-sm text-primary border-primary/20 hover:border-primary/50'
                      }`}
                  >

                    <div className="flex items-center gap-2 relative z-10">
                      <span>🫧</span>
                      {name}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <AlphabetBar
              alphabet={alphabet}
              selectedLetter={selectedLetter}
              letterStatus={letterStatus}
              onLetterClick={handleLetterClick}
            />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[400px]">
              <EncyclopediaTermList
                terms={filteredTerms}
                selectedTerm={selectedTerm}
                onTermClick={handleTermClick}
              />

              <EncyclopediaTermDetail
                selectedTerm={selectedTerm}
                detailRef={detailRef}
                navigate={navigate}
                onStudyWithLogos={(term) => navigate(`${AppRoute.STUDY_MODE}?topic=${encodeURIComponent(term)}`)}
                onLiveThis={(term) => {
                  if (term.journey_id) {
                    navigate(`/jornadas/${term.journey_id}`);
                  } else {
                    const ref = term.reference?.split(';')[0].trim();
                    navigate(`${AppRoute.LECTIO_DIVINA}${ref ? `?ref=${encodeURIComponent(ref)}` : ''}`);
                  }
                }}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default AZFaithPage;
