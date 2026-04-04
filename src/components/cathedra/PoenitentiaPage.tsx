import React, { useState } from 'react';
import { Icons } from '../../constants';

interface ConfessionStep {
  title: string;
  description: string;
  items?: string[];
}

const CONFESSION_STEPS: ConfessionStep[] = [
  {
    title: 'Exame de Consciência',
    description: 'Reflexão sobre os pecados cometidos desde a última confissão.',
    items: [
      'Ame a Deus sobre todas as coisas? Usei o nome de Deus em vão?',
      'Faltei à Missa aos domingos e dias de preceito por culpa própria?',
      'Fui impaciente, invejoso ou guardei rancor?',
      'Respeitei meus pais e superiores?',
      'Fui honesto no trabalho e nos negócios?',
      'Falei mal dos outros ou caluniei alguém?',
      'Tive pensamentos ou atos impuros?'
    ]
  },
  {
    title: 'Arrependimento e Propósito',
    description: 'Ter dor sincera pelos pecados e firme propósito de não voltar a pecar.'
  },
  {
    title: 'Confissão com o Sacerdote',
    description: 'Dizer os pecados de forma clara e completa ao padre.'
  },
  {
    title: 'Penitência e Absolvição',
    description: 'Cumprir a penitência recebida e agradecer a misericórdia de Deus.'
  }
];

const PoenitentiaPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <Icons.Cross className="w-4 h-4 text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Sacramento da Penitência</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Confissão</h1>
        <p className="text-muted-foreground font-serif italic max-w-lg mx-auto">Guia para o exame de consciência e o Sacramento da Reconciliação.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {CONFESSION_STEPS.map((step, i) => (
          <button
            key={i}
            onClick={() => setActiveStep(i)}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeStep === i 
                ? 'bg-primary border-primary text-white shadow-lg scale-[1.02]' 
                : 'bg-card border-border text-foreground hover:border-primary/50'
            }`}
          >
            <div className="text-xs font-black opacity-60 mb-1">PASSO {i + 1}</div>
            <div className="font-bold font-serif leading-tight">{step.title}</div>
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 md:p-10 space-y-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-bold text-foreground">{CONFESSION_STEPS[activeStep].title}</h2>
          <p className="text-muted-foreground italic font-serif">{CONFESSION_STEPS[activeStep].description}</p>
        </div>

        {CONFESSION_STEPS[activeStep].items && (
          <ul className="space-y-4">
            {CONFESSION_STEPS[activeStep].items?.map((item, i) => (
              <li key={i} className="flex gap-3 text-foreground/90 font-serif leading-relaxed">
                <span className="text-primary mt-1.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        {activeStep === 0 && (
          <div className="mt-8 p-4 bg-muted rounded-2xl border border-border/50 italic text-sm text-muted-foreground font-serif">
            "O exame de consciência é a confrontação da nossa vida com a lei moral de Deus."
          </div>
        )}
        
        {activeStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary">Ato de Contrição</h3>
            <p className="text-foreground/90 font-serif leading-relaxed bg-primary/5 p-6 rounded-2xl border border-primary/10 italic">
              "Meu Deus, porque sois infinitamente bom e Vos amo de todo o meu coração, pesa-me de Vos ter ofendido, e com o auxílio da Vossa divina graça proponho firmemente não tornar a pecar e evitar as próximas ocasiões de pecado. Amém."
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PoenitentiaPage;
