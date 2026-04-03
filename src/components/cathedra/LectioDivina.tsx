import React, { useState, useCallback } from 'react';
import { Icons } from '../../constants';

type Step = 'intro' | 'lectio' | 'meditatio' | 'oratio' | 'contemplatio' | 'actio';

const STEPS: { id: Step; title: string; latin: string; instruction: string; prompt: string; icon: string; duration: string }[] = [
  {
    id: 'lectio',
    title: 'Leitura',
    latin: 'Lectio',
    instruction: 'Leia o texto sagrado com atenção, lentamente, como quem escuta a voz de Deus. Repita a leitura quantas vezes precisar.',
    prompt: 'O que diz o texto? Quais palavras ou frases chamam sua atenção?',
    icon: '📖',
    duration: '5-10 min',
  },
  {
    id: 'meditatio',
    title: 'Meditação',
    latin: 'Meditatio',
    instruction: 'Reflita sobre o que leu. Mastigue a Palavra como um alimento espiritual. Deixe-a penetrar no coração e na mente.',
    prompt: 'O que Deus está me dizendo através deste texto? Como isso se aplica à minha vida?',
    icon: '🧠',
    duration: '10-15 min',
  },
  {
    id: 'oratio',
    title: 'Oração',
    latin: 'Oratio',
    instruction: 'Responda a Deus com a oração que brota do coração. Fale com Ele sobre o que a meditação suscitou em você.',
    prompt: 'O que desejo dizer a Deus? Que graça pedir? Que louvor ou agradecimento oferecer?',
    icon: '🙏',
    duration: '5-10 min',
  },
  {
    id: 'contemplatio',
    title: 'Contemplação',
    latin: 'Contemplatio',
    instruction: 'Faça silêncio interior. Repouse na presença de Deus sem palavras, sem pensamentos, apenas acolhendo Seu amor.',
    prompt: 'Descanse em Deus. Não é preciso pensar nem falar — apenas estar.',
    icon: '✨',
    duration: '5-15 min',
  },
  {
    id: 'actio',
    title: 'Ação',
    latin: 'Actio',
    instruction: 'Leve a Palavra para a vida concreta. Que resolução prática você faz a partir deste encontro com Deus?',
    prompt: 'O que vou fazer hoje como resposta à Palavra de Deus?',
    icon: '⚡',
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
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
            <Icons.Feather className="w-4 h-4 text-primary" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Lectio Divina</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Leitura Orante</h1>
          <p className="text-muted-foreground font-serif italic max-w-lg mx-auto">
            Método monástico milenar de encontro com Deus pela Sagrada Escritura, em cinco movimentos do coração.
          </p>
        </div>

        {/* Steps overview */}
        <div className="grid grid-cols-5 gap-2">
          {STEPS.map((step, i) => (
            <div key={step.id} className="text-center p-3 rounded-xl bg-card border border-border">
              <span className="text-2xl">{step.icon}</span>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">{step.latin}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">{step.title}</p>
            </div>
          ))}
        </div>

        {/* Select passage */}
        <div className="bg-card border border-border rounded-3xl p-8 space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-primary text-center">Escolha uma passagem</h3>
          <div className="relative max-w-sm mx-auto">
            <input
              value={selectedPassage}
              onChange={e => setSelectedPassage(e.target.value)}
              placeholder="Ex: Jo 1,1-18 ou Sl 23..."
              className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-foreground text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Sugestões</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTED_PASSAGES.map(p => (
                <button
                  key={p.ref}
                  onClick={() => setSelectedPassage(p.ref)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedPassage === p.ref
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {p.ref}
                </button>
              ))}
            </div>
          </div>

          <div className="text-center">
            <button
              disabled={!selectedPassage.trim()}
              onClick={() => setCurrentStep('lectio')}
              className="px-10 py-4 bg-foreground text-background rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-30"
            >
              Iniciar Lectio Divina
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => setCurrentStep('intro')} className="p-2 rounded-xl bg-card border border-border hover:bg-primary/10 transition-all">
          <Icons.ArrowDown className="w-5 h-5 rotate-90 text-foreground" />
        </button>
        <div className="flex-1">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Lectio Divina</span>
          <h2 className="text-xl font-serif font-bold text-foreground">{selectedPassage}</h2>
        </div>
        <span className="font-mono text-sm text-muted-foreground">{formatTime(seconds)}</span>
      </div>

      {/* Step progress */}
      <div className="flex gap-1">
        {STEPS.map((step, i) => (
          <button
            key={step.id}
            onClick={() => setCurrentStep(step.id)}
            className={`flex-1 h-2 rounded-full transition-all ${
              i <= stepIndex ? 'bg-primary' : 'bg-border'
            }`}
          />
        ))}
      </div>

      {/* Step labels */}
      <div className="flex justify-between px-1">
        {STEPS.map((step, i) => (
          <button
            key={step.id}
            onClick={() => setCurrentStep(step.id)}
            className={`text-[9px] font-black uppercase tracking-widest transition-all ${
              step.id === currentStep ? 'text-primary' : i <= stepIndex ? 'text-foreground/50' : 'text-muted-foreground/40'
            }`}
          >
            {step.icon} {step.latin}
          </button>
        ))}
      </div>

      {/* Active step content */}
      {activeStep && (
        <div className="bg-card border border-border rounded-3xl p-8 md:p-12 space-y-6">
          <div className="text-center space-y-2">
            <span className="text-5xl">{activeStep.icon}</span>
            <h2 className="text-2xl font-serif font-bold text-foreground">{activeStep.title}</h2>
            <p className="text-xs font-serif italic text-primary">{activeStep.latin}</p>
            <p className="text-[10px] text-muted-foreground">{activeStep.duration}</p>
          </div>

          <div className="bg-secondary/50 rounded-2xl p-6 space-y-3">
            <p className="text-foreground/90 leading-relaxed font-serif">{activeStep.instruction}</p>
            <p className="text-sm font-bold text-primary italic">"{activeStep.prompt}"</p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Anotações pessoais</label>
            <textarea
              value={notes[activeStep.id] || ''}
              onChange={e => setNotes({ ...notes, [activeStep.id]: e.target.value })}
              rows={4}
              placeholder="Escreva aqui suas reflexões, inspirações e resoluções..."
              className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 font-serif"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          disabled={stepIndex <= 0}
          onClick={() => setCurrentStep(STEPS[stepIndex - 1].id)}
          className="px-6 py-3 rounded-xl bg-card border border-border text-sm font-bold disabled:opacity-30 hover:bg-primary/10 transition-all"
        >
          ← Anterior
        </button>
        {stepIndex < STEPS.length - 1 ? (
          <button
            onClick={() => setCurrentStep(STEPS[stepIndex + 1].id)}
            className="px-6 py-3 rounded-xl bg-foreground text-background text-sm font-bold hover:bg-primary transition-all"
          >
            Próximo →
          </button>
        ) : (
          <button
            onClick={() => { setCurrentStep('intro'); setNotes({}); setSeconds(0); }}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all"
          >
            ✓ Concluir
          </button>
        )}
      </div>
    </div>
  );
};

export default LectioDivina;
