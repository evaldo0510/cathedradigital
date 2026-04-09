import React, { lazy, Suspense, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BookOpen, Calendar, Church, HandHeart } from 'lucide-react';
import { AppRoute } from '@/types';

const DailyLiturgy = lazy(() => import('./DailyLiturgy'));
const LiturgicalCalendarPage = lazy(() => import('./LiturgicalCalendarPage'));
const MissalPage = lazy(() => import('./MissalPage'));
const PrayerPage = lazy(() => import('./PrayerPage'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[30vh]">
    <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const TABS = [
  { value: 'liturgia', label: 'Liturgia do Dia', icon: BookOpen },
  { value: 'calendario', label: 'Calendário', icon: Calendar },
  { value: 'missal', label: 'Missal Romano', icon: Church },
  { value: 'oracoes', label: 'Orações', icon: HandHeart },
] as const;

interface LiturgicalMoment {
  id: string;
  icon: string;
  title: string;
  explanation: string;
  pch: string;
  question: string;
}

const LITURGICAL_MOMENTS: LiturgicalMoment[] = [
  {
    id: 'entrada',
    icon: '🚪',
    title: 'Entrada',
    explanation: 'O povo se reúne como corpo de Cristo. Não é chegar num lugar — é se tornar um só.',
    pch: '"Você não entra na Igreja…\na Igreja começa quando você chega."',
    question: 'O que você carrega ao entrar?',
  },
  {
    id: 'palavra',
    icon: '📖',
    title: 'Liturgia da Palavra',
    explanation: 'Deus fala ao seu povo. As leituras não são textos antigos — são voz viva.',
    pch: '"Nem toda escuta é ouvir…\nàs vezes Deus fala no silêncio entre as palavras."',
    question: 'O que Deus está tentando te dizer hoje?',
  },
  {
    id: 'ofertorio',
    icon: '🍞',
    title: 'Ofertório',
    explanation: 'O pão e o vinho sobem ao altar — e com eles, sua vida inteira.',
    pch: '"Quando o pão sobe ao altar…\nnão é só pão.\nAli sobe sua vida inteira."',
    question: 'O que você está oferecendo hoje?',
  },
  {
    id: 'consagracao',
    icon: '✨',
    title: 'Consagração',
    explanation: 'O momento mais sagrado: o pão se torna Corpo, o vinho se torna Sangue. Presença real.',
    pch: '"Você olha… e vê pão.\nMas a fé diz: isso não é mais pão."',
    question: 'O que você vê… mas ainda não reconhece?',
  },
  {
    id: 'comunhao',
    icon: '🕊️',
    title: 'Comunhão',
    explanation: 'Você não recebe algo. Você se encontra com Alguém.',
    pch: '"Comunhão não é receber…\né deixar ser encontrado."',
    question: 'Quando foi a última vez que você se deixou amar?',
  },
  {
    id: 'envio',
    icon: '🔥',
    title: 'Envio',
    explanation: '"Ide em paz" não é despedida — é missão. A missa começa quando você sai.',
    pch: '"Você acha que a missa termina…\nMas ela começa quando você sai."',
    question: 'O que muda em você quando volta pro mundo?',
  },
];

const LiturgiaPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'liturgia';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [expandedMoment, setExpandedMoment] = useState<string | null>(null);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <motion.div
      className="max-w-6xl mx-auto space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="text-center space-y-2 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <Icons.Chalice className="w-4 h-4 text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Sacra Liturgia</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">🕊️ Viver a Liturgia</h1>
        <p className="text-muted-foreground font-serif italic max-w-lg mx-auto">
          "Não é só participar… é entrar no que está acontecendo."
        </p>
      </div>

      {/* Liturgical Moments */}
      <div className="space-y-3">
        <h2 className="text-center text-sm font-black uppercase tracking-widest text-muted-foreground">Momentos da Missa</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {LITURGICAL_MOMENTS.map(m => (
            <button
              key={m.id}
              onClick={() => setExpandedMoment(expandedMoment === m.id ? null : m.id)}
              className={`p-3 rounded-2xl border text-center transition-all ${
                expandedMoment === m.id
                  ? 'bg-primary/10 border-primary/40 shadow-lg'
                  : 'bg-card border-border hover:border-primary/30 hover:bg-primary/5'
              }`}
            >
              <span className="text-2xl block">{m.icon}</span>
              <p className="text-[10px] font-bold text-foreground mt-1 leading-tight">{m.title}</p>
            </button>
          ))}
        </div>

        {expandedMoment && (() => {
          const m = LITURGICAL_MOMENTS.find(x => x.id === expandedMoment);
          if (!m) return null;
          return (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{m.icon}</span>
                <div>
                  <h3 className="text-lg font-serif font-bold text-foreground">{m.title}</h3>
                </div>
              </div>

              <div className="border-l-4 border-primary pl-4">
                <p className="text-foreground/90 leading-relaxed text-sm">{m.explanation}</p>
              </div>

              <div className="bg-primary/5 rounded-2xl p-5 text-center space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">🧠 Reflexão Poética</p>
                <p className="text-foreground font-serif italic leading-relaxed whitespace-pre-line text-sm">{m.pch}</p>
              </div>

              <div className="bg-accent/30 rounded-2xl p-5 text-center space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-accent-foreground/70">❓ Pergunta Interior</p>
                <p className="text-foreground font-bold text-base">{m.question}</p>
              </div>

              <button
                onClick={() => navigate(AppRoute.LECTIO_DIVINA)}
                className="w-full py-3.5 rounded-2xl bg-foreground text-background font-black uppercase text-xs tracking-[0.2em] shadow-lg hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-2 group"
              >
                <Icons.Heart className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Viver essa Experiência
              </button>
            </motion.div>
          );
        })()}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full max-w-2xl mx-auto h-auto p-1 bg-secondary rounded-2xl grid grid-cols-4 gap-1">
          {TABS.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-md transition-all"
            >
              <tab.icon className="w-4 h-4" />
              <span className="leading-tight text-center">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6">
          <TabsContent value="liturgia" className="mt-0">
            <Suspense fallback={<LoadingFallback />}>
              <DailyLiturgy />
            </Suspense>
          </TabsContent>
          <TabsContent value="calendario" className="mt-0">
            <Suspense fallback={<LoadingFallback />}>
              <LiturgicalCalendarPage />
            </Suspense>
          </TabsContent>
          <TabsContent value="missal" className="mt-0">
            <Suspense fallback={<LoadingFallback />}>
              <MissalPage />
            </Suspense>
          </TabsContent>
          <TabsContent value="oracoes" className="mt-0">
            <Suspense fallback={<LoadingFallback />}>
              <PrayerPage />
            </Suspense>
          </TabsContent>
        </div>
      </Tabs>
    </motion.div>
  );
};

export default LiturgiaPage;
