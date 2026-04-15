import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import { AppRoute } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Book, Bookmark, Search, X, BookOpen, Quote, Brain, Globe, Target, Compass, 
  ArrowRight, Sparkles, Hash, ChevronRight, Heart, Info, Library, Cross, Church, Hand, Bird, Flame, Crown, Shield, Star, Eye, Users, Wine, Orbit, Mountain, RefreshCw, Frown, Droplets, Wheat, Clock, Megaphone, Skull
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import BibleVersePopover from './BibleVersePopover';
import CatechismPopover from './CatechismPopover';
import { parseTheologicalReferences } from '@/lib/theologicalRefParser';

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
  journey_id?: string;
}

const FAITH_TERMS: FaithTerm[] = [
  { term: 'Abraão', definition: 'O pai da fé, chamado por Deus para sair de sua terra e ir para uma nova pátria.', reference: 'Gn 12,1-4', category: 'Patriarcas' },
  { term: 'Adão', definition: 'O primeiro homem criado por Deus, cuja queda trouxe o pecado ao mundo.', reference: 'Gn 2,7; 3,1-24', category: 'Criação' },
  { 
    term: 'Aliança', 
    definition: 'Compromisso solene entre Deus e o seu povo, renovado plenamente em Jesus Cristo.', 
    reference: 'Jr 31,31-34', 
    category: 'Teologia',
    deepInterpretation: 'A Aliança não é apenas um contrato legal, mas uma relação de amor esponsal. No Antigo Testamento, Deus estabelece alianças com Noé, Abraão, Moisés e Davi, cada uma expandindo o círculo da família de Deus. A Nova e Eterna Aliança é selada no Sangue de Cristo, unindo Deus e a humanidade de forma inseparável.',
    practicalApplication: 'Viver a aliança hoje significa renovar diariamente nossa fidelidade a Deus através da oração e do cumprimento dos mandamentos, não por obrigação, mas por amor àquele que nos amou primeiro.',
    bibleVerses: ['Gn 9,8-17 (Noé)', 'Gn 15 (Abraão)', 'Êx 19-24 (Moisés)', 'Lc 22,20 (Jesus)'],
    catechismReferences: ['§54-64 (As etapas da Revelação)', '§762 (A preparação da Igreja na AT)'],
    magisteriumReferences: ['Dei Verbum n. 2-4 (Revelação)', 'Lumen Gentium n. 9 (O Povo de Deus)'],
    journey_id: 'a0a0a0a0-0005-4000-8000-000000000001'
  },
  { term: 'Amém', definition: 'Palavra hebraica que significa "assim seja" ou "verdadeiramente".', reference: 'Ap 3,14', category: 'Liturgia' },
  { term: 'Amor', definition: 'Doação de si segundo Deus. A caridade que se dá sem esperar retorno, raiz de todas as virtudes.', reference: '1Cor 13', category: 'Virtudes',
    deepInterpretation: 'O amor cristão (ágape) não é sentimento, mas decisão. Deus é amor (1Jo 4,8). Toda a Lei se resume no mandamento do amor: amar a Deus sobre todas as coisas e ao próximo como a si mesmo.',
    practicalApplication: 'Pratique um ato de caridade anônimo hoje. Perdoe alguém que o magoou. Doe seu tempo a quem precisa.',
    bibleVerses: ['1Cor 13,4-7 (Hino do Amor)', '1Jo 4,7-8 (Deus é Amor)', 'Jo 15,12-13 (Mandamento novo)'],
    catechismReferences: ['§1822-1829 (A Caridade)', '§1604 (O Amor conjugal)'],
    magisteriumReferences: ['Deus Caritas Est (Bento XVI)', 'Amoris Laetitia (Papa Francisco)'],
    journey_id: 'a0a0a0a0-0001-4000-8000-000000000001'
  },
  { term: 'Anjo', definition: 'Mensageiro espiritual de Deus que atua na história da salvação.', reference: 'Hb 1,14', category: 'Seres Celestiais',
    deepInterpretation: 'Os anjos são criaturas puramente espirituais, dotadas de inteligência e vontade. Servem como mensageiros de Deus e guardiães dos homens. A palavra "anjo" vem do grego "angelos", que significa mensageiro.',
    practicalApplication: 'Reze ao seu Anjo da Guarda diariamente. Peça sua proteção e orientação nas decisões do dia.',
    bibleVerses: ['Hb 1,14 (Espíritos a serviço)', 'Sl 91,11-12 (Anjos guardiães)', 'Lc 1,26-28 (O Anjo Gabriel)'],
    catechismReferences: ['§328-336 (A existência dos anjos)', '§350-352 (Os anjos na vida da Igreja)'],
    magisteriumReferences: ['Lumen Gentium n. 49-50'],
  }
];

const EncyclopediaPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedTerm, setSelectedTerm] = useState<FaithTerm | null>(null);
  const navigate = useNavigate();

  const filteredTerms = useMemo(() => {
    return FAITH_TERMS.filter(t => 
      t.term.toLowerCase().includes(search.toLowerCase()) || 
      t.definition.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <SEOHead 
        title="Enciclopédia Católica Digital" 
        description="Acesse o conhecimento completo da fé católica de forma navegável e independente. Bíblia, Catecismo, Tradição e Magistério em um só lugar."
        path="/encyclopedia"
      />
      
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-black tracking-tight">Enciclopédia Católica</h1>
          <p className="text-muted-foreground">O conhecimento da fé ao seu alcance.</p>
          
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Buscar termo..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border bg-card"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTerms.map((term) => (
            <button 
              key={term.term}
              onClick={() => setSelectedTerm(term)}
              className="p-6 rounded-2xl border border-border bg-card text-left hover:border-primary transition-all"
            >
              <h3 className="font-bold text-lg">{term.term}</h3>
              <p className="text-sm text-muted-foreground mt-1">{term.definition}</p>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedTerm && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedTerm(null)}
          >
            <motion.div 
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-card border border-border p-8 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-3xl font-black">{selectedTerm.term}</h2>
                <button onClick={() => setSelectedTerm(null)}><X /></button>
              </div>
              <p className="text-lg mb-6">{selectedTerm.definition}</p>
              {selectedTerm.deepInterpretation && (
                <div className="space-y-4">
                  <h4 className="font-bold text-primary">Interpretação Profunda</h4>
                  <p className="text-sm text-muted-foreground">{selectedTerm.deepInterpretation}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EncyclopediaPage;
