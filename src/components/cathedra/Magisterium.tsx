import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import SacredImage from './SacredImage';
import DeepContentSection from './DeepContentSection';
import { toast } from 'sonner';
import { parseTheologicalReferences } from '@/lib/theologicalRefParser';
import Relatio from './Relatio';
import BibleVersePopover from './BibleVersePopover';
import CatechismPopover from './CatechismPopover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AudioButton from './AudioButton';
import { useNavigate } from 'react-router-dom';
import { getTabProps, getTabPanelProps, useTabNavigation } from './TabUtils';
import { useReadingMarks } from '@/hooks/useReadingMarks';
import ReadingControlPanel from './ReadingControlPanel';
import { useAutoFocus } from '@/hooks/useAutoFocus';
import { useRenderPerf } from '@/hooks/useRenderPerf';
import ContemplativeLayout from './ContemplativeLayout';
import ReadingMark from './ReadingMark';
import { CathedraCard } from './CathedraCard';
import { cn } from '@/lib/utils';
import {
  MAGISTERIUM_DOCUMENTS,
  MAGISTERIUM_CATEGORIES,
  MAGISTERIUM_THEMES,
  type MagisteriumDocument,
} from '@/data/magisterium-urls';

const SPIRITUAL_GUIDANCE = [
  {
    id: 'ansiedade',
    theme: 'Ansiedade',
    icon: <Icons.Activity className="w-spacing-md h-spacing-md" />,
    question: 'O que a Igreja diz sobre a ansiedade?',
    magisteriumAnswer: 'A confiança em Deus é o caminho da paz interior. "Não andeis ansiosos" não é um comando vazio — é um convite a entregar o peso ao único que pode carregá-lo.',
    sourceDoc: 'Gaudete et Exsultate §112',
    textoBase: 'Lançai sobre Ele todas as vossas preocupações, porque Ele cuida de vós. (1 Pe 5,7)',
    explicacao: 'A Igreja nos ensina que a ansiedade muitas vezes nasce da ilusão de que temos o controle total sobre nossas vidas. Confiar em Deus não é passividade, mas a sabedoria de fazer a nossa parte e deixar o resultado nas mãos de quem nos ama infinitamente.',
    interpretacaoProfunda: 'No Magistério, a paz não é apenas ausência de problemas, mas a presença de uma Certeza. O Papa Francisco em Gaudete et Exsultate nos lembra que a alegria cristã é acompanhada pelo senso de humor e pela confiança absoluta na Providência Divina.',
    aplicacaoPratica: 'Quando a ansiedade bater, pare por 30 segundos. Respire fundo e diga: "Jesus, eu confio em Vós". Repita isso até que seu coração sinta que o peso não é mais só seu.',
    reflexaoFinal: 'O que aconteceria se eu realmente acreditasse que Deus cuida de mim mais do que eu mesmo?',
    exercicio: 'Escreva em um papel tudo o que te preocupa hoje. Dobre o papel e coloque-o sob um crucifixo ou uma imagem de Maria, simbolizando que você entregou essas questões a Deus.',
    padh: '"Ansiedade é tentar prever…\no que só pode ser vivido."',
    innerQuestion: 'O que você está tentando resolver sem confiar?',
    relatedDocs: ['ge', 'ss', 'gs'],
  },
  {
    id: 'medo',
    theme: 'Medo',
    icon: <Icons.Sun className="w-spacing-md h-spacing-md" />,
    question: 'O que a Igreja diz sobre o medo?',
    magisteriumAnswer: 'O medo é humano, mas não deve governar. A presença de Deus é mais forte que qualquer escuridão. "Não temas, porque eu te resgatei."',
    sourceDoc: 'Spe Salvi §32',
    textoBase: 'Não temas, porque eu estou contigo; não te assustes, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a minha destra fiel. (Is 41,10)',
    explicacao: 'O medo é uma reação natural diante do desconhecido, mas na vida espiritual ele pode se tornar uma prisão. A Igreja nos recorda que o antídoto para o medo não é a coragem cega, mas a presença. Saber que não estamos sozinhos muda a perspectiva do perigo.',
    interpretacaoProfunda: 'Bento XVI em Spe Salvi ensina que a esperança cristã não é uma ideia, mas uma Pessoa. O medo perde seu poder quando encontramos a "Esperança que não decepciona". O Magistério destaca que o "Não Temas" de Jesus é o fundamento da liberdade cristã.',
    aplicacaoPratica: 'Identifique o seu maior medo hoje. Visualize-se entregando esse medo nas mãos de Jesus. Sinta o peso saindo dos seus ombros enquanto você repete: "O Senhor é minha luz e minha salvação, a quem temerei?"',
    reflexaoFinal: 'O que eu faria hoje se soubesse que Deus está segurando minha mão direita?',
    exercicio: 'Vá a uma igreja ou um lugar silencioso. Feche os olhos e respire a paz de Deus. Peça a graça de ver o mundo não através do medo, mas através da Providência.',
    padh: '"O medo cresce…\nonde a presença é esquecida."',
    innerQuestion: 'Onde você se sente sozinho diante do medo?',
    relatedDocs: ['ss', 'dce', 'lf'],
  },
  {
    id: 'proposito',
    theme: 'Propósito',
    icon: <Icons.Compass className="w-spacing-md h-spacing-md" />,
    question: 'Qual é o sentido da minha vida?',
    magisteriumAnswer: 'Cada pessoa tem uma vocação única. A santidade não é privilégio de poucos, mas chamado universal — é encontrar Deus no concreto da vida.',
    sourceDoc: 'Gaudete et Exsultate §14',
    textoBase: 'Antes de te formar no ventre materno, eu te conheci; antes de saíres do seio materno, eu te consagrei. (Jr 1,5)',
    explicacao: 'Encontrar o propósito não é descobrir um segredo escondido, mas responder a um chamado de amor. O Magistério ensina que nossa vocação fundamental é a santidade — ser a melhor versão de quem Deus nos criou para ser, servindo aos outros com nossos dons únicos.',
    interpretacaoProfunda: 'Gaudete et Exsultate nos mostra que a santidade "ao lado" (dos vizinhos, dos pais) é o verdadeiro propósito. Não precisamos de grandes feitos heroicos, mas de um grande amor nas pequenas coisas. O sentido da vida é tornar-se um dom.',
    aplicacaoPratica: 'Liste três coisas que você faz bem e que trazem alegria aos outros. Como você pode usar um desses talentos hoje para glorificar a Deus no seu trabalho ou na sua família?',
    reflexaoFinal: 'Se a minha vida fosse um livro escrito por Deus, qual seria o título do capítulo que estou vivendo agora?',
    exercicio: 'Durante o dia, em cada tarefa simples, diga: "Senhor, faço isso por Ti". Transforme o ordinário em oração e veja como o propósito brota da intenção.',
    padh: '"Força não é ausência de fraqueza…\né direção apesar dela."',
    innerQuestion: 'O que ainda te move quando tudo pesa?',
    relatedDocs: ['ge', 'lg', 'cv'],
  },
  {
    id: 'sofrimento',
    theme: 'Sofrimento',
    icon: <Icons.Cross className="w-spacing-md h-spacing-md" />,
    question: 'Por que existe sofrimento?',
    magisteriumAnswer: 'O sofrimento, quando unido à cruz de Cristo, tem poder redentor. Não é castigo, mas mistério de amor e transformação.',
    sourceDoc: 'Salvifici Doloris §19',
    textoBase: 'Completo na minha carne o que falta às tribulações de Cristo, pelo seu corpo, que é a Igreja. (Col 1,24)',
    explicacao: 'O sofrimento é o mistério mais profundo da existência humana. A Igreja não oferece uma explicação lógica, mas uma Presença na Cruz. O sofrimento não é um beco sem saída, mas uma ponte para uma intimidade maior com o Redentor.',
    interpretacaoProfunda: 'João Paulo II, em Salvifici Doloris, revela que o sofrimento liberta o amor. Ao sofrer com paciência e oferecimento, participamos da obra da salvação. O Magistério nos ensina que a dor transfigurada pela fé torna-se fonte de consolação para os outros.',
    aplicacaoPratica: 'Se você está sofrendo hoje, não tente entender o "porquê". Tente viver o "com quem". Ofereça sua dor por uma intenção específica (alguém doente, uma causa nobre). Isso dá um sentido sobrenatural à sua cruz.',
    reflexaoFinal: 'Eu permito que Deus me console na minha dor, ou me fecho na amargura?',
    exercicio: 'Contemple uma imagem do Cristo Crucificado por 5 minutos. Não diga nada. Apenas deixe que o olhar de Jesus encontre a sua dor e a acolha.',
    padh: '"A dor não veio destruir…\nveio revelar o que ainda é frágil."',
    innerQuestion: 'O que o sofrimento está tentando te ensinar?',
    relatedDocs: ['ss', 'ev', 'gs', 'sd'],
  },
  {
    id: 'relacionamentos',
    theme: 'Relacionamentos',
    icon: <Icons.Heart className="w-spacing-md h-spacing-md" />,
    question: 'Como amar de verdade?',
    magisteriumAnswer: 'O amor autêntico é dom de si mesmo. Não é posse, é entrega. A família é escola de amor e comunhão.',
    sourceDoc: 'Amoris Laetitia §89',
    textoBase: 'Nisto todos conhecerão que sois meus discípulos: se vos amardes uns aos outros. (Jo 13,35)',
    explicacao: 'Relacionamentos são o laboratório da santidade. Amar quem é difícil, perdoar setenta vezes sete, servir sem esperar retorno — este é o caminho cristão. A Igreja ensina que a comunhão humana é um reflexo da comunhão da Santíssima Trindade.',
    interpretacaoProfunda: 'Amoris Laetitia nos lembra que a perfeição não existe nas famílias, mas a misericórdia sim. O Magistério enfatiza que o diálogo, a paciência e a ternura são as ferramentas para construir vínculos eternos que resistem às tempestades do egoísmo.',
    aplicacaoPratica: 'Escolha uma pessoa com quem você tem dificuldade de se relacionar. Reze por ela hoje e, se possível, faça um pequeno gesto de gentileza sem que ela perceba.',
    reflexaoFinal: 'O meu jeito de amar atrai as pessoas para Deus ou as afasta?',
    exercicio: 'Pratique a "escuta profunda". Na próxima conversa, não pense na resposta enquanto o outro fala. Apenas acolha as palavras dele como um dom. Amar é, antes de tudo, dar atenção.',
    padh: '"Amar não é completar o outro…\né caminhar junto sem exigir destino."',
    innerQuestion: 'Você está amando ou controlando?',
    relatedDocs: ['al', 'dce', 'hv'],
  },
];

