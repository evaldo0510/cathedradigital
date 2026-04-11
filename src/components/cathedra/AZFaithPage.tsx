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
  deepInterpretation?: string;
  practicalApplication?: string;
  bibleVerses?: string[];
  catechismReferences?: string[];
  magisteriumReferences?: string[];
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
    magisteriumReferences: ['Dei Verbum n. 2-4 (Revelação)', 'Lumen Gentium n. 9 (O Povo de Deus)']
  },
  { term: 'Anjo', definition: 'Mensageiro espiritual de Deus que atua na história da salvação.', reference: 'Hb 1,14', category: 'Seres Celestiais' },
  { term: 'Apocalipse', definition: 'Último livro da Bíblia, que revela a vitória final de Deus sobre o mal.', reference: 'Ap 1,1', category: 'Escatologia' },
  { term: 'Arca da Aliança', definition: 'Símbolo da presença de Deus entre o povo de Israel no deserto.', reference: 'Êx 25,10-22', category: 'Objetos Sagrados' },
  { 
    term: 'Batismo', 
    definition: 'Sacramento do novo nascimento pela água e pelo Espírito Santo.', 
    reference: 'Mt 28,19; Jo 3,5', 
    category: 'Sacramentos',
    deepInterpretation: 'Pelo Batismo, somos libertos do pecado e regenerados como filhos de Deus, tornando-nos membros de Cristo e incorporados à Igreja. É a porta da vida espiritual e o fundamento de toda a vida cristã, imprimindo na alma um caráter espiritual indelével.',
    practicalApplication: 'Honrar nosso batismo significa viver como verdadeiros filhos de Deus no mundo, sendo sal da terra e luz do mundo, e participando ativamente da missão evangelizadora da Igreja.',
    bibleVerses: ['Jo 3,5 (Nascimento da água e Espírito)', 'Mt 28,19 (Mandato missionário)', 'Rm 6,3-4 (Morte e Ressurreição com Cristo)'],
    catechismReferences: ['§1213-1284 (O Sacramento do Batismo)', '§1267 (Membros do Corpo de Cristo)'],
    magisteriumReferences: ['Ad Gentes n. 14 (Iniciação Cristã)', 'Lumen Gentium n. 11 (O exercício do sacerdócio comum)']
  },
  { term: 'Bem-aventuranças', definition: 'O cerne da pregação de Jesus, descrevendo a felicidade do Reino de Deus.', reference: 'Mt 5,3-12', category: 'Ensinamentos' },
  { term: 'Céu', definition: 'A morada eterna de Deus e dos que morrem na sua amizade.', reference: 'Ap 21,1-4', category: 'Escatologia' },
  { term: 'Cristo', definition: 'Título de Jesus que significa "Ungido", o Messias prometido.', reference: 'Mt 16,16', category: 'Cristologia' },
  { term: 'Deus', definition: 'O Criador e Senhor de todas as coisas, Pai de todos os homens.', reference: 'Gn 1,1; 1Jo 4,8', category: 'Teologia' },
  { 
    term: 'Eucaristia', 
    definition: 'O sacramento do Corpo e Sangue de Cristo, fonte e ápice da vida cristã.', 
    reference: 'Lc 22,19-20', 
    category: 'Sacramentos',
    deepInterpretation: 'A Eucaristia é o próprio sacrifício do Corpo e do Sangue do Senhor Jesus, que Ele instituiu para perpetuar o sacrifício da cruz ao longo dos séculos. É o memorial de sua Morte e Ressurreição, o sinal da unidade e o vínculo da caridade.',
    practicalApplication: 'A participação frequente na Missa e a adoração eucarística nos transformam naquilo que recebemos, dando-nos força para amar e servir aos irmãos, especialmente os mais pobres.',
    bibleVerses: ['Jo 6,51-58 (O Pão da Vida)', '1Cor 11,23-26 (A Instituição)', 'Lc 24,30-35 (Emaús)'],
    catechismReferences: ['§1322-1419 (O Sacramento da Eucaristia)', '§1324 (Fonte e Ápice)'],
    magisteriumReferences: ['Sacrosanctum Concilium n. 47-48 (O Mistério Eucarístico)', 'Ecclesia de Eucharistia (João Paulo II)']
  },
  { term: 'Espírito Santo', definition: 'A terceira pessoa da Santíssima Trindade, o Paráclito prometido por Jesus.', reference: 'Jo 14,26', category: 'Teologia' },
  { 
    term: 'Fé', 
    definition: 'A virtude teologal pela qual cremos em Deus e em tudo o que Ele revelou.', 
    reference: 'Hb 11,1', 
    category: 'Virtudes',
    deepInterpretation: 'A fé é, antes de tudo, uma adesão pessoal do homem a Deus; é, ao mesmo tempo e inseparavelmente, o assentimento livre a toda a verdade que Deus revelou. É um dom sobrenatural de Deus, que exige a cooperação livre da vontade humana.',
    practicalApplication: 'Cultivar a fé através do estudo da Palavra, da oração constante e da prática da caridade, confiando em Deus mesmo nos momentos de escuridão e provação.',
    bibleVerses: ['Hb 11 (Os heróis da fé)', 'Rm 1,17 (O justo viverá pela fé)', 'Tg 2,14-26 (Fé e Obras)'],
    catechismReferences: ['§142-184 (A Resposta do homem a Deus)', '§1814-1816 (A virtude da Fé)'],
    magisteriumReferences: ['Lumen Fidei (Papa Francisco)', 'Fides et Ratio (João Paulo II)']
  },
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
  { term: 'Zaqueu', definition: 'O cobrador de impostos que subiu num sicômoro para ver Jesus e teve sua vida transformada.', reference: 'Lc 19,1-10', category: 'Personagens Bíblicos' },
  { term: 'Zacarias', definition: 'Pai de João Batista, que ficou mudo até o nascimento de seu filho.', reference: 'Lc 1,5-25', category: 'Personagens Bíblicos' },
  { term: 'Yaveh', definition: 'O nome próprio de Deus revelado a Moisés no deserto.', reference: 'Ex 3,14', category: 'Teologia' },
  { term: 'Xerxes', definition: 'Rei da Pérsia mencionado no livro de Ester.', reference: 'Et 1,1', category: 'Personagens Bíblicos' },
  { term: 'Vulgata', definition: 'A tradução da Bíblia para o latim feita por São Jerônimo.', reference: 'História da Igreja', category: 'Tradição' },
  { term: 'Vaticano', definition: 'O centro administrativo e espiritual da Igreja Católica.', reference: 'Eclesiologia', category: 'Eclesiologia' },
  { term: 'Urim e Tumim', definition: 'Objetos usados pelos sacerdotes de Israel para consultar a vontade de Deus.', reference: 'Ex 28,30', category: 'Objetos Sagrados' },
  { term: 'Teologia', definition: 'O estudo sistemático sobre Deus e as verdades da fé.', reference: 'Teologia', category: 'Ciência Sagrada' },
  { term: 'Sinagoga', definition: 'Lugar de reunião e oração para os judeus.', reference: 'Lc 4,16', category: 'Lugares Sagrados' },
  { term: 'Sábado', definition: 'O dia de descanso consagrado a Deus no Antigo Testamento.', reference: 'Ex 20,8-11', category: 'Lei' },
  { term: 'Romanos', definition: 'Uma das principais cartas de São Paulo, tratando da justificação pela fé.', reference: 'Rm 1,1', category: 'Livros Bíblicos' },
  { term: 'Religião', definition: 'O conjunto de crenças e práticas que ligam o homem a Deus.', reference: 'Tg 1,27', category: 'Teologia' },
  { term: 'Querubim', definition: 'Classe de seres angelicais associados à presença e glória de Deus.', reference: 'Ez 10', category: 'Seres Celestiais' },
  { term: 'Profeta', definition: 'Aquele que fala em nome de Deus para o povo.', reference: 'Is 1,1', category: 'Ministérios' },
  { term: 'Purgatório', definition: 'Estado de purificação final dos que morrem na amizade de Deus.', reference: '2Mc 12,45', category: 'Escatologia' },
  { term: 'Pentecostes', definition: 'A descida do Espírito Santo sobre os apóstolos reunidos no Cenáculo.', reference: 'At 2,1-4', category: 'Liturgia' },
  { term: 'Parábola', definition: 'História contada por Jesus para ensinar verdades espirituais.', reference: 'Mt 13', category: 'Ensinamentos' },
  { term: 'Noé', definition: 'O patriarca que construiu a arca para salvar sua família e os animais do dilúvio.', reference: 'Gn 6-9', category: 'Patriarcas' },
  { term: 'Moisés', definition: 'O grande profeta e legislador que libertou Israel do Egito.', reference: 'Ex 3', category: 'Patriarcas' },
  { term: 'Misticismo', definition: 'A busca pela união íntima e direta com o divino através da oração e contemplação.', reference: 'Espiritualidade', category: 'Espiritualidade' },
  { term: 'Liturgia', definition: 'O culto público e oficial da Igreja.', reference: 'Liturgia', category: 'Liturgia' },
  { term: 'Lázaro', definition: 'O amigo de Jesus que foi ressuscitado após quatro dias no túmulo.', reference: 'Jo 11', category: 'Personagens Bíblicos' },
  { term: 'Kerygma', definition: 'O anúncio fundamental da mensagem cristã: a morte e ressurreição de Jesus.', reference: 'At 2,22-24', category: 'Teologia' },
  { term: 'Job', definition: 'O homem justo que sofreu provações imensas mas manteve sua fé em Deus.', reference: 'Jó 1', category: 'Personagens Bíblicos' },
  { term: 'Isabel', definition: 'Mãe de João Batista e parente de Maria.', reference: 'Lc 1,5', category: 'Personagens Bíblicos' },
  { term: 'Imaculada Conceição', definition: 'O dogma de que Maria foi preservada do pecado original desde o primeiro instante de sua existência.', reference: 'Dogma', category: 'Mariologia' },
  { term: 'Heresia', definition: 'A negação ou dúvida obstinada de uma verdade que se deve crer com fé divina e católica.', reference: 'Doutrina', category: 'Moral' },
  { term: 'Gloria', definition: 'O resplendor da santidade e majestade de Deus.', reference: 'Ex 33,18-23', category: 'Teologia' },
  { term: 'Franciscano', definition: 'Relativo à ordem religiosa fundada por São Francisco de Assis.', reference: 'Tradição', category: 'Ordens Religiosas' },
  { term: 'Evangelização', definition: 'A missão de anunciar o Evangelho a todas as criaturas.', reference: 'Mc 16,15', category: 'Missão' },
  { term: 'Elias', definition: 'Um dos maiores profetas de Israel, arrebatado ao céu em um carro de fogo.', reference: '2Rs 2,11', category: 'Profetas' },
  { term: 'Discípulo', definition: 'Aquele que segue Jesus e aprende seus ensinamentos.', reference: 'Mt 28,19', category: 'Seguimento' },
  { term: 'Diácono', definition: 'Ministro ordenado para o serviço da caridade e da palavra.', reference: 'At 6,1-6', category: 'Ministérios' },
  { term: 'Cântico dos Cânticos', definition: 'Livro bíblico que celebra o amor humano como reflexo do amor divino.', reference: 'Ct 1,1', category: 'Livros Bíblicos' },
  { term: 'Cáritas', definition: 'O amor cristão traduzido em obras de misericórdia.', reference: '1Cor 13', category: 'Virtudes' },
  { term: 'Batista', definition: 'Aquele que batiza, título dado a João, o precursor de Jesus.', reference: 'Mt 3,1', category: 'Personagens Bíblicos' },
  { term: 'Babilônia', definition: 'Símbolo do exílio de Israel e do poder mundano oposto a Deus.', reference: 'Sl 137', category: 'Geografia Bíblica' },
  { term: 'Apóstolo', definition: 'Um dos doze escolhidos por Jesus para serem testemunhas de sua ressurreição.', reference: 'Lc 6,13', category: 'Ministérios' },
  { term: 'Amém', definition: 'Palavra hebraica que significa "assim seja" ou "verdadeiramente".', reference: 'Ap 3,14', category: 'Liturgia' },
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
                                      navigate(`${AppRoute.STUDY}?topic=${encodeURIComponent(t.term)}`);
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
