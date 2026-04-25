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

const SPIRITUAL_GUIDANCE = [
  {
    id: 'ansiedade',
    theme: 'Ansiedade',
    icon: <Icons.Activity className="w-5 h-5" />,
    question: 'O que a Igreja diz sobre a ansiedade?',
    magisteriumAnswer: 'A confiança em Deus é o caminho da paz interior. "Não andeis ansiosos" não é um comando vazio — é um convite a entregar o peso ao único que pode carregá-lo.',
    sourceDoc: 'Gaudete et Exsultate §112',
    textoBase: 'Lançai sobre Ele todas as vossas preocupações, porque Ele cuida de vós. (1 Pe 5,7)',
    explicacao: 'A Igreja nos ensina que a ansiedade muitas vezes nasce da ilusão de que temos o controle total sobre nossas vidas. Confiar em Deus não é passividade, mas a sabedoria de fazer a nossa parte e deixar o resultado nas mãos de quem nos ama infinitamente.',
    interpretacaoProfunda: 'No Magistério, a paz não é apenas ausência de problemas, mas a presença de uma Certeza. O Papa Francisco em Gaudete et Exsultate nos lembra que a alegria cristã é acompanhada pelo senso de humor e pela confiança absoluta na Providência Divina.',
    aplicacaoPratica: 'Quando a ansiedade bater, pare por 30 segundos. Respire fundo e diga: "Jesus, eu confio em Vós". Repita isso até que seu coração sinta que o peso não é mais só seu.',
    reflexaoFinal: 'O que aconteceria se eu realmente acreditasse que Deus cuida de mim mais do que eu mesmo?',
    exercicio: 'Escreva em um papel tudo o que te preocupa hoje. Dobre o papel e coloque-o sob um crucifixo ou uma imagem de Maria, simbolizando que você entregou essas questões a Deus.',
    pch: '"Ansiedade é tentar prever…\no que só pode ser vivido."',
    innerQuestion: 'O que você está tentando resolver sem confiar?',
    relatedDocs: ['ge', 'ss', 'gs'],
  },
  {
    id: 'medo',
    theme: 'Medo',
    icon: <Icons.Sun className="w-5 h-5" />,
    question: 'O que a Igreja diz sobre o medo?',
    magisteriumAnswer: 'O medo é humano, mas não deve governar. A presença de Deus é mais forte que qualquer escuridão. "Não temas, porque eu te resgatei."',
    sourceDoc: 'Spe Salvi §32',
    textoBase: 'Não temas, porque eu estou contigo; não te assustes, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a minha destra fiel. (Is 41,10)',
    explicacao: 'O medo é uma reação natural diante do desconhecido, mas na vida espiritual ele pode se tornar uma prisão. A Igreja nos recorda que o antídoto para o medo não é a coragem cega, mas a presença. Saber que não estamos sozinhos muda a perspectiva do perigo.',
    interpretacaoProfunda: 'Bento XVI em Spe Salvi ensina que a esperança cristã não é uma ideia, mas uma Pessoa. O medo perde seu poder quando encontramos a "Esperança que não decepciona". O Magistério destaca que o "Não Temas" de Jesus é o fundamento da liberdade cristã.',
    aplicacaoPratica: 'Identifique o seu maior medo hoje. Visualize-se entregando esse medo nas mãos de Jesus. Sinta o peso saindo dos seus ombros enquanto você repete: "O Senhor é minha luz e minha salvação, a quem temerei?"',
    reflexaoFinal: 'O que eu faria hoje se soubesse que Deus está segurando minha mão direita?',
    exercicio: 'Vá a uma igreja ou um lugar silencioso. Feche os olhos e respire a paz de Deus. Peça a graça de ver o mundo não através do medo, mas através da Providência.',
    pch: '"O medo cresce…\nonde a presença é esquecida."',
    innerQuestion: 'Onde você se sente sozinho diante do medo?',
    relatedDocs: ['ss', 'dce', 'lf'],
  },
  {
    id: 'proposito',
    theme: 'Propósito',
    icon: <Icons.Compass className="w-5 h-5" />,
    question: 'Qual é o sentido da minha vida?',
    magisteriumAnswer: 'Cada pessoa tem uma vocação única. A santidade não é privilégio de poucos, mas chamado universal — é encontrar Deus no concreto da vida.',
    sourceDoc: 'Gaudete et Exsultate §14',
    textoBase: 'Antes de te formar no ventre materno, eu te conheci; antes de saíres do seio materno, eu te consagrei. (Jr 1,5)',
    explicacao: 'Encontrar o propósito não é descobrir um segredo escondido, mas responder a um chamado de amor. O Magistério ensina que nossa vocação fundamental é a santidade — ser a melhor versão de quem Deus nos criou para ser, servindo aos outros com nossos dons únicos.',
    interpretacaoProfunda: 'Gaudete et Exsultate nos mostra que a santidade "ao lado" (dos vizinhos, dos pais) é o verdadeiro propósito. Não precisamos de grandes feitos heroicos, mas de um grande amor nas pequenas coisas. O sentido da vida é tornar-se um dom.',
    aplicacaoPratica: 'Liste três coisas que você faz bem e que trazem alegria aos outros. Como você pode usar um desses talentos hoje para glorificar a Deus no seu trabalho ou na sua família?',
    reflexaoFinal: 'Se a minha vida fosse um livro escrito por Deus, qual seria o título do capítulo que estou vivendo agora?',
    exercicio: 'Durante o dia, em cada tarefa simples, diga: "Senhor, faço isso por Ti". Transforme o ordinário em oração e veja como o propósito brota da intenção.',
    pch: '"Força não é ausência de fraqueza…\né direção apesar dela."',
    innerQuestion: 'O que ainda te move quando tudo pesa?',
    relatedDocs: ['ge', 'lg', 'cv'],
  },
  {
    id: 'sofrimento',
    theme: 'Sofrimento',
    icon: <Icons.Cross className="w-5 h-5" />,
    question: 'Por que existe sofrimento?',
    magisteriumAnswer: 'O sofrimento, quando unido à cruz de Cristo, tem poder redentor. Não é castigo, mas mistério de amor e transformação.',
    sourceDoc: 'Salvifici Doloris §19',
    textoBase: 'Completo na minha carne o que falta às tribulações de Cristo, pelo seu corpo, que é a Igreja. (Col 1,24)',
    explicacao: 'O sofrimento é o mistério mais profundo da existência humana. A Igreja não oferece uma explicação lógica, mas uma Presença na Cruz. O sofrimento não é um beco sem saída, mas uma ponte para uma intimidade maior com o Redentor.',
    interpretacaoProfunda: 'João Paulo II, em Salvifici Doloris, revela que o sofrimento liberta o amor. Ao sofrer com paciência e oferecimento, participamos da obra da salvação. O Magistério nos ensina que a dor transfigurada pela fé torna-se fonte de consolação para os outros.',
    aplicacaoPratica: 'Se você está sofrendo hoje, não tente entender o "porquê". Tente viver o "com quem". Ofereça sua dor por uma intenção específica (alguém doente, uma causa nobre). Isso dá um sentido sobrenatural à sua cruz.',
    reflexaoFinal: 'Eu permito que Deus me console na minha dor, ou me fecho na amargura?',
    exercicio: 'Contemple uma imagem do Cristo Crucificado por 5 minutos. Não diga nada. Apenas deixe que o olhar de Jesus encontre a sua dor e a acolha.',
    pch: '"A dor não veio destruir…\nveio revelar o que ainda é frágil."',
    innerQuestion: 'O que o sofrimento está tentando te ensinar?',
    relatedDocs: ['ss', 'ev', 'gs', 'sd'],
  },
  {
    id: 'relacionamentos',
    theme: 'Relacionamentos',
    icon: <Icons.Heart className="w-5 h-5" />,
    question: 'Como amar de verdade?',
    magisteriumAnswer: 'O amor autêntico é dom de si mesmo. Não é posse, é entrega. A família é escola de amor e comunhão.',
    sourceDoc: 'Amoris Laetitia §89',
    textoBase: 'Nisto todos conhecerão que sois meus discípulos: se vos amardes uns aos outros. (Jo 13,35)',
    explicacao: 'Relacionamentos são o laboratório da santidade. Amar quem é difícil, perdoar setenta vezes sete, servir sem esperar retorno — este é o caminho cristão. A Igreja ensina que a comunhão humana é um reflexo da comunhão da Santíssima Trindade.',
    interpretacaoProfunda: 'Amoris Laetitia nos lembra que a perfeição não existe nas famílias, mas a misericórdia sim. O Magistério enfatiza que o diálogo, a paciência e a ternura são as ferramentas para construir vínculos eternos que resistem às tempestades do egoísmo.',
    aplicacaoPratica: 'Escolha uma pessoa com quem você tem dificuldade de se relacionar. Reze por ela hoje e, se possível, faça um pequeno gesto de gentileza sem que ela perceba.',
    reflexaoFinal: 'O meu jeito de amar atrai as pessoas para Deus ou as afasta?',
    exercicio: 'Pratique a "escuta profunda". Na próxima conversa, não pense na resposta enquanto o outro fala. Apenas acolha as palavras dele como um dom. Amar é, antes de tudo, dar atenção.',
    pch: '"Amar não é completar o outro…\né caminhar junto sem exigir destino."',
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
  const navigate = useNavigate();
  const { handleKeyDown: handleTabKeyDown } = useTabNavigation();
  const [activeTab, setActiveTab] = useState('guidance');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  
  const [selectedGuidance, setSelectedGuidance] = useState(SPIRITUAL_GUIDANCE[0]);
  const activeGuidanceIndex = SPIRITUAL_GUIDANCE.findIndex(g => g.id === selectedGuidance.id);
  const [isTransitioning, setIsTransitioning] = useState(false);

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
    }, 300);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 px-4">
      <SEOHead 
        title="Magistério da Igreja" 
        description="Acesse encíclicas, exortações e documentos fundamentais do Magistério da Igreja Católica." 
        path="/magisterium"
      />

      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <Icons.Scroll className="w-4 h-4 text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Magisterium Ecclesiae</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Magistério</h1>
        <p className="text-muted-foreground font-serif italic max-w-lg mx-auto">A voz da Igreja guiando o coração dos fiéis através dos séculos.</p>
      </div>

      <Tabs defaultValue="guidance" className="w-full" onValueChange={setActiveTab}>
        <div className="flex justify-center mb-8">
          <TabsList className="bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="guidance" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all">
              Guia Espiritual
            </TabsTrigger>
            <TabsTrigger value="documents" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all">
              Documentos
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="guidance" className="mt-0 focus-visible:outline-none outline-none">
          <div className="space-y-12">
            <div 
              className="flex flex-wrap justify-center gap-3 bg-card/40 backdrop-blur-xl p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] border border-border/40 shadow-xl relative overflow-hidden group"
              role="tablist"
              aria-label="Temas de guia espiritual"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              {SPIRITUAL_GUIDANCE.map((item, idx, arr) => (
                <motion.button
                  key={item.id}
                  id={`tab-guidance-${item.id}`}
                  role="tab"
                  aria-selected={selectedGuidance.id === item.id}
                  aria-controls={`panel-guidance-${item.id}`}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowRight' && idx < arr.length - 1) document.getElementById(`tab-guidance-${arr[idx+1].id}`)?.focus();
                    if (e.key === 'ArrowLeft' && idx > 0) document.getElementById(`tab-guidance-${arr[idx-1].id}`)?.focus();
                  }}
                  initial={{ opacity: 0, scale: 0.9 }}

                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ scale: 1.1, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelectGuidance(item)}
                  className={`flex items-center gap-3 px-6 py-3.5 rounded-full border transition-all shadow-sm relative z-10 focus-visible:ring-2 focus-visible:ring-primary outline-none ${
                    selectedGuidance.id === item.id 
                      ? "bg-primary text-primary-foreground shadow-xl shadow-primary/30 scale-110" 
                      : "bg-card/60 text-foreground/80 border-border/60 hover:border-primary/40 hover:text-primary hover:bg-primary/5"
                  }`}

                >
                  <div className={`p-2 rounded-full ${selectedGuidance.id === item.id ? "bg-white/20" : "bg-muted/50"}`}>
                    {item.icon}
                  </div>
                  <span className="font-black text-[10px] sm:text-xs uppercase tracking-[0.15em]">{item.theme}</span>
                </motion.button>
              ))}
            </div>

            <div className="w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedGuidance.id}
                  {...getTabPanelProps(`panel-guidance-${selectedGuidance.id}`, `tab-guidance-${activeGuidanceIndex}`, true, "bg-card border border-border rounded-[2.5rem] p-8 md:p-12 shadow-sm space-y-8 outline-none")}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="pt-8 border-t border-border/40">
                    <DeepContentSection content={{
                      textoBase: selectedGuidance.textoBase || selectedGuidance.magisteriumAnswer,
                      explicacao: (selectedGuidance as any).explicacao || '',
                      interpretacaoProfunda: (selectedGuidance as any).interpretacaoProfunda || '',
                      aplicacaoPratica: (selectedGuidance as any).aplicacaoPratica || '',
                      reflexaoFinal: (selectedGuidance as any).reflexaoFinal || '',
                      exercicio: (selectedGuidance as any).exercicio || ''
                    }} title="Lumen Veritatis" />
                  </div>

                  <div className="space-y-4 relative">
                    <div className="flex items-center justify-between gap-4">
                      <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">{selectedGuidance.question}</h2>
                      <AudioButton variant="ghost" className="shrink-0" />
                    </div>

                    <p className="text-lg text-muted-foreground leading-relaxed font-serif italic">
                      "
                      {parseTheologicalReferences(selectedGuidance.magisteriumAnswer).map((seg, i) => {
                        if (seg.type === 'bibleRef') {
                          return <BibleVersePopover key={i} abbr={seg.abbr!} chapter={seg.chapter!} verse={seg.verse} label={seg.value} />;
                        }
                        if (seg.type === 'catechismRef') {
                          return <CatechismPopover key={i} paragraph={seg.paragraph!} />;
                        }
                        return <span key={i}>{seg.value}</span>;
                      })}
                      "
                    </p>
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
                      <Icons.Scroll className="w-4 h-4" /> {selectedGuidance.sourceDoc}
                    </div>
                  </div>

                  <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 space-y-4">
                    <p className="text-xl font-serif font-bold text-primary leading-tight">{selectedGuidance.pch}</p>
                    <p className="text-sm font-bold text-foreground">
                      {parseTheologicalReferences(selectedGuidance.innerQuestion).map((seg, i) => {
                        if (seg.type === 'bibleRef') {
                          return <BibleVersePopover key={i} abbr={seg.abbr!} chapter={seg.chapter!} verse={seg.verse} label={seg.value} />;
                        }
                        if (seg.type === 'catechismRef') {
                          return <CatechismPopover key={i} paragraph={seg.paragraph!} />;
                        }
                        return <span key={i}>{seg.value}</span>;
                      })}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Documentos Relacionados</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedGuidance.relatedDocs.map(docId => {
                        const doc = DOCS_LIST.find(d => d.id === docId);
                        return (
                          <div key={docId} className="p-4 rounded-xl border border-border bg-muted/30 flex items-center gap-3">
                            <Icons.FileText className="w-5 h-5 text-primary" />
                            <div>
                              <p className="text-xs font-bold text-foreground">{doc?.title || 'Documento'}</p>
                              <p className="text-[10px] text-muted-foreground">{doc?.type || 'Magistério'} • {doc?.year}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-0 focus-visible:outline-none outline-none space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por título ou autor..." 
                className="pl-10 h-12 rounded-xl bg-card border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar" role="tablist" aria-label="Filtros de temas">
              <Button 
                variant={selectedTheme === null ? "default" : "outline"} 
                className="rounded-xl h-10 px-4 text-[10px] font-black uppercase tracking-widest flex-shrink-0"
                onClick={() => setSelectedTheme(null)}
                role="tab"
                aria-selected={selectedTheme === null}
              >
                Todos
              </Button>
              {THEMES.map(theme => (
                <Button 
                  key={theme}
                  variant={selectedTheme === theme ? "default" : "outline"} 
                  className="rounded-xl h-10 px-4 text-[10px] font-black uppercase tracking-widest flex-shrink-0"
                  onClick={() => setSelectedTheme(theme)}
                  role="tab"
                  aria-selected={selectedTheme === theme}
                >
                  {theme}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc, idx) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="group h-full hover:border-primary/30 transition-all border-border bg-card overflow-hidden rounded-2xl">
                  <CardContent className="p-6 flex flex-col h-full space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="p-2.5 rounded-xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                        {doc.type === 'Encíclica' ? <Icons.Scroll className="w-5 h-5" /> : 
                         doc.type === 'Constituição' ? <Icons.Library className="w-5 h-5" /> :
                         <Icons.FileText className="w-5 h-5" />}
                      </div>
                      <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary bg-primary/5">
                        {doc.year}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 flex-1">
                      <h3 className="font-serif font-bold text-lg text-foreground group-hover:text-primary transition-colors">{doc.title}</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{doc.author}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mt-2">{doc.summary}</p>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-2">
                      {doc.theme.map(t => (
                        <span key={t} className="text-[9px] font-bold text-primary/60 bg-primary/5 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                          {t}
                        </span>
                      ))}
                    </div>

                    <Button 
                      variant="ghost" 
                      className="w-full justify-between group/btn text-[10px] font-black uppercase tracking-widest h-10 px-0 hover:bg-transparent hover:text-primary"
                      onClick={() => navigate(`/magisterium/${doc.id}`)}
                    >
                      Ler Documento
                      <Icons.ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredDocs.length === 0 && (
            <div className="text-center py-20 bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-border">
              <Icons.FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-serif italic">Nenhum documento encontrado com esses critérios.</p>
              <Button variant="link" className="text-primary mt-2" onClick={() => { setSearchQuery(''); setSelectedTheme(null); }}>
                Limpar filtros
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Magisterium;