const DOCS_LIST = [
  // Encíclicas
  { id: 'rn', title: 'Rerum Novarum', type: 'Encíclica', author: 'Leão XIII', year: 1891, theme: ['Social', 'Trabalho'], summary: 'Sobre a condição dos operários e a questão social.' },
  { id: 'hv', title: 'Humanae Vitae', type: 'Encíclica', author: 'Paulo VI', year: 1968, theme: ['Vida', 'Família'], summary: 'Sobre a regulação da natalidade e o amor conjugal.' },
  { id: 'ls', title: 'Laudato Si\'', type: 'Encíclica', author: 'Francisco', year: 2015, theme: ['Ecologia', 'Criação'], summary: 'Sobre o cuidado da casa comum.' },
  { id: 'ft', title: 'Fratelli Tutti', type: 'Encíclica', author: 'Francisco', year: 2020, theme: ['Fraternidade', 'Social'], summary: 'Sobre a fraternidade e a amizade social.' },
  { id: 'rh', title: 'Redemptor Hominis', type: 'Encíclica', author: 'João Paulo II', year: 1979, theme: ['Cristologia', 'Antropologia'], summary: 'O Redentor do homem, centro do cosmos e da história.' },
  { id: 'vs', title: 'Veritatis Splendor', type: 'Encíclica', author: 'João Paulo II', year: 1993, theme: ['Moral', 'Verdade'], summary: 'Sobre algumas questões fundamentais do ensinamento moral da Igreja.' },
  { id: 'fr', title: 'Fides et Ratio', type: 'Encíclica', author: 'João Paulo II', year: 1998, theme: ['Fé', 'Razão'], summary: 'Sobre as relações entre fé e razão.' },
  { id: 'dce', title: 'Deus Caritas Est', type: 'Encíclica', author: 'Bento XVI', year: 2005, theme: ['Amor', 'Caridade'], summary: 'Sobre o amor cristão.' },
  { id: 'ss', title: 'Spe Salvi', type: 'Encíclica', author: 'Bento XVI', year: 2007, theme: ['Esperança', 'Escatologia'], summary: 'Sobre a esperança cristã.' },
  { id: 'civ', title: 'Caritas in Veritate', type: 'Encíclica', author: 'Bento XVI', year: 2009, theme: ['Social', 'Desenvolvimento'], summary: 'Sobre o desenvolvimento humano integral na caridade e na verdade.' },
  { id: 'lf', title: 'Lumen Fidei', type: 'Encíclica', author: 'Francisco', year: 2013, theme: ['Fé'], summary: 'Sobre a luz da fé.' },
  { id: 'ev', title: 'Evangelium Vitae', type: 'Encíclica', author: 'João Paulo II', year: 1995, theme: ['Vida'], summary: 'Sobre o valor e a inviolabilidade da vida humana.' },
  { id: 'ge', title: 'Gaudete et Exsultate', type: 'Exortação Apostólica', author: 'Francisco', year: 2018, theme: ['Santidade'], summary: 'Sobre o chamado à santidade no mundo atual.' },
  { id: 'al', title: 'Amoris Laetitia', type: 'Exortação Apostólica', author: 'Francisco', year: 2016, theme: ['Família', 'Amor'], summary: 'Sobre o amor na família.' },
  { id: 'cv', title: 'Christus Vivit', type: 'Exortação Apostólica', author: 'Francisco', year: 2019, theme: ['Jovens', 'Vocação'], summary: 'Exortação aos jovens e a todo o Povo de Deus.' },
  { id: 'sd', title: 'Salvifici Doloris', type: 'Carta Apostólica', author: 'João Paulo II', year: 1984, theme: ['Sofrimento'], summary: 'Sobre o sentido cristão do sofrimento humano.' },
  
  // Constituições
  { id: 'lg', title: 'Lumen Gentium', type: 'Constituição', author: 'Concílio Vaticano II', year: 1964, theme: ['Eclesiologia'], summary: 'Constituição Dogmática sobre a Igreja.' },
  { id: 'dv', title: 'Dei Verbum', type: 'Constituição', author: 'Concílio Vaticano II', year: 1965, theme: ['Revelação', 'Bíblia'], summary: 'Constituição Dogmática sobre a Revelação Divina.' },
  { id: 'sc', title: 'Sacrosanctum Concilium', type: 'Constituição', author: 'Concílio Vaticano II', year: 1963, theme: ['Liturgia'], summary: 'Constituição sobre a Sagrada Liturgia.' },
  { id: 'gs', title: 'Gaudium et Spes', type: 'Constituição', author: 'Concílio Vaticano II', year: 1965, theme: ['Social', 'Mundo'], summary: 'Constituição Pastoral sobre a Igreja no mundo atual.' },
  
  // Cartas Apostólicas
  { id: 'pc', title: 'Patris Corde', type: 'Carta Apostólica', author: 'Francisco', year: 2020, theme: ['São José', 'Paternidade'], summary: 'Com coração de pai: no 150º aniversário da declaração de São José como Padroeiro da Igreja Universal.' },
  { id: 'mm', title: 'Misericordia et Misera', type: 'Carta Apostólica', author: 'Francisco', year: 2016, theme: ['Misericórdia'], summary: 'No termo do Jubileu Extraordinário da Misericórdia.' },
  { id: 'rvm', title: 'Rosarium Virginis Mariae', type: 'Carta Apostólica', author: 'João Paulo II', year: 2002, theme: ['Maria', 'Rosário'], summary: 'Sobre o Santo Rosário.' },
  { id: 'dd', title: 'Dies Domini', type: 'Carta Apostólica', author: 'João Paulo II', year: 1998, theme: ['Domingo', 'Eucaristia'], summary: 'Sobre a santificação do domingo.' },
  { id: 'md', title: 'Mulieris Dignitatem', type: 'Carta Apostólica', author: 'João Paulo II', year: 1988, theme: ['Mulher', 'Dignidade'], summary: 'Sobre a dignidade e a vocação da mulher.' },
  
  // Documentos Oficiais
  { id: 'cic', title: 'Catecismo da Igreja Católica', type: 'Documento Oficial', author: 'João Paulo II', year: 1992, theme: ['Doutrina', 'Fé'], summary: 'Exposição sistemática da fé e da doutrina católica.' },
  { id: 'cdsi', title: 'Compêndio da Doutrina Social', type: 'Documento Oficial', author: 'Pontifício Conselho Justiça e Paz', year: 2004, theme: ['Social', 'Moral'], summary: 'Apresentação orgânica do ensinamento social da Igreja.' },
  { id: 'cdc', title: 'Código de Direito Canônico', type: 'Documento Oficial', author: 'João Paulo II', year: 1983, theme: ['Direito', 'Disciplina'], summary: 'Corpo legislativo fundamental para a Igreja latina.' },
  { id: 'di', title: 'Dominus Iesus', type: 'Documento Oficial', author: 'CDF (Bento XVI)', year: 2000, theme: ['Ecumenismo', 'Salvação'], summary: 'Sobre a unicidade e a universalidade salvífica de Jesus Cristo e da Igreja.' },
];

