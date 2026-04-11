import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../constants';
import SEOHead from '@/components/SEOHead';
import { AppRoute } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface FaithTerm {
  term: string;
  definition: string;
  reference?: string;
  category?: string;
}

const FAITH_TERMS: FaithTerm[] = [
  { term: 'Abraão', definition: 'O pai da fé, chamado por Deus para sair de sua terra e ir para uma nova pátria.', reference: 'Gn 12,1-4', category: 'Patriarcas' },
  { term: 'Adão', definition: 'O primeiro homem criado por Deus, cuja queda trouxe o pecado ao mundo.', reference: 'Gn 2,7; 3,1-24', category: 'Criação' },
  { term: 'Aliança', definition: 'Compromisso solene entre Deus e o seu povo, renovado plenamente em Jesus Cristo.', reference: 'Jr 31,31-34', category: 'Teologia' },
  { term: 'Anjo', definition: 'Mensageiro espiritual de Deus que atua na história da salvação.', reference: 'Hb 1,14', category: 'Seres Celestiais' },
  { term: 'Apocalipse', definition: 'Último livro da Bíblia, que revela a vitória final de Deus sobre o mal.', reference: 'Ap 1,1', category: 'Escatologia' },
  { term: 'Arca da Aliança', definition: 'Símbolo da presença de Deus entre o povo de Israel no deserto.', reference: 'Êx 25,10-22', category: 'Objetos Sagrados' },
  { term: 'Batismo', definition: 'Sacramento do novo nascimento pela água e pelo Espírito Santo.', reference: 'Mt 28,19; Jo 3,5', category: 'Sacramentos' },
  { term: 'Bem-aventuranças', definition: 'O cerne da pregação de Jesus, descrevendo a felicidade do Reino de Deus.', reference: 'Mt 5,3-12', category: 'Ensinamentos' },
  { term: 'Céu', definition: 'A morada eterna de Deus e dos que morrem na sua amizade.', reference: 'Ap 21,1-4', category: 'Escatologia' },
  { term: 'Cristo', definition: 'Título de Jesus que significa "Ungido", o Messias prometido.', reference: 'Mt 16,16', category: 'Cristologia' },
  { term: 'Deus', definition: 'O Criador e Senhor de todas as coisas, Pai de todos os homens.', reference: 'Gn 1,1; 1Jo 4,8', category: 'Teologia' },
  { term: 'Eucaristia', definition: 'O sacramento do Corpo e Sangue de Cristo, fonte e ápice da vida cristã.', reference: 'Lc 22,19-20', category: 'Sacramentos' },
  { term: 'Espírito Santo', definition: 'A terceira pessoa da Santíssima Trindade, o Paráclito prometido por Jesus.', reference: 'Jo 14,26', category: 'Teologia' },
  { term: 'Fé', definition: 'A virtude teologal pela qual cremos em Deus e em tudo o que Ele revelou.', reference: 'Hb 11,1', category: 'Virtudes' },
  { term: 'Graça', definition: 'O dom gratuito de Deus que nos torna participantes da sua vida divina.', reference: 'Ef 2,8', category: 'Teologia' },
  { term: 'Igreja', definition: 'O Povo de Deus reunido em Cristo, Corpo Místico de Cristo.', reference: 'Mt 16,18', category: 'Eclesiologia' },
  { term: 'Jesus', definition: 'O Filho de Deus feito homem para a nossa salvação.', reference: 'Mt 1,21', category: 'Cristologia' },
  { term: 'Maria', definition: 'A mãe de Jesus e mãe da Igreja, cheia de graça.', reference: 'Lc 1,26-38', category: 'Mariologia' },
  { term: 'Oração', definition: 'O diálogo de amor entre o homem e Deus.', reference: 'Mt 6,5-15', category: 'Espiritualidade' },
  { term: 'Pecado', definition: 'Uma ofensa a Deus, uma falta contra a razão, a verdade e a consciência reta.', reference: 'Rm 3,23', category: 'Moral' },
  { term: 'Reino de Deus', definition: 'A soberania de Deus que se manifesta na justiça, paz e alegria.', reference: 'Mc 1,15', category: 'Ensinamentos' },
  { term: 'Salvação', definition: 'A libertação do pecado e a vida eterna oferecidas por Cristo.', reference: 'At 4,12', category: 'Soteriologia' },
  { term: 'Trindade', definition: 'O mistério de um só Deus em três pessoas distintas: Pai, Filho e Espírito Santo.', reference: 'Mt 28,19', category: 'Teologia' },
  // Adding more terms to fill the alphabet a bit more
  { term: 'Beatitude', definition: 'O estado de suprema felicidade e bem-aventurança na presença de Deus.', reference: 'Mt 5,3', category: 'Teologia' },
  { term: 'Caridade', definition: 'A virtude teologal pela qual amamos a Deus sobre todas as coisas e ao próximo como a nós mesmos.', reference: '1Cor 13', category: 'Virtudes' },
  { term: 'Dogma', definition: 'Verdade de fé infalivelmente definida pela Igreja.', reference: 'Catecismo §88', category: 'Doutrina' },
  { term: 'Esperança', definition: 'Virtude teologal pela qual desejamos o Reino dos céus e a vida eterna.', reference: 'Hb 10,23', category: 'Virtudes' },
  { term: 'Gênesis', definition: 'Primeiro livro da Bíblia, que narra as origens do mundo e da humanidade.', reference: 'Gn 1,1', category: 'Livros Bíblicos' },
  { term: 'Humildade', definition: 'Virtude que consiste no reconhecimento da própria pequenez diante de Deus.', reference: 'Tg 4,6', category: 'Virtudes' },
  { term: 'Ídolo', definition: 'Qualquer coisa que ocupe o lugar de Deus no coração do homem.', reference: 'Ex 20,3-5', category: 'Moral' },
  { term: 'Jerusalém', definition: 'A cidade santa, centro da vida religiosa de Israel e símbolo da Igreja triunfante.', reference: 'Sl 122', category: 'Geografia Bíblica' },
  { term: 'Lei', definition: 'Os mandamentos dados por Deus a Moisés para guiar o povo.', reference: 'Ex 20', category: 'Moral' },
  { term: 'Missa', definition: 'A celebração do sacrifício eucarístico da Igreja.', reference: '1Cor 11,23-26', category: 'Liturgia' },
  { term: 'Natal', definition: 'Celebração do nascimento de Jesus Cristo, o Verbo encarnado.', reference: 'Lc 2,1-20', category: 'Liturgia' },
  { term: 'Orgulho', definition: 'O pecado de se considerar superior a Deus e aos outros.', reference: 'Pr 16,18', category: 'Moral' },
  { term: 'Páscoa', definition: 'A passagem de Jesus da morte para a vida, fundamento da nossa fé.', reference: '1Cor 15,3-4', category: 'Liturgia' },
  { term: 'Quaresma', definition: 'Tempo de preparação de quarenta dias para a celebração da Páscoa.', reference: 'Mt 4,1-11', category: 'Liturgia' },
  { term: 'Ressurreição', definition: 'A vitória de Cristo sobre a morte e a promessa da nossa própria vida eterna.', reference: 'Jo 11,25-26', category: 'Escatologia' },
  { term: 'Sacrifício', definition: 'Oferta feita a Deus como sinal de adoração e entrega.', reference: 'Hb 9,11-14', category: 'Teologia' },
  { term: 'Tabernáculo', definition: 'O lugar onde se guarda o Santíssimo Sacramento.', reference: 'Catecismo §1183', category: 'Objetos Sagrados' },
  { term: 'Unção', definition: 'Gesto de consagrar algo ou alguém derramando óleo.', reference: 'Tg 5,14-15', category: 'Sacramentos' },
  { term: 'Verbo', definition: 'A Palavra eterna de Deus que se fez carne em Jesus Cristo.', reference: 'Jo 1,1-14', category: 'Cristologia' },
  { term: 'Zelo', definition: 'Ardor e dedicação profunda às coisas de Deus.', reference: 'Sl 69,9', category: 'Espiritualidade' },
];

const AZFaithPage: React.FC = () => {
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
                            <h3 className="text-sm font-bold text-foreground">{t.term}</h3>
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
                              <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                                <p className="text-sm text-muted-foreground leading-relaxed font-serif">
                                  {t.definition}
                                </p>
                                {t.reference && (
                                  <div className="flex items-center gap-2 text-[10px] text-primary bg-primary/5 px-2 py-1.5 rounded-lg w-fit">
                                    <Icons.Book className="w-3 h-3" />
                                    <span className="font-bold">{t.reference}</span>
                                  </div>
                                )}
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
