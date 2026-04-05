import React, { useState, useMemo } from 'react';
import { Icons } from '../../constants';

type Hora = 'laudes' | 'tercia' | 'sexta' | 'noa' | 'vesperas' | 'completas' | 'oficio';

interface HoraInfo {
  id: Hora;
  title: string;
  latin: string;
  time: string;
  description: string;
  icon: string;
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
    icon: '📚',
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
    icon: '🌅',
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
    icon: '🕘',
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
    icon: '☀️',
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
    icon: '🕐',
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
    icon: '🌇',
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
    icon: '🌙',
    psalms: ['Sl 91 — Aquele que habita no abrigo do Altíssimo repousa à sombra do Todo-poderoso.', 'Sl 134 — Vinde, bendizei ao Senhor, vós todos, servos do Senhor!'],
    hymn: 'Te lucis ante terminum — Antes do fim da luz, vos suplicamos, ó Criador de todas as coisas, que pela vossa clemência sejais nosso protetor e guarda.',
    prayer: 'Visitai, vos pedimos, Senhor, esta morada e afastai dela todas as insídias do inimigo. Que os vossos santos anjos nela habitem para nos guardar em paz, e a vossa bênção esteja sempre conosco. Por nosso Senhor Jesus Cristo.',
  },
];

/* ─── Hora Detail View ─── */
const HoraDetail: React.FC<{ hora: HoraInfo; onBack: () => void }> = ({ hora, onBack }) => (
  <div className="max-w-3xl mx-auto space-y-6">
    <div className="flex items-center gap-4">
      <button onClick={onBack} className="p-2 rounded-xl bg-card border border-border hover:bg-primary/10 transition-all">
        <Icons.ArrowDown className="w-5 h-5 rotate-90 text-foreground" />
      </button>
      <div>
        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-primary">{hora.time}</span>
        <h1 className="text-2xl font-display font-bold text-foreground">{hora.title}</h1>
        <p className="text-xs font-serif italic text-muted-foreground">{hora.latin}</p>
      </div>
    </div>

    <div className="bg-card border border-border rounded-2xl p-6 md:p-10 space-y-8">
      {/* Opening */}
      <div className="text-center space-y-2 pb-6 border-b border-border">
        <p className="text-sm text-primary font-display font-bold">✠ Deus, vinde em meu auxílio.</p>
        <p className="text-sm text-foreground/70 font-serif italic">℟ Senhor, apressai-vos em socorrer-me.</p>
        <p className="text-sm text-foreground/70 font-serif italic">Glória ao Pai e ao Filho e ao Espírito Santo.</p>
      </div>

      {/* Hymn */}
      <div className="space-y-3">
        <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground">Hino</h3>
        <div className="bg-secondary/50 rounded-xl p-5 border border-border">
          <p className="reader-text text-foreground/90 leading-[1.9] italic">{hora.hymn}</p>
        </div>
      </div>

      {/* Psalms */}
      <div className="space-y-3">
        <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground">Salmodia</h3>
        <div className="space-y-3">
          {hora.psalms.map((psalm, i) => (
            <div key={i} className="bg-secondary/30 rounded-xl p-5 border border-border">
              <p className="reader-text text-foreground/90 leading-[1.9]">{psalm}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Reading */}
      {hora.reading && (
        <div className="space-y-3">
          <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground">Leitura Breve</h3>
          <div className="bg-primary/5 rounded-xl p-5 border border-primary/10">
            <p className="reader-text text-foreground/90 leading-[1.9]">{hora.reading}</p>
          </div>
        </div>
      )}

      {/* Prayer */}
      <div className="space-y-3">
        <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground">Oração</h3>
        <div className="bg-secondary/50 rounded-xl p-5 border border-border">
          <p className="reader-text text-foreground/90 leading-[1.9]">{hora.prayer}</p>
        </div>
      </div>

      {/* Closing */}
      <div className="text-center pt-6 border-t border-border space-y-2">
        <p className="text-sm text-primary font-display font-bold">℣ O Senhor nos abençoe e nos guarde de todo mal.</p>
        <p className="text-sm text-foreground/70 font-serif italic">℟ E nos conduza à vida eterna. Amém.</p>
      </div>
    </div>
  </div>
);

/* ─── Main Page ─── */
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
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <Icons.History className="w-3.5 h-3.5 text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Liturgia Horarum</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground">Breviário</h1>
        <p className="text-muted-foreground font-serif italic max-w-lg mx-auto leading-relaxed">
          A Liturgia das Horas santifica cada momento do dia pela oração da Igreja — os Salmos, hinos e leituras que a tradição consagrou.
        </p>
      </div>

      {/* Hora suggestion */}
      <div className="text-center">
        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground mb-3">Hora sugerida agora</p>
        <button
          onClick={() => setSelectedHora(suggestedHora as Hora)}
          className="px-6 py-3 bg-foreground text-background rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-primary hover:text-primary-foreground transition-all"
        >
          {HORAS.find(h => h.id === suggestedHora)?.icon} Rezar {HORAS.find(h => h.id === suggestedHora)?.title}
        </button>
      </div>

      {/* Hours grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {HORAS.map(h => (
          <button
            key={h.id}
            onClick={() => setSelectedHora(h.id)}
            className={`text-left p-5 rounded-xl border transition-all group space-y-1.5 ${
              h.id === suggestedHora
                ? 'bg-primary/5 border-primary/30 hover:bg-primary/10'
                : 'bg-card border-border hover:border-primary/30 hover:bg-primary/5'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">{h.icon}</span>
              <span className="text-[9px] font-black text-primary tracking-widest">{h.time}</span>
            </div>
            <h3 className="text-base font-display font-bold text-foreground group-hover:text-primary transition-colors">{h.title}</h3>
            <p className="text-xs font-serif italic text-muted-foreground">{h.latin}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{h.description}</p>
            {h.id === suggestedHora && (
              <span className="inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-primary/10 text-primary">
                Hora atual
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BreviaryPage;
