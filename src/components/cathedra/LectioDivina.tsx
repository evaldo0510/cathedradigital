import React, { useState, useCallback, useEffect } from 'react';
import { 
  Heart, 
  Search, 
  ArrowLeft, 
  ChevronRight, 
  BookOpen, 
  Star, 
  Flame, 
  Zap, 
  Sparkles,
  Music,
  Clock,
  Calendar,
  Activity,
  Cross,
  Feather,
  CheckCircle2,
  ChevronLeft,
  Timer,
  Book,
  PenTool,
  Brain,
  PrayingHand,
  Sun
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type Step = 'intro' | 'lectio' | 'meditatio' | 'oratio' | 'contemplatio' | 'actio';

const STEPS: { id: Step; title: string; latin: string; instruction: string; prompt: string; icon: React.FC<{ className?: string }>; color: string; duration: string }[] = [
  {
    id: 'lectio',
    title: 'Leitura',
    latin: 'Lectio',
    instruction: 'Leia o texto sagrado com atenção, lentamente, como quem escuta a voz de Deus. Repita a leitura quantas vezes precisar.',
    prompt: 'O que diz o texto? Quais palavras ou frases chamam sua atenção?',
    icon: Book,
    color: 'text-sky-500 bg-sky-500/10',
    duration: '5-10 min',
  },
  {
    id: 'meditatio',
    title: 'Meditação',
    latin: 'Meditatio',
    instruction: 'Reflita sobre o que leu. Mastigue a Palavra como um alimento espiritual. Deixe-a penetrar no coração e na mente.',
    prompt: 'O que Deus está me dizendo através deste texto? Como isso se aplica à minha vida?',
    icon: Brain,
    color: 'text-rose-500 bg-rose-500/10',
    duration: '10-15 min',
  },
  {
    id: 'oratio',
    title: 'Oração',
    latin: 'Oratio',
    instruction: 'Responda a Deus com a oração que brota do coração. Fale com Ele sobre o que a meditação suscitou em você.',
    prompt: 'O que desejo dizer a Deus? Que graça pedir? Que louvor ou agradecimento oferecer?',
    icon: Sparkles,
    color: 'text-amber-500 bg-amber-500/10',
    duration: '5-10 min',
  },
  {
    id: 'contemplatio',
    title: 'Contemplação',
    latin: 'Contemplatio',
    instruction: 'Faça silêncio interior. Repouse na presença de Deus sem palavras, sem pensamentos, apenas acolhendo Seu amor.',
    prompt: 'Descanse em Deus. Não é preciso pensar nem falar — apenas estar.',
    icon: Sun,
    color: 'text-indigo-500 bg-indigo-500/10',
    duration: '5-15 min',
  },
  {
    id: 'actio',
    title: 'Ação',
    latin: 'Actio',
    instruction: 'Leve a Palavra para a vida concreta. Que resolução prática você faz a partir deste encontro com Deus?',
    prompt: 'O que vou fazer hoje como resposta à Palavra de Deus?',
    icon: Zap,
    color: 'text-emerald-500 bg-emerald-500/10',
    duration: '2-5 min',
  },
];

const SUGGESTED_PASSAGES = [
  { ref: 'Jo 1,1-18', title: 'Prólogo de São João' },
  { ref: 'Sl 23', title: 'O Senhor é meu pastor' },
  { ref: 'Lc 1,26-38', title: 'Anunciação' },
  { ref: 'Mt 5,1-12', title: 'Bem-aventuranças' },
  { ref: 'Rm 8,28-39', title: 'Nada nos separará do amor de Deus' },
  { ref: 'Is 55,1-11', title: 'Convite à água viva' },
  { ref: 'Jo 15,1-17', title: 'A videira e os ramos' },
  { ref: 'Fl 2,5-11', title: 'Hino cristológico' },
];

const LectioDivina: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('intro');
  const [selectedPassage, setSelectedPassage] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [timerActive, setTimerActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [bibleText, setBibleText] = useState<{ number: number; text: string }[]>([]);
  const [isBibleLoading, setIsBibleLoading] = useState(false);
  const [bibleError, setBibleError] = useState('');

  // Fetch Bible text when selected passage changes
  useEffect(() => {
    if (selectedPassage && currentStep !== 'intro') {
      const match = selectedPassage.match(/^([a-zA-ZáéíóúÁÉÍÓÚ123]+)\s+(\d+)(?:,(\d+)(?:-(\d+))?)?$/);
      if (match) {
        const abbrev = match[1];
        const chapter = parseInt(match[2]);
        const startVerse = match[3] ? parseInt(match[3]) : null;
        const endVerse = match[4] ? parseInt(match[4]) : null;

        setIsBibleLoading(true);
        setBibleError('');
        setBibleText([]);

        supabase.functions.invoke('bible-text', {
          body: { abbrev, chapter }
        }).then(({ data, error }) => {
          if (error) {
            setBibleError('Erro ao carregar o texto bíblico.');
          } else if (data?.verses?.length > 0) {
            let verses = data.verses;
            if (startVerse !== null) {
              if (endVerse !== null) {
                verses = verses.filter((v: any) => v.number >= startVerse && v.number <= endVerse);
              } else {
                verses = verses.filter((v: any) => v.number === startVerse);
              }
            }
            setBibleText(verses);
          } else {
            setBibleError('Texto não disponível para esta referência.');
          }
          setIsBibleLoading(false);
        });
      }
    }
  }, [selectedPassage, currentStep]);

  const startTimer = useCallback(() => {
    setTimerActive(true);
    setSeconds(0);
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const stepIndex = STEPS.findIndex(s => s.id === currentStep);
  const activeStep = STEPS.find(s => s.id === currentStep);

  if (currentStep === 'intro') {
    return (
      <div className="max-w-4xl mx-auto space-y-12 pb-12">
        <div className="text-center space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/5 border border-primary/10 rounded-full">
            <Feather className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Lectio Divina</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground tracking-tight">Leitura Orante</h1>
          <p className="text-lg text-muted-foreground font-serif italic max-w-2xl mx-auto">
            "Não são as palavras em si, mas a Presença que elas contêm que alimenta a alma."
          </p>
        </div>

        {/* Steps overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 px-2">
          {STEPS.map((step, i) => (
            <div key={step.id} className="group p-5 rounded-3xl bg-card border border-border text-center space-y-3 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center transition-transform group-hover:scale-110 ${step.color}`}>
                <step.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">{step.latin}</p>
                <p className="font-serif font-bold text-sm text-foreground">{step.title}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Select passage */}
        <div className="bg-card border border-border rounded-[2.5rem] p-8 md:p-12 space-y-10 shadow-2xl shadow-black/[0.02]">
          <div className="space-y-6 max-w-md mx-auto">
            <div className="text-center space-y-2">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary/60">Escolha uma passagem</h3>
              <p className="text-xs text-muted-foreground font-serif italic">Digite uma referência bíblica ou escolha uma sugestão.</p>
            </div>
            <div className="relative">
              <input
                value={selectedPassage}
                onChange={e => setSelectedPassage(e.target.value)}
                placeholder="Ex: Jo 1,1-18 ou Sl 23..."
                className="w-full px-6 py-4 rounded-2xl border border-border bg-muted/30 text-foreground text-base text-center font-serif focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
              />
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTED_PASSAGES.map(p => (
                  <button
                    key={p.ref}
                    onClick={() => setSelectedPassage(p.ref)}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                      selectedPassage === p.ref
                        ? 'bg-primary border-primary text-white shadow-lg'
                        : 'bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-primary'
                    }`}
                  >
                    {p.ref}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              disabled={!selectedPassage.trim()}
              onClick={() => setCurrentStep('lectio')}
              className="px-10 py-5 bg-foreground text-background rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-30 active:scale-95"
            >
              Iniciar Lectio Divina
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-6 px-2">
        <button onClick={() => { setCurrentStep('intro'); setBibleText([]); }} className="p-3 rounded-2xl bg-card border border-border hover:bg-primary/5 transition-all active:scale-95 shadow-sm self-start md:self-center">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">
            <Feather className="w-3 h-3" />
            Lectio Divina
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground leading-tight">{selectedPassage}</h2>
        </div>
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-card border border-border shadow-sm">
          <Timer className="w-4 h-4 text-primary/60" />
          <span className="font-mono text-lg font-bold text-foreground tabular-nums">{formatTime(seconds)}</span>
        </div>
      </div>

      {/* Step progress */}
      <div className="px-2 space-y-6">
        <div className="flex gap-2">
          {STEPS.map((step, i) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`flex-1 h-2 rounded-full transition-all duration-500 ${
                i <= stepIndex ? 'bg-primary shadow-[0_0_8px_rgba(var(--primary),0.3)]' : 'bg-border'
              }`}
            />
          ))}
        </div>

        {/* Step labels scrollable */}
        <div className="flex overflow-x-auto pb-2 gap-4 scrollbar-hide md:justify-between no-scrollbar">
          {STEPS.map((step, i) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap border ${
                step.id === currentStep 
                  ? 'bg-primary border-primary text-white shadow-lg' 
                  : i <= stepIndex ? 'bg-card border-border text-foreground/80' : 'bg-transparent border-transparent text-muted-foreground/40'
              }`}
            >
              <step.icon className={`w-4 h-4 ${step.id === currentStep ? 'text-white' : i <= stepIndex ? 'text-primary' : ''}`} />
              <span className="text-[10px] font-black uppercase tracking-widest">{step.latin}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active step content */}
      {activeStep && (
        <div className="bg-card border border-border rounded-[3rem] p-8 md:p-16 space-y-10 shadow-2xl shadow-black/[0.02] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
            <activeStep.icon className="w-64 h-64 -mr-16 -mt-16 rotate-12" />
          </div>

          <div className="relative text-center space-y-4">
            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl border-4 border-background ${activeStep.color}`}>
              <activeStep.icon className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground tracking-tight">{activeStep.title}</h2>
              <p className="text-base font-serif italic text-primary opacity-80">{activeStep.latin} — {activeStep.duration}</p>
            </div>
          </div>
          
          {/* Bible Text or Instructions */}
          <div className="relative space-y-8 max-w-2xl mx-auto">
            <div className="bg-muted/50 rounded-[2.5rem] p-8 md:p-12 border border-border/50 space-y-6">
              {isBibleLoading ? (
                <div className="space-y-4 py-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-4 bg-primary/10 rounded animate-pulse" style={{ width: `${75 + Math.random() * 25}%` }} />
                  ))}
                </div>
              ) : bibleError ? (
                <p className="text-muted-foreground italic text-center text-lg font-serif">{bibleError}</p>
              ) : bibleText.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 justify-center opacity-40">
                    <Book className="w-4 h-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">{selectedPassage}</p>
                  </div>
                  <div className="font-serif leading-relaxed text-xl text-foreground/90 text-center">
                    {bibleText.map((v, i) => (
                      <span key={i} className="inline-block mb-1">
                        <sup className="text-primary font-bold mr-1.5 text-xs select-none">{v.number}</sup>
                        {v.text}{' '}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-6">
                  <p className="text-xl text-foreground/90 leading-relaxed font-serif italic">"{activeStep.instruction}"</p>
                </div>
              )}
            </div>
            
            <div className="space-y-8">
              <div className="text-center space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">Oração do Coração</h3>
                <p className="text-lg md:text-xl font-serif font-bold text-primary italic leading-relaxed">"{activeStep.prompt}"</p>
              </div>

              {/* Notes */}
              <div className="space-y-4 group">
                <div className="flex items-center gap-2 justify-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 transition-colors group-focus-within:text-primary">
                  <PenTool className="w-3 h-3" /> Sua Reflexão
                </div>
                <textarea
                  value={notes[activeStep.id] || ''}
                  onChange={e => setNotes({ ...notes, [activeStep.id]: e.target.value })}
                  rows={6}
                  placeholder="Deixe a alma falar... Escreva aqui suas reflexões, luzes e resoluções."
                  className="w-full px-8 py-8 rounded-[2rem] border border-border bg-background text-lg md:text-xl font-serif text-foreground resize-none focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-sm leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-4 justify-center px-4">
        <button
          disabled={stepIndex <= 0}
          onClick={() => setCurrentStep(STEPS[stepIndex - 1].id)}
          className="flex-1 max-w-[200px] h-14 rounded-2xl bg-card border border-border text-[10px] font-black uppercase tracking-widest disabled:opacity-20 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 group shadow-sm"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Anterior
        </button>
        
        {stepIndex < STEPS.length - 1 ? (
          <button
            onClick={() => setCurrentStep(STEPS[stepIndex + 1].id)}
            className="flex-1 max-w-[200px] h-14 rounded-2xl bg-foreground text-background text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-2 group shadow-xl"
          >
            Próximo <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        ) : (
          <button
            onClick={() => { setCurrentStep('intro'); setNotes({}); setSeconds(0); setBibleText([]); }}
            className="flex-1 max-w-[200px] h-14 rounded-2xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-primary/20"
          >
            <CheckCircle2 className="w-4 h-4" /> Concluir
          </button>
        )}
      </div>
    </div>
  );
};

export default LectioDivina;