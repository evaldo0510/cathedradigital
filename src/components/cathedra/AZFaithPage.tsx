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
import ContemplativeLayout from './ContemplativeLayout';

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
        <div className="animate-spin rounded-premium h-2xl w-2xl border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ContemplativeLayout
      title="A–Z da Fé"
      subtitle="Glossarium Fidei"
      icon={BookOpen}
      headerActions={
        <Button
          variant={quizMode ? 'default' : 'outline'}
          onClick={() => setQuizMode(!quizMode)}
          className="rounded-full gap-xs font-bold text-xs uppercase tracking-widest"
        >
          <Brain className="w-md h-md" />
          {quizMode ? 'Voltar ao Índice' : '🧠 Testar Conhecimento'}
        </Button>
      }
    >
      <SEOHead
        title="A–Z da Fé | Cathedra"
        description="Explore o índice alfabético de termos bíblicos e teológicos."
        path="/az-faith"
      />

        {quizMode ? (
          <AZFaithQuiz terms={allTerms} onClose={() => setQuizMode(false)} />
        ) : (
          <>
            <div className="relative max-w-lg mx-auto mb-lg">
              <Search className="absolute left-md top-2xs/2 -translate-y-1/2 w-md h-md text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value) setSelectedLetter(null);
                }}
                className="w-full pl-xl pr-xl py-sm bg-card border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
              {searchQuery && (
                <Button onClick={() => setSearchQuery('')} className="absolute right-md top-2xs/2 -translate-y-1/2">
                  <X className="w-md h-md text-muted-foreground" />
                </Button>
              )}
            </div>

            <div className="flex justify-center gap-md mb-2xl flex-wrap max-w-4xl mx-auto px-md">
              {FEATURED_TERMS.map((name, idx) => {
                const term = allTerms.find(t => t.term === name);
                if (!term) return null;
                const isActive = selectedTerm?.term === name;
                return (
                  <motion.button
                    key={name}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleTermClick(term)}
                    className={`px-xl py-md rounded-full text-xs font-bold uppercase tracking-[0.2em] border transition-all relative overflow-hidden group focus-visible:ring-4 focus-visible:ring-primary/20 outline-none shadow-soft
                      ${isActive
                        ? 'bg-primary text-primary-foreground border-primary shadow-premium ring-4 ring-primary/10'
                        : 'bg-card  text-primary border-primary/20 hover:border-primary/50 hover:shadow-premium'
                      }`}
                  >
                    <div className="flex items-center gap-xs relative z-10">
                      <span className="opacity-80 group-hover:scale-125 transition-transform duration-500">🫧</span>
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

            <div className="grid grid-cols-1 md:grid-cols-12 gap-lg min-h-[400px]">
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
    </ContemplativeLayout>
  );
};

export default AZFaithPage;
