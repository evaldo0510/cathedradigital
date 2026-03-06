import React, { useState } from 'react';
import { Icons } from '../../constants';

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
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
            <Icons.Cross className="w-4 h-4 text-primary" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Via Dolorosa</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Via Crucis</h1>
          <p className="text-muted-foreground font-serif italic">As 14 Estações da Via Sacra — meditação e oração.</p>
        </div>

        <div className="text-center">
          <button onClick={() => setIsJourney(true)} className="px-8 py-4 bg-foreground text-background rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-primary hover:text-primary-foreground transition-all">
            Iniciar Via Sacra
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STATIONS.map((s, i) => (
            <button key={i} onClick={() => { setCurrentStation(i); setIsJourney(true); }}
              className="text-left p-5 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center font-black text-sm shrink-0">{s.num}</div>
                <div>
                  <p className="font-serif font-bold text-foreground group-hover:text-primary transition-colors">{s.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.scripture}</p>
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
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => setIsJourney(false)} className="p-2 rounded-xl bg-card border border-border hover:bg-primary/10 transition-all">
          <Icons.ArrowDown className="w-5 h-5 rotate-90 text-foreground" />
        </button>
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Estação {currentStation + 1} de 14
        </span>
        <div className="w-9" />
      </div>

      {/* Progress */}
      <div className="flex gap-1">
        {STATIONS.map((_, i) => (
          <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= currentStation ? 'bg-primary' : 'bg-border'}`} />
        ))}
      </div>

      {/* Station content */}
      <div className="bg-card border border-border rounded-3xl p-8 md:p-12 space-y-8">
        <div className="text-center space-y-3 pb-6 border-b border-border">
          <div className="w-16 h-16 rounded-2xl bg-foreground text-background flex items-center justify-center font-black text-2xl mx-auto">{station.num}</div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">{station.title}</h2>
          <p className="text-sm text-primary font-bold">{station.scripture}</p>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Meditação</h3>
            <p className="text-foreground/90 leading-relaxed font-serif">{station.meditation}</p>
          </div>
          <div className="bg-muted rounded-2xl p-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Oração</h3>
            <p className="text-foreground/80 leading-relaxed font-serif italic">{station.prayer}</p>
          </div>
          <div className="text-center text-sm text-muted-foreground font-serif">
            <p className="font-bold">V. Adoramus te, Christe, et benedicimus tibi.</p>
            <p className="italic">R. Quia per sanctam Crucem tuam redemisti mundum.</p>
          </div>
        </div>
      </div>

      {/* Nav buttons */}
      <div className="flex gap-3 justify-center">
        <button disabled={currentStation <= 0} onClick={() => setCurrentStation(currentStation - 1)}
          className="px-6 py-3 rounded-xl bg-card border border-border text-sm font-bold disabled:opacity-30 hover:bg-primary/10 transition-all">
          ← Anterior
        </button>
        {currentStation < STATIONS.length - 1 ? (
          <button onClick={() => setCurrentStation(currentStation + 1)}
            className="px-6 py-3 rounded-xl bg-foreground text-background text-sm font-bold hover:bg-primary hover:text-primary-foreground transition-all">
            Próxima Estação →
          </button>
        ) : (
          <button onClick={() => setIsJourney(false)}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-all">
            ✝ Concluir Via Sacra
          </button>
        )}
      </div>
    </div>
  );
};

export default ViaCrucis;
