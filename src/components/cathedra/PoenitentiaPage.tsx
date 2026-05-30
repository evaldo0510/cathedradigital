import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { Icons } from '../../constants';
import { CathedraCard } from './CathedraCard';

interface ConfessionStep {
  title: string;
  description: string;
  items?: string[];
}

const CONFESSION_STEPS: ConfessionStep[] = [
  {
    title: 'Exame de Consciência',
    description: 'Reflexão sincera sobre os pecados cometidos à luz dos Mandamentos de Deus.',
    items: [
      '1º: Amei a Deus sobre todas as coisas ou dei prioridade a ídolos (dinheiro, prazer, poder)?',
      '2º: Usei o nome de Deus em vão, jurei falso ou blasfemei?',
      '3º: Guardei os domingos e festas? Faltei à Missa por culpa própria?',
      '4º: Honrei meus pais e superiores? Fui negligente com minhas obrigações familiares?',
      '5º: Matei, feri ou desejei o mal a alguém? Fui impaciente, guardei rancor ou escandalizei o próximo?',
      '6º e 9º: Guardei a castidade em pensamentos, palavras e atos? Vi pornografia ou cometi atos impuros?',
      '7º e 10º: Roubei ou desejei o que pertence aos outros? Fui honesto nos negócios e no trabalho?',
      '8º: Levantei falso testemunho? Menti, caluniei ou murmurei contra os outros?',
      'Igreja: Cumpri os preceitos da Igreja (jejum, abstinência, confissão e comunhão anual)?'
    ]
  },
  {
    title: 'Arrependimento e Propósito',
    description: 'Sentir dor sincera pelo pecado e ter firme propósito de não voltar a pecar.',
    items: [
      'Reconheço que meus pecados ofenderam a Deus, que é infinitamente bom?',
      'Desejo sinceramente mudar de vida e evitar as ocasiões de pecado?',
      'Estou disposto a fazer a reparação devida por meus erros?'
    ]
  },
  {
    title: 'Confissão com o Sacerdote',
    description: 'Dizer os pecados de forma clara, íntegra e humilde ao padre.',
    items: [
      'Inicie com o sinal da cruz: "Abençoai-me, Padre, porque pequei."',
      'Diga há quanto tempo foi sua última confissão.',
      'Confesse todos os pecados graves por espécie e número.',
      'Escute os conselhos e a penitência dada pelo sacerdote.'
    ]
  },
  {
    title: 'Penitência e Absolvição',
    description: 'Cumprir a penitência e agradecer a misericórdia infinita de Deus.',
    items: [
      'Receba a absolvição com fé e diga: "Amém."',
      'Cumpra a penitência o mais breve possível.',
      'Agradeça a Deus pelo perdão recebido e renove seu amor por Ele.'
    ]
  }
];

const PoenitentiaPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-2xl">
      <div className="text-center space-y-4 pt-md">
        <div className="inline-flex items-center gap-xs px-md py-2xs bg-primary/5 border border-primary/10 rounded-premium">
          <Icons.Cross className="w-md h-md text-primary" />
          <span className="text-premium-tiny font-black uppercase tracking-[0.2em] text-primary">Sacramentum Poenitentiae</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground tracking-tight">Confissão</h1>
        <p className="text-lg text-muted-foreground font-serif italic max-w-2xl mx-auto">"Se confessarmos os nossos pecados, Ele é fiel e justo para nos perdoar."</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-md px-xs">
        {CONFESSION_STEPS.map((step, i) => (
          <Button
            key={i}
            onClick={() => setActiveStep(i)}
            className={`p-lg rounded-[2rem] border text-left transition-all relative overflow-hidden group ${
              activeStep === i 
                ? 'bg-primary border-primary text-primary-foreground shadow-premium-hover scale-[1.05] z-10' 
                : 'bg-card border-border text-foreground hover:border-primary/40 hover:bg-primary/5 hover:shadow-premium'
            }`}
          >
            <div className={`text-premium-tiny font-black opacity-40 uppercase tracking-widest mb-xs ${activeStep === i ? 'text-white' : 'text-primary'}`}>PASSO {i + 1}</div>
            <div className="font-serif font-bold text-lg leading-tight group-hover:text-primary transition-colors group-data-[state=active]:text-white">{step.title}</div>
            {activeStep === i && (
              <div className="absolute top-0 right-0 p-md opacity-10">
                <Icons.CheckCircle2 className="w-2xl h-2xl" />
              </div>
            )}
          </Button>
        ))}
      </div>

      <CathedraCard padding="lg" className="animate-in fade-in slide-in-from-bottom-md duration-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2xl opacity-[0.02]">
          <Icons.Cross className="w-64 h-64 -mr-3xl -mt-3xl rotate-12" />
        </div>

        <div className="relative space-y-8 max-w-3xl mx-auto">
          <div className="space-y-4 text-center">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground tracking-tight">{CONFESSION_STEPS[activeStep].title}</h2>
            <p className="text-xl text-muted-foreground italic font-serif leading-relaxed">"{CONFESSION_STEPS[activeStep].description}"</p>
          </div>

          {CONFESSION_STEPS[activeStep].items && (
            <div className="space-y-6 pt-md">
              <h3 className="text-premium-tiny font-black uppercase tracking-[0.2em] text-primary/40 text-center mb-lg">Exame de Consciência</h3>
              <div className="grid gap-sm">
                {CONFESSION_STEPS[activeStep].items?.map((item, i) => (
                  <div key={i} className="flex gap-md p-md rounded-premium bg-muted/50 border border-border/50 group hover:bg-white hover:shadow-premium transition-all">
                    <div className="w-lg h-lg rounded-premium bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0 border border-primary/10 group-hover:bg-primary group-hover:text-white transition-colors">{i + 1}</div>
                    <span className="text-lg text-foreground/90 font-serif leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeStep === 0 && (
            <div className="mt-2xl p-xl bg-primary/5 rounded-[2.5rem] border border-primary/10 text-center space-y-4 shadow-soft">
              <Icons.BookOpen className="w-xl h-xl text-primary/60 mx-auto" />
              <p className="text-lg text-foreground/80 font-serif italic max-w-xl mx-auto leading-relaxed">
                "O exame de consciência é a confrontação sincera da nossa vida com a lei moral de Deus, o Evangelho e os Seus Mandamentos."
              </p>
            </div>
          )}
          
          {activeStep === 2 && (
            <div className="space-y-8 pt-xl">
              <div className="flex items-center gap-sm justify-center">
                <div className="w-xl h-xl rounded-premium bg-primary/10 flex items-center justify-center text-primary">
                  <Icons.Flame className="w-md h-md" />
                </div>
                <h3 className="text-xl font-serif font-bold">Ato de Contrição</h3>
              </div>
              <div className="bg-primary text-primary-foreground p-xl md:p-2xl rounded-[3rem] border border-primary/10 shadow-premium-hover shadow-primary/20 relative">
                <Icons.Sparkles className="absolute -top-sm -right-sm w-xl h-xl text-white/20 rotate-12" />
                <p className="text-xl md:text-2xl font-serif leading-relaxed text-center italic opacity-95">
                  "Meu Deus, porque sois infinitamente bom e Vos amo de todo o meu coração, pesa-me de Vos ter ofendido, e com o auxílio da Vossa divina graça proponho firmemente não tornar a pecar e evitar as próximas ocasiões de pecado. Amém."
                </p>
              </div>
              <div className="flex items-center justify-center gap-xs text-xs font-black uppercase tracking-widest text-primary/60">
                <Icons.Activity className="w-sm h-sm" /> Reze antes ou depois de confessar
              </div>
            </div>
          )}

          <div className="flex justify-center pt-xl">
            <Button 
              onClick={() => setActiveStep((prev) => (prev + 1) % CONFESSION_STEPS.length)}
              className="px-xl py-md bg-foreground text-background rounded-full font-black uppercase text-premium-tiny tracking-[0.2em] shadow-premium-hover hover:bg-primary hover:text-primary-foreground transition-all active:scale-95 flex items-center gap-sm"
            >
              {activeStep === CONFESSION_STEPS.length - 1 ? 'Reiniciar Guia' : 'Próximo Passo'} <Icons.ChevronRight className="w-md h-md" />
            </Button>
          </div>
        </div>
      </CathedraCard>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
        <CathedraCard padding="md" className="space-y-6">
          <div className="flex items-center gap-md">
            <div className="w-2xl h-2xl rounded-premium bg-primary/10 flex items-center justify-center text-primary">
              <Icons.User className="w-lg h-lg" />
            </div>
            <h3 className="text-2xl font-serif font-bold">Como Começar?</h3>
          </div>
          <p className="text-muted-foreground font-serif leading-relaxed italic">
            Ao entrar no confessionário, diga: "Abençoai-me, Padre, porque pequei. Minha última confissão foi há (tempo)."
          </p>
        </CathedraCard>
        <CathedraCard padding="md" className="space-y-6">
          <div className="flex items-center gap-md">
            <div className="w-2xl h-2xl rounded-premium bg-primary/10 flex items-center justify-center text-primary">
              <Icons.Heart className="w-lg h-lg" />
            </div>
            <h3 className="text-2xl font-serif font-bold">A Absolvição</h3>
          </div>
          <p className="text-muted-foreground font-serif leading-relaxed italic">
            No final, o sacerdote dirá: "Eu te absolvo de teus pecados em nome do Pai, e do Filho, e do Espírito Santo." Responda: "Amém."
          </p>
        </CathedraCard>
      </div>
    </div>
  );
};

export default PoenitentiaPage;