import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
import { Icons } from '../../constants';
import { Button } from '@/components/ui/button';
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
      <motion.div className="max-w-5xl mx-auto space-y-spacing-2xl pb-spacing-2xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <motion.div className="text-center space-y-spacing-md pt-spacing-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <div className="inline-flex items-center gap-spacing-xs px-spacing-md py-spacing-2xs bg-primary/5 border border-primary/10 rounded-premium">
            <Cross className="w-spacing-md h-spacing-md text-primary" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Via Dolorosa</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground tracking-tight">Via Crucis</h1>
          <p className="text-lg text-muted-foreground font-serif italic max-w-spacing-2xl mx-auto">"Se alguém quer vir após mim, negue-se a si mesmo, tome sua cruz e siga-me."</p>
        </motion.div>

        <div className="flex justify-center">
          <Button onClick={() => setIsJourney(true)} size="lg" className="h-spacing-3xl px-spacing-xl gap-spacing-sm rounded-full shadow-premium-hover">
            <Play className="w-spacing-md h-spacing-md fill-current" /> Iniciar Via Sacra
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-spacing-md">
          {STATIONS.map((s, i) => (
            <Button key={i} onClick={() => { setCurrentStation(i); setIsJourney(true); }}
              className="text-left p-spacing-lg rounded-full bg-card border border-border hover:border-primary/40 hover:shadow-premium-hover hover:-translate-y-1 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-spacing-lg opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                <Cross className="w-spacing-4xl h-spacing-4xl -mr-spacing-xl -mt-spacing-xl rotate-12" />
              </div>
              <div className="relative z-10 flex items-center gap-spacing-md">
                <div className="w-spacing-2xl h-spacing-2xl rounded-premium bg-primary/5 text-primary flex items-center justify-center font-black text-lg shrink-0 border border-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">{s.num}</div>
                <div>
                  <p className="font-serif font-bold text-lg text-foreground group-hover:text-primary transition-colors leading-tight">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-spacing-2xs uppercase tracking-widest font-black opacity-60">{s.scripture}</p>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </motion.div>
    );
  }

  const station = STATIONS[currentStation];

  return (
    <div className="max-w-spacing-4xl mx-auto space-y-spacing-xl pb-spacing-2xl animate-in fade-in duration-700">
      {/* Navigation */}
      <div className="flex items-center justify-between px-spacing-xs">
        <Button variant="outline" size="sm" onClick={() => setIsJourney(false)} className="rounded-full shadow-md gap-spacing-xs">
          <ArrowLeft className="w-spacing-md h-spacing-md text-foreground" />
          <span className="text-xs font-black uppercase tracking-widest hidden md:block">Voltar</span>
        </Button>
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary/60 mb-spacing-2xs">Via Sacra</p>
          <span className="text-sm font-serif font-bold text-foreground">
            Estação {currentStation + 1} de 14
          </span>
        </div>
        <div className="w-spacing-2xl" />
      </div>

      {/* Progress */}
      <div className="flex gap-spacing-2xs px-spacing-xs">
        {STATIONS.map((_, i) => (
          <div key={i} className={`flex-1 h-spacing-2xs rounded-full transition-all duration-500 ${i <= currentStation ? 'bg-primary shadow-[0_0_8px_rgba(var(--primary),0.3)]' : 'bg-border'}`} />
        ))}
      </div>

      {/* Station content */}
      <div className="bg-card border border-border rounded-[3rem] p-spacing-xl md:p-spacing-3xl space-y-spacing-2xl shadow-premium-hover shadow-black/[0.02] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-spacing-2xl opacity-[0.02]">
          <Cross className="w-spacing-4xl h-spacing-4xl -mr-spacing-3xl -mt-spacing-3xl rotate-12" />
        </div>
        
        <div className="relative text-center space-y-spacing-lg">
          <div className="w-spacing-3xl h-spacing-3xl rounded-[2rem] bg-foreground text-background flex items-center justify-center font-black text-3xl mx-auto shadow-premium-hover border-4 border-background">{station.num}</div>
          <div className="space-y-spacing-xs">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground tracking-tight">{station.title}</h2>
            <p className="text-sm text-primary font-bold uppercase tracking-widest flex items-center justify-center gap-spacing-xs">
              <BookOpen className="w-spacing-md h-spacing-md" /> {station.scripture}
            </p>
          </div>
        </div>

        <div className="relative space-y-spacing-2xl max-w-spacing-2xl mx-auto">
          <div className="space-y-spacing-md">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary/40 text-center">Meditação</h3>
            <p className="text-xl md:text-2xl text-foreground/90 leading-relaxed font-serif text-center italic">"{station.meditation}"</p>
          </div>
          
          <div className="bg-primary/5 rounded-[2.5rem] p-spacing-xl md:p-spacing-2xl border border-primary/10 relative">
            <Flame className="absolute -top-spacing-sm -right-spacing-sm w-spacing-xl h-spacing-xl text-primary/60 rotate-12" />
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary/40 text-center mb-spacing-lg">Oração</h3>
            <p className="text-lg text-foreground/80 leading-relaxed font-serif text-center">{station.prayer}</p>
          </div>
          
          <div className="text-center space-y-spacing-xs pt-spacing-md opacity-60">
            <p className="text-sm font-serif font-bold text-foreground">V. Adoramus te, Christe, et benedicimus tibi.</p>
            <p className="text-sm font-serif italic text-muted-foreground">R. Quia per sanctam Crucem tuam redemisti mundum.</p>
          </div>

          <div className="flex justify-center pt-spacing-xs">
            <ShareButton
              title={`Via Crucis — ${station.num}ª Estação`}
              text={`${station.title}\n\n${station.meditation}\n\nOração: ${station.prayer}`}
              variant="outline"
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Nav buttons */}
      <div className="flex gap-spacing-md justify-center px-spacing-md">
        <Button 
          variant="outline"
          disabled={currentStation <= 0} 
          onClick={() => setCurrentStation(currentStation - 1)}
          className="flex-1 max-w-[200px] h-spacing-2xl rounded-full"
        >
          <ChevronLeft className="w-spacing-md h-spacing-md" /> Anterior
        </Button>
        
        {currentStation < STATIONS.length - 1 ? (
          <Button 
            onClick={() => setCurrentStation(currentStation + 1)}
            className="flex-1 max-w-[200px] h-spacing-2xl rounded-full bg-foreground text-background hover:bg-primary"
          >
            Próxima <ChevronRight className="w-spacing-md h-spacing-md" />
          </Button>
        ) : (
          <Button 
            onClick={() => setIsJourney(false)}
            className="flex-1 max-w-[200px] h-spacing-2xl rounded-full bg-primary text-primary-foreground shadow-premium-hover shadow-primary/20"
          >
            <Icons.Cross className="w-spacing-md h-spacing-md" /> Concluir
          </Button>
        )}
      </div>
    </div>
  );
};

export default ViaCrucis;