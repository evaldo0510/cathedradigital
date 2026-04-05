import React, { useState } from 'react';
import { 
  Cross, 
  ArrowLeft, 
  ChevronRight, 
  Play, 
  MessageSquare, 
  BookOpen, 
  Flame, 
  Sparkles, 
  Activity,
  ChevronLeft
} from 'lucide-react';
import ShareButton from './ShareButton';

const STATIONS = [
  { num: 1, title: 'Jesus é condenado à morte', scripture: 'Mt 27,22-26', meditation: 'Pilatos lava as mãos. O Inocente é entregue à morte por nossos pecados. Quantas vezes condenamos o próximo com nossos julgamentos?', prayer: 'Senhor Jesus, ajudai-me a nunca condenar injustamente o meu próximo, mas a aceitar com humildade as provações da vida.' },
  { num: 2, title: 'Jesus carrega a Cruz', scripture: 'Jo 19,17', meditation: 'O peso da Cruz é o peso de todos os pecados da humanidade. Jesus a abraça com amor. Cada sofrimento unido a Ele se torna redentor.', prayer: 'Senhor, dai-me forças para carregar minha cruz de cada dia, unindo meus sofrimentos aos Vossos.' },
  { num: 3, title: 'Jesus cai pela primeira vez', scripture: 'Is 53,4-6', meditation: 'A fraqueza humana de Cristo revela a profundidade de Sua kenosis. Ele cai para nos ensinar a levantar.', prayer: 'Senhor, quando eu cair em pecado, dai-me a graça de me levantar arrependido e confiante em Vossa misericórdia.' },
  { num: 4, title: 'Jesus encontra Sua Mãe', scripture: 'Lc 2,34-35', meditation: 'A espada de dor atravessa o Coração Imaculado de Maria. Mãe e Filho unidos no sacrifício redentor.', prayer: 'Maria Santíssima, concedei-me a graça de compartilhar vossa compaixão diante dos sofrimentos de Jesus.' },
  { num: 5, title: 'Simão Cireneu ajuda Jesus', scripture: 'Mc 15,21', meditation: 'Simão é obrigado a ajudar, mas descobre a graça nesse serviço. Somos chamados a ajudar Cristo nos que sofrem.', prayer: 'Senhor, dai-me um coração generoso para ajudar os que sofrem, vendo em cada um o Vosso rosto.' },
  { num: 6, title: 'Verônica enxuga o rosto de Jesus', scripture: 'Is 53,2-3', meditation: 'Um gesto de coragem e compaixão. O rosto desfigurado de Cristo se imprime no véu. A face de Deus se revela no sofrimento.', prayer: 'Senhor, dai-me a coragem de Verônica para socorrer os que sofrem, mesmo quando o mundo se cala.' },
  { num: 7, title: 'Jesus cai pela segunda vez', scripture: 'Sl 22,7-8', meditation: 'A segunda queda revela a persistência do pecado humano. Mas Cristo continua caminhando por amor a nós.', prayer: 'Senhor, nas minhas recaídas, não permitais que eu desespere, mas que confie sempre em Vossa graça.' },
  { num: 8, title: 'Jesus consola as mulheres de Jerusalém', scripture: 'Lc 23,27-31', meditation: 'Mesmo em Sua agonia, Jesus pensa nos outros. "Não choreis por mim, chorai por vós e por vossos filhos."', prayer: 'Senhor, dai-me a graça de chorar sinceramente por meus pecados e de consolar os que sofrem.' },
  { num: 9, title: 'Jesus cai pela terceira vez', scripture: 'Lm 3,27-32', meditation: 'A terceira queda mostra o esgotamento total. Cristo desce ao abismo de nossa fraqueza para nos elevar.', prayer: 'Senhor, quando eu estiver no limite das minhas forças, sustentai-me com Vossa graça.' },
  { num: 10, title: 'Jesus é despojado de Suas vestes', scripture: 'Sl 22,19', meditation: 'Despojado de tudo, Cristo revela que nossa dignidade não vem das aparências, mas do amor de Deus.', prayer: 'Senhor, despojai-me de todo apego desordenado e revesti-me da Vossa caridade.' },
  { num: 11, title: 'Jesus é pregado na Cruz', scripture: 'Lc 23,33-34', meditation: '"Pai, perdoai-os, pois não sabem o que fazem." O perdão divino se manifesta no ápice da dor.', prayer: 'Senhor, dai-me a graça de perdoar como Vós perdoastes, mesmo aqueles que me fizeram mal.' },
  { num: 12, title: 'Jesus morre na Cruz', scripture: 'Jo 19,28-30', meditation: '"Está consumado." O sacrifício perfeito é oferecido. O véu do Templo se rasga. A salvação é realizada.', prayer: 'Senhor Jesus, pela Vossa morte na Cruz, concedei-me a graça de morrer para o pecado e viver para Deus.' },
  { num: 13, title: 'Jesus é descido da Cruz', scripture: 'Jo 19,38-40', meditation: 'O corpo sagrado é deposto nos braços de Maria. A Pietà — a Mãe recebe o Filho morto.', prayer: 'Maria, Mãe de Deus, recebei-me em vossos braços como recebestes o corpo de vosso Filho.' },
  { num: 14, title: 'Jesus é colocado no sepulcro', scripture: 'Mt 27,59-60', meditation: 'O grão de trigo cai na terra e morre para dar muito fruto. O sepulcro não é o fim, mas o prelúdio da Ressurreição.', prayer: 'Senhor, sepultai em mim o homem velho do pecado e fazei nascer o homem novo em Cristo Ressuscitado. Amém.' },
];

