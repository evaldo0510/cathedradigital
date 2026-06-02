import { Button } from '@/components/ui/button';
import React, { useState, useMemo } from 'react';
import { Icons } from '../../constants';

type Hora = 'laudes' | 'tercia' | 'sexta' | 'noa' | 'vesperas' | 'completas' | 'oficio';

interface HoraInfo {
  id: Hora;
  title: string;
  latin: string;
  time: string;
  description: string;
  icon: React.ReactNode;
  psalms: string[];
  hymn: string;
  prayer: string;
  reading?: string;
}

const HORAS: HoraInfo[] = [
  {
    id: 'oficio',
    title: 'Ofício das Leituras',
    latin: 'Officium Lectionis',
    time: 'Qualquer hora',
    description: 'Leituras bíblicas e patrísticas para meditação profunda.',
    icon: <Icons.BookOpen className="w-spacing-md h-spacing-md" />,
    psalms: ['Sl 3 — Senhor, como são numerosos os meus adversários!', 'Sl 95 — Vinde, cantemos ao Senhor!'],
    hymn: 'Aeterne rerum Conditor — Eterno Criador de todas as coisas, que governas a noite e o dia e dás a cada tempo a sua medida.',
    prayer: 'Ó Deus, que iluminastes esta noite com o esplendor da verdadeira luz, concedei que, iluminados na terra pela mesma luz, alcancemos no céu a plenitude da sua alegria. Por nosso Senhor Jesus Cristo.',
    reading: 'Rm 13,11-14 — É hora de despertar do sono, pois a salvação está mais perto de nós agora do que quando começamos a crer.',
  },
  {
    id: 'laudes',
    title: 'Laudes',
    latin: 'Laudes Matutinae',
    time: '06:00',
    description: 'Oração da manhã — Louvor ao Senhor pelo novo dia que se inicia.',
    icon: <Icons.Sun className="w-spacing-md h-spacing-md" />,
    psalms: ['Sl 63 — Ó Deus, tu és o meu Deus, eu te procuro!', 'Cântico de Daniel — Bendito sejais, Senhor, Deus de nossos pais!', 'Sl 149 — Cantai ao Senhor um cântico novo!'],
    hymn: 'Iam lucis orto sidere — Agora que a estrela da manhã se levanta, supliquemos humildemente a Deus que nos guarde de todo mal durante este dia.',
    prayer: 'Senhor, nosso Deus, Rei do céu e da terra, dignai-vos dirigir e santificar, reger e governar hoje os nossos corações e os nossos corpos, os nossos pensamentos, as nossas palavras e as nossas ações, na observância da vossa lei. Amém.',
  },
  {
    id: 'tercia',
    title: 'Hora Tércia',
    latin: 'Tertia',
    time: '09:00',
    description: 'Hora em que o Espírito Santo desceu sobre os Apóstolos.',
    icon: <Icons.Clock className="w-spacing-md h-spacing-md" />,
    psalms: ['Sl 119,1-8 — Bem-aventurados os que trilham caminhos retos!', 'Sl 119,9-16 — Como poderá o jovem guardar puro o seu caminho?'],
    hymn: 'Nunc Sancte nobis Spiritus — Vinde agora, Espírito Santo, uno com o Pai e o Filho, dignai-vos habitar em nossos corações.',
    prayer: 'Senhor Deus todo-poderoso, que nos fizestes chegar ao meio deste dia, concedei-nos a vossa graça para o restante dele e protegei-nos com a vossa misericórdia.',
  },
  {
    id: 'sexta',
    title: 'Hora Sexta',
    latin: 'Sexta',
    time: '12:00',
    description: 'Meio-dia — hora em que Cristo foi pregado na Cruz.',
    icon: <Icons.Sun className="w-spacing-md h-spacing-md" />,
    psalms: ['Sl 119,17-24 — Fazei bem ao vosso servo, para que eu viva.', 'Sl 119,25-32 — A minha alma está colada ao pó da terra.'],
    hymn: 'Rector potens, verax Deus — Regedor poderoso, Deus verdadeiro, que moderais os tempos e as estações, iluminando a manhã e acendendo o fogo do meio-dia.',
    prayer: 'Ó Deus, que pela hora sexta subistes à cruz para a redenção do mundo, concedei-nos que estejamos sempre unidos a vós pela mesma caridade com que nos amastes.',
  },
  {
    id: 'noa',
    title: 'Hora Nona',
    latin: 'Nona',
    time: '15:00',
    description: 'Hora em que Cristo entregou o espírito na Cruz.',
    icon: <Icons.Clock className="w-spacing-md h-spacing-md" />,
    psalms: ['Sl 119,33-40 — Ensinai-me, Senhor, o caminho dos vossos preceitos.', 'Sl 119,41-48 — Venha sobre mim a vossa misericórdia, Senhor.'],
    hymn: 'Rerum, Deus, tenax vigor — Ó Deus, força constante de todas as coisas, que permaneceis em vós mesmo imutável e governais o curso das horas do dia.',
    prayer: 'Senhor Jesus Cristo, que à hora nona entregastes o espírito ao Pai e abris as portas do paraíso ao ladrão arrependido, abri também as portas da vossa misericórdia a nós pecadores.',
  },
  {
    id: 'vesperas',
    title: 'Vésperas',
    latin: 'Vesperae',
    time: '18:00',
    description: 'Oração do entardecer — Ação de graças pelo dia que termina.',
    icon: <Icons.Sun className="w-spacing-md h-spacing-md" />,
    psalms: ['Sl 141 — Senhor, eu vos invoco, vinde depressa!', 'Sl 142 — Com a minha voz clamo ao Senhor.', 'Cântico: Fl 2,6-11 — Cristo Jesus, sendo de condição divina...'],
    hymn: 'Lucis Creator optime — Ó ótimo Criador da luz, que fizestes brilhar a luminosidade dos dias, que estabelecestes os princípios do mundo pela primeira luz criada.',
    prayer: 'Ouvi, Senhor, a nossa oração vespertina e concedei que, seguindo os vestígios da vossa paixão, alcancemos a glória da ressurreição. Vós que viveis e reinais pelos séculos dos séculos. Amém.',
  },
  {
    id: 'completas',
    title: 'Completas',
    latin: 'Completorium',
    time: '21:00',
    description: 'Última oração do dia — Entrega da noite a Deus.',
    icon: <Icons.Moon className="w-spacing-md h-spacing-md" />,
    psalms: ['Sl 91 — Aquele que habita no abrigo do Altíssimo repousa à sombra do Todo-poderoso.', 'Sl 134 — Vinde, bendizei ao Senhor, vós todos, servos do Senhor!'],
    hymn: 'Te lucis ante terminum — Antes do fim da luz, vos suplicamos, ó Criador de todas as coisas, que pela vossa clemência sejais nosso protetor e guarda.',
    prayer: 'Visitai, vos pedimos, Senhor, esta morada e afastai dela todas as insídias do inimigo. Que os vossos santos anjos nela habitem para nos guardar em paz, e a vossa bênção esteja sempre conosco. Por nosso Senhor Jesus Cristo.',
  },
];