const THEMES = Array.from(new Set(DOCS_LIST.flatMap(d => d.theme))).sort();

const Magisterium: React.FC = () => {
  useRenderPerf('Magisterium', 15);
  const navigate = useNavigate();
  useAutoFocus();
  const { handleKeyDown: handleTabKeyDown } = useTabNavigation();
  const { saveLastRead, getLastRead } = useReadingMarks();
  const [lastReadMark, setLastReadMark] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('guidance');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  
  const [selectedGuidance, setSelectedGuidance] = useState(SPIRITUAL_GUIDANCE[0]);
  const activeGuidanceIndex = SPIRITUAL_GUIDANCE.findIndex(g => g.id === selectedGuidance.id);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [shouldAutoResume, setShouldAutoResume] = useState(() => {
    const topic = new URLSearchParams(window.location.search).get('topic');
    const doc = new URLSearchParams(window.location.search).get('doc');
    return !(topic || doc);
  });

  useEffect(() => {
    const topicParam = new URLSearchParams(window.location.search).get('topic');
    const docParam = new URLSearchParams(window.location.search).get('doc');

    if (topicParam || docParam) {
      if (topicParam) {
        const found = SPIRITUAL_GUIDANCE.find(g => g.id === topicParam);
        if (found) setSelectedGuidance(found);
      }
      return;
    }

    const fetchLastRead = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return;

      const { data } = await supabase
        .from('reading_marks')
        .select('*')
        .eq('user_id', user.id)
        .eq('content_type', 'magisterium')
        .eq('is_last_read', true)
        .maybeSingle();

      if (data) {
        setLastReadMark(data);
        if (shouldAutoResume && data.content_id) {
          const found = SPIRITUAL_GUIDANCE.find(g => g.id === data.content_id);
          if (found) {
            setSelectedGuidance(found);
            toast.info(`Retornando ao tema: ${found.theme}`, {
              description: 'Sua leitura foi retomada de onde você parou.',
              duration: 3000
            });
          }
        }
      }
      setShouldAutoResume(false);
    };
    fetchLastRead();
  }, [shouldAutoResume]);

  const MemoizedRelatio = useMemo(() => {
    if (activeTab !== 'guidance' || !selectedGuidance) return null;
    return (
      <Relatio 
        context={{ 
          type: 'magisterium', 
          id: selectedGuidance.id,
          tags: [selectedGuidance.theme, 'Magistério']
        }}
        onNavigateToBible={(abbr, ch) => navigate(`/bible?book=${abbr}&ch=${ch}`)}
        onNavigateToCIC={(p) => navigate(`/catechism?p=${p}`)}
        onSelectLogosQuery={(prompt) => {
          // In this view we don't have the drawer integrated directly as state
          // but we can navigate with a prompt if needed or just show a toast for now
          // Actually, let's just use the toast or a custom event
          window.dispatchEvent(new CustomEvent('open-logos-ai', { detail: { prompt, context: selectedGuidance.theme } }));
        }}
      />
    );
  }, [activeTab, selectedGuidance, navigate]);

  const filteredDocs = useMemo(() => {
    return DOCS_LIST.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           doc.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTheme = !selectedTheme || doc.theme.includes(selectedTheme);
      return matchesSearch && matchesTheme;
    });
  }, [searchQuery, selectedTheme]);

  const handleSelectGuidance = (item: typeof SPIRITUAL_GUIDANCE[0]) => {
    if (selectedGuidance.id === item.id) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedGuidance(item);
      setIsTransitioning(false);
      
      // Auto-save progress
      saveLastRead({
        content_type: 'magisterium',
        content_id: item.id,
        label: `Guia: ${item.theme}`,
        url: `/magisterium?topic=${item.id}`
      });
    }, 300);
  };

  return (
    <ContemplativeLayout
      subtitle="Magisterium Ecclesiae"
      title="Magistério"
      icon={Icons.ScrollText}
    >
      <SEOHead 
        title="Magistério da Igreja | Cathedra" 
        description="Acesse os documentos fundamentais da Igreja Católica em uma experiência premium." 
        path="/magisterium"
        type="collection"
      />
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Magistério da Igreja Católica",
          "description": "Coleção de encíclicas, constituições e documentos oficiais da Igreja.",
          "publisher": {
            "@type": "Organization",
            "name": "Cathedra Digital"
          }
        })}
      </script>

      <div className="w-full space-y-spacing-2xl pb-spacing-4xl">
        {/* Unified Search & Filters */}
        <div className="space-y-spacing-xl">
          <div className="relative group w-full">
            <div className="absolute inset-0 bg-primary/[0.01] blur-xl rounded-premium-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <Icons.Search className="absolute left-spacing-lg top-spacing-2xs/2 -translate-y-1/2 w-spacing-md h-spacing-md text-primary/20 group-focus-within:text-primary transition-all duration-700" />
            <input
              placeholder="Buscar documento, autor ou tema..." 
              className="search-input-premium pl-spacing-3xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-center gap-spacing-xs overflow-x-auto no-scrollbar py-spacing-xs">
            <Button 
              variant="ghost"
              className={`rounded-premium-full px-spacing-lg py-spacing-xs text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-700 ${selectedTheme === null ? 'bg-primary text-white shadow-premium scale-[1.05]' : 'text-primary/40 hover:text-primary'}`}
              onClick={() => setSelectedTheme(null)}
            >
              Todos os Temas
            </Button>
            {THEMES.slice(0, 6).map(theme => (
              <Button 
                key={theme}
                variant="ghost"
                className={`rounded-premium-full px-spacing-lg py-spacing-xs text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-700 ${selectedTheme === theme ? 'bg-primary text-white shadow-premium scale-[1.05]' : 'text-primary/40 hover:text-primary'}`}
                onClick={() => setSelectedTheme(theme)}
              >
                {theme}
              </Button>
            ))}
          </div>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-md w-full">
          {filteredDocs.map((doc, idx) => (
            <CathedraCard
              key={doc.id}
              variant="interactive"
              padding="none"
              onClick={() => navigate(`/magisterium/${doc.id}`)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group h-full"
            >
              <div className="p-spacing-md flex flex-col gap-spacing-md h-full text-left">
                <div className="flex justify-between items-start">
                  <div className="w-spacing-xl h-spacing-xl rounded-premium bg-primary/[0.02] border border-primary/5 flex items-center justify-center text-primary/60 group-hover:text-primary transition-colors">
                    {doc.type === 'Encíclica' ? <Icons.Scroll className="w-spacing-md h-spacing-md" strokeWidth={1} /> : <Icons.FileText className="w-spacing-md h-spacing-md" strokeWidth={1} />}
                  </div>
                  <span className="text-[8px] font-black text-secondary/30 tracking-widest">{doc.year}</span>
                </div>

                <div className="space-y-spacing-xs flex-1">
                  <h3 className="text-premium-lg font-display font-light text-foreground/80 group-hover:text-primary transition-colors leading-snug">{doc.title}</h3>
                  <p className="text-[8px] font-black text-primary/30 uppercase tracking-[0.2em]">{doc.author}</p>
                  <p className="text-[10px] text-muted-foreground/40 italic line-clamp-spacing-xs leading-relaxed">{doc.summary}</p>
                </div>

                <div className="flex flex-wrap gap-spacing-2xs pt-spacing-sm border-t border-primary/[0.03] opacity-0 group-hover:opacity-100 transition-all">
                  {doc.theme.map(t => (
                    <span key={t} className="text-[6px] font-black text-primary/30 uppercase tracking-[0.1em] bg-primary/[0.01] px-spacing-2xs py-spacing-3xs rounded-premium-full">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </CathedraCard>
          ))}
        </div>

        {filteredDocs.length === 0 && (
          <div className="text-center py-spacing-4xl opacity-20">
            <Icons.Search className="w-spacing-2xl h-spacing-2xl mx-auto mb-spacing-md" strokeWidth={0.5} />
            <p className="font-serif italic text-premium-sm">Nenhum documento encontrado no silêncio da busca.</p>
          </div>
        )}
      </div>
    </ContemplativeLayout>
  );
};

export default Magisterium;