const ViaCrucis: React.FC = () => {
  const [currentStation, setCurrentStation] = useState(0);
  const [isJourney, setIsJourney] = useState(false);

  if (!isJourney) {
    return (
      <div className="max-w-5xl mx-auto space-y-12 pb-12">
        <div className="text-center space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/5 border border-primary/10 rounded-full">
            <Cross className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Via Dolorosa</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground tracking-tight">Via Crucis</h1>
          <p className="text-lg text-muted-foreground font-serif italic max-w-2xl mx-auto">"Se alguém quer vir após mim, negue-se a si mesmo, tome sua cruz e siga-me."</p>
        </div>

        <div className="flex justify-center">
          <button onClick={() => setIsJourney(true)} 
            className="group px-10 py-5 bg-foreground text-background rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-primary hover:text-primary-foreground transition-all active:scale-95 flex items-center gap-3">
            <Play className="w-4 h-4 fill-current" /> Iniciar Via Sacra
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STATIONS.map((s, i) => (
            <button key={i} onClick={() => { setCurrentStation(i); setIsJourney(true); }}
              className="text-left p-6 rounded-3xl bg-card border border-border hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                <Cross className="w-32 h-32 -mr-8 -mt-8 rotate-12" />
              </div>
              <div className="relative z-10 flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black text-lg shrink-0 border border-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">{s.num}</div>
                <div>
                  <p className="font-serif font-bold text-lg text-foreground group-hover:text-primary transition-colors leading-tight">{s.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-black opacity-60">{s.scripture}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const station = STATIONS[currentStation];

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-12 animate-in fade-in duration-700">
      {/* Navigation */}
      <div className="flex items-center justify-between px-2">
        <button onClick={() => setIsJourney(false)} className="p-3 rounded-2xl bg-card border border-border hover:bg-primary/5 transition-all active:scale-95 shadow-sm flex items-center gap-2">
          <ArrowLeft className="w-5 h-5 text-foreground" />
          <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Voltar</span>
        </button>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-1">Via Sacra</p>
          <span className="text-sm font-serif font-bold text-foreground">
            Estação {currentStation + 1} de 14
          </span>
        </div>
        <div className="w-14" />
      </div>

      {/* Progress */}
      <div className="flex gap-1.5 px-2">
        {STATIONS.map((_, i) => (
          <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${i <= currentStation ? 'bg-primary shadow-[0_0_8px_rgba(var(--primary),0.3)]' : 'bg-border'}`} />
        ))}
      </div>

      {/* Station content */}
      <div className="bg-card border border-border rounded-[3rem] p-8 md:p-16 space-y-12 shadow-2xl shadow-black/[0.02] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.02]">
          <Cross className="w-64 h-64 -mr-16 -mt-16 rotate-12" />
        </div>
        
        <div className="relative text-center space-y-6">
          <div className="w-20 h-20 rounded-[2rem] bg-foreground text-background flex items-center justify-center font-black text-3xl mx-auto shadow-xl border-4 border-background">{station.num}</div>
          <div className="space-y-2">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground tracking-tight">{station.title}</h2>
            <p className="text-sm text-primary font-bold uppercase tracking-widest flex items-center justify-center gap-2">
              <BookOpen className="w-4 h-4" /> {station.scripture}
            </p>
          </div>
        </div>

        <div className="relative space-y-12 max-w-2xl mx-auto">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 text-center">Meditação</h3>
            <p className="text-xl md:text-2xl text-foreground/90 leading-relaxed font-serif text-center italic">"{station.meditation}"</p>
          </div>
          
          <div className="bg-primary/5 rounded-[2.5rem] p-8 md:p-12 border border-primary/10 relative">
            <Flame className="absolute -top-3 -right-3 w-8 h-8 text-primary/20 rotate-12" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 text-center mb-6">Oração</h3>
            <p className="text-lg text-foreground/80 leading-relaxed font-serif text-center">{station.prayer}</p>
          </div>
          
          <div className="text-center space-y-2 pt-4 opacity-60">
            <p className="text-sm font-serif font-bold text-foreground">V. Adoramus te, Christe, et benedicimus tibi.</p>
            <p className="text-sm font-serif italic text-muted-foreground">R. Quia per sanctam Crucem tuam redemisti mundum.</p>
          </div>
        </div>
      </div>

      {/* Nav buttons */}
      <div className="flex gap-4 justify-center px-4">
        <button 
          disabled={currentStation <= 0} 
          onClick={() => setCurrentStation(currentStation - 1)}
          className="flex-1 max-w-[200px] h-14 rounded-2xl bg-card border border-border text-[10px] font-black uppercase tracking-widest disabled:opacity-20 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 group shadow-sm"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Anterior
        </button>
        
        {currentStation < STATIONS.length - 1 ? (
          <button 
            onClick={() => setCurrentStation(currentStation + 1)}
            className="flex-1 max-w-[200px] h-14 rounded-2xl bg-foreground text-background text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-2 group shadow-xl"
          >
            Próxima <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        ) : (
          <button 
            onClick={() => setIsJourney(false)}
            className="flex-1 max-w-[200px] h-14 rounded-2xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-primary/20"
          >
            ✝ Concluir
          </button>
        )}
      </div>
    </div>
  );
};

export default ViaCrucis;