const HoraDetail: React.FC<{ hora: HoraInfo; onBack: () => void }> = ({ hora, onBack }) => (
  <div className="w-full space-y-spacing-lg">
    <div className="flex items-center gap-spacing-md">
      <Button onClick={onBack} className="p-spacing-xs rounded-premium-full bg-card border border-border hover:bg-primary/10 transition-all">
        <Icons.ChevronLeft className="w-spacing-md h-spacing-md text-foreground" />
      </Button>
      <div>
        <span className="text-premium-xs font-black uppercase tracking-[0.25em] text-primary">{hora.time}</span>
        <h1 className="text-premium-2xl font-display font-bold text-foreground">{hora.title}</h1>
        <p className="text-premium-xs font-serif italic text-muted-foreground">{hora.latin}</p>
      </div>
    </div>

    <div className="bg-card border border-border rounded-premium p-spacing-lg md:p-spacing-xl space-y-spacing-xl">
      {/* Opening */}
      <div className="text-center space-y-spacing-xs pb-spacing-lg border-b border-border">
        <p className="text-premium-sm text-primary font-display font-bold">✠ Deus, vinde em meu auxílio.</p>
        <p className="text-premium-sm text-foreground/70 font-serif italic">℟ Senhor, apressai-vos em socorrer-me.</p>
        <p className="text-premium-sm text-foreground/70 font-serif italic">Glória ao Pai e ao Filho e ao Espírito Santo.</p>
      </div>

      {/* Hymn */}
      <div className="space-y-spacing-sm">
        <h3 className="text-premium-xs font-black uppercase tracking-[0.25em] text-muted-foreground">Hino</h3>
        <div className="bg-secondary/50 rounded-premium p-spacing-md border border-border">
          <p className="reader-text text-foreground/90 leading-[1.9] italic">{hora.hymn}</p>
        </div>
      </div>

      {/* Psalms */}
      <div className="space-y-spacing-sm">
        <h3 className="text-premium-xs font-black uppercase tracking-[0.25em] text-muted-foreground">Salmodia</h3>
        <div className="space-y-spacing-sm">
          {hora.psalms.map((psalm, i) => (
            <div key={i} className="bg-secondary/30 rounded-premium p-spacing-md border border-border">
              <p className="reader-text text-foreground/90 leading-[1.9]">{psalm}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Reading */}
      {hora.reading && (
        <div className="space-y-spacing-sm">
          <h3 className="text-premium-xs font-black uppercase tracking-[0.25em] text-muted-foreground">Leitura Breve</h3>
          <div className="bg-primary/5 rounded-premium p-spacing-md border border-primary/10">
            <p className="reader-text text-foreground/90 leading-[1.9]">{hora.reading}</p>
          </div>
        </div>
      )}

      {/* Prayer */}
      <div className="space-y-spacing-sm">
        <h3 className="text-premium-xs font-black uppercase tracking-[0.25em] text-muted-foreground">Oração</h3>
        <div className="bg-secondary/50 rounded-premium p-spacing-md border border-border">
          <p className="reader-text text-foreground/90 leading-[1.9]">{hora.prayer}</p>
        </div>
      </div>

      {/* Closing */}
      <div className="text-center pt-spacing-lg border-t border-border space-y-spacing-xs">
        <p className="text-premium-sm text-primary font-display font-bold">℣ O Senhor nos abençoe e nos guarde de todo mal.</p>
        <p className="text-premium-sm text-foreground/70 font-serif italic">℟ E nos conduza à vida eterna. Amém.</p>
      </div>
    </div>
  </div>
);

const BreviaryPage: React.FC = () => {
  const [selectedHora, setSelectedHora] = useState<Hora | null>(null);

  const currentHour = new Date().getHours();
  const suggestedHora = useMemo(() => {
    if (currentHour < 6) return 'oficio';
    if (currentHour < 9) return 'laudes';
    if (currentHour < 11) return 'tercia';
    if (currentHour < 14) return 'sexta';
    if (currentHour < 17) return 'noa';
    if (currentHour < 20) return 'vesperas';
    return 'completas';
  }, [currentHour]);

  const hora = HORAS.find(h => h.id === selectedHora);

  if (hora) {
    return <HoraDetail hora={hora} onBack={() => setSelectedHora(null)} />;
  }

  return (
    <div className="w-full space-y-spacing-xl">
      <div className="text-center space-y-spacing-sm">
        <div className="inline-flex items-center gap-spacing-xs px-spacing-sm py-spacing-2xs bg-primary/10 rounded-premium">
          <Icons.History className="w-spacing-sm h-spacing-sm text-primary" />
          <span className="text-premium-xs font-black uppercase tracking-[0.2em] text-primary">Liturgia Horarum</span>
        </div>
        <h1 className="text-premium-3xl md:text-premium-5xl font-display font-bold text-foreground">Breviário</h1>
        <p className="text-muted-foreground font-serif italic leading-relaxed">
          A Liturgia das Horas santifica cada momento do dia pela oração da Igreja.
        </p>
      </div>

      <div className="text-center">
        <p className="text-premium-xs font-black uppercase tracking-[0.25em] text-muted-foreground mb-spacing-sm">Hora sugerida agora</p>
        <Button
          onClick={() => setSelectedHora(suggestedHora as Hora)}
          className="px-spacing-lg py-spacing-sm bg-foreground text-background rounded-premium-full font-black uppercase text-premium-xs tracking-widest shadow-premium hover:bg-primary hover:text-primary-foreground transition-all flex items-center gap-spacing-xs mx-auto"
        >
          {HORAS.find(h => h.id === suggestedHora)?.icon} Rezar {HORAS.find(h => h.id === suggestedHora)?.title}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-sm">
        {HORAS.map(h => (
          <Button
            key={h.id}
            onClick={() => setSelectedHora(h.id)}
            className={`text-left p-spacing-md rounded-premium-full border transition-all group space-y-spacing-2xs ${
              h.id === suggestedHora
                ? 'bg-primary/5 border-primary/30 hover:bg-primary/10'
                : 'bg-card border-border hover:border-primary/30 hover:bg-primary/5'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="opacity-80">{h.icon}</span>
              <span className="text-premium-xs font-black text-primary tracking-widest">{h.time}</span>
            </div>
            <h3 className="text-premium-base font-display font-bold text-foreground group-hover:text-primary transition-colors">{h.title}</h3>
            <p className="text-premium-xs font-serif italic text-muted-foreground">{h.latin}</p>
            <p className="text-premium-sm text-muted-foreground leading-relaxed">{h.description}</p>
            {h.id === suggestedHora && (
              <span className="inline-block font-serif px-spacing-xs py-spacing-3xs rounded text-premium-xs font-black uppercase tracking-wider bg-primary/10 text-primary">
                Hora atual
              </span>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default BreviaryPage;