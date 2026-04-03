import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../../constants';
import PrayerAudioPlayer from './PrayerAudioPlayer';

type MysteryKey = 'gozosos' | 'dolorosos' | 'gloriosos' | 'luminosos';

const YOUTUBE_IDS: Record<MysteryKey, string> = {
  gozosos: 'y0nohEWE7PI',
  dolorosos: 'etp-5E9f0lk',
  gloriosos: 'kcsu2e-0j2I',
  luminosos: 'kmHzPZihdvY',
};

const YouTubePlayer: React.FC<{ videoId: string; title: string }> = ({ videoId, title }) => (
  <div className="w-full aspect-video rounded-2xl overflow-hidden border border-border bg-black">
    <iframe
      src={`https://www.youtube.com/embed/${videoId}?rel=0`}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="w-full h-full"
    />
  </div>
);

const MYSTERY_DATA: Record<MysteryKey, {
  title: string;
  emoji: string;
  days: string;
  mysteries: { title: string; scripture: string; meditation: string }[];
}> = {
  gozosos: {
    title: 'Mistérios Gozosos',
    emoji: '😊',
    days: 'Segunda e Sábado',
    mysteries: [
      { title: 'A Anunciação do Anjo a Maria', scripture: 'Lc 1,26-38', meditation: 'O Anjo Gabriel anuncia a Maria que ela será Mãe do Salvador.' },
      { title: 'A Visitação de Maria a Isabel', scripture: 'Lc 1,39-56', meditation: 'Maria vai às pressas visitar Isabel. João Batista exulta no ventre.' },
      { title: 'O Nascimento de Jesus', scripture: 'Lc 2,1-20', meditation: 'O Verbo se faz carne em Belém, na pobreza de uma manjedoura.' },
      { title: 'A Apresentação de Jesus no Templo', scripture: 'Lc 2,22-38', meditation: 'Jesus é oferecido ao Pai. Simeão profetiza: "Luz para iluminar as nações."' },
      { title: 'A Perda e o Encontro de Jesus no Templo', scripture: 'Lc 2,41-52', meditation: 'Após três dias, Jesus é encontrado entre os doutores.' },
    ],
  },
  dolorosos: {
    title: 'Mistérios Dolorosos',
    emoji: '😢',
    days: 'Terça e Sexta',
    mysteries: [
      { title: 'A Agonia de Jesus no Horto', scripture: 'Lc 22,39-46', meditation: 'Jesus sua sangue no Getsêmani. "Não a minha vontade, mas a Tua."' },
      { title: 'A Flagelação de Jesus', scripture: 'Jo 19,1', meditation: '"Por suas chagas fomos curados." Cada golpe é um pecado nosso.' },
      { title: 'A Coroação de Espinhos', scripture: 'Mt 27,27-31', meditation: 'Os soldados tecem uma coroa de espinhos e zombam: "Salve, Rei dos Judeus!"' },
      { title: 'Jesus Carrega a Cruz', scripture: 'Jo 19,17', meditation: 'Jesus toma sobre Si a Cruz — o peso de todos os pecados.' },
      { title: 'A Crucificação e Morte de Jesus', scripture: 'Lc 23,33-46', meditation: '"Pai, perdoai-os." "Está consumado." O sacrifício perfeito.' },
    ],
  },
  gloriosos: {
    title: 'Mistérios Gloriosos',
    emoji: '✨',
    days: 'Quarta e Domingo',
    mysteries: [
      { title: 'A Ressurreição de Jesus', scripture: 'Mc 16,1-7', meditation: '"Ele ressuscitou!" A morte foi vencida para sempre.' },
      { title: 'A Ascensão de Jesus ao Céu', scripture: 'At 1,9-11', meditation: 'Jesus sobe aos céus. "Ide e fazei discípulos de todas as nações."' },
      { title: 'A Vinda do Espírito Santo', scripture: 'At 2,1-4', meditation: 'Línguas de fogo descem sobre os apóstolos em Pentecostes.' },
      { title: 'A Assunção de Maria ao Céu', scripture: 'Ap 12,1', meditation: 'Maria é elevada ao Céu em corpo e alma, sinal de nossa esperança.' },
      { title: 'A Coroação de Maria como Rainha', scripture: 'Ap 12,1', meditation: 'Maria é coroada Rainha do Céu e da Terra.' },
    ],
  },
  luminosos: {
    title: 'Mistérios Luminosos',
    emoji: '💡',
    days: 'Quinta',
    mysteries: [
      { title: 'O Batismo de Jesus no Jordão', scripture: 'Mt 3,13-17', meditation: '"Este é o meu Filho amado." Jesus santifica o Batismo.' },
      { title: 'As Bodas de Caná', scripture: 'Jo 2,1-11', meditation: '"Fazei tudo o que Ele vos disser." O primeiro sinal de Jesus.' },
      { title: 'O Anúncio do Reino de Deus', scripture: 'Mc 1,14-15', meditation: '"Convertei-vos e crede no Evangelho."' },
      { title: 'A Transfiguração de Jesus', scripture: 'Mt 17,1-8', meditation: 'No Tabor, o rosto de Jesus brilha como o sol.' },
      { title: 'A Instituição da Eucaristia', scripture: 'Lc 22,19-20', meditation: '"Isto é o meu Corpo… Isto é o meu Sangue."' },
    ],
  },
};

const PRAYERS = {
  paiNosso: 'Pai nosso que estais nos céus, santificado seja o vosso nome, venha a nós o vosso reino, seja feita a vossa vontade assim na terra como no céu. O pão nosso de cada dia nos dai hoje, perdoai-nos as nossas ofensas assim como nós perdoamos a quem nos tem ofendido, e não nos deixeis cair em tentação, mas livrai-nos do mal. Amém.',
  aveMaria: 'Ave Maria, cheia de graça, o Senhor é convosco, bendita sois vós entre as mulheres e bendito é o fruto do vosso ventre, Jesus. Santa Maria, Mãe de Deus, rogai por nós pecadores, agora e na hora da nossa morte. Amém.',
  gloria: 'Glória ao Pai, e ao Filho, e ao Espírito Santo. Como era no princípio, agora e sempre, e por todos os séculos dos séculos. Amém.',
  salveRainha: 'Salve Rainha, Mãe de Misericórdia, vida, doçura, esperança nossa, salve! A vós bradamos, os degredados filhos de Eva. A vós suspiramos, gemendo e chorando neste vale de lágrimas. Eia, pois, advogada nossa, esses vossos olhos misericordiosos a nós volvei. E depois deste desterro, mostrai-nos Jesus, bendito fruto do vosso ventre. Ó clemente, ó piedosa, ó doce sempre Virgem Maria. Rogai por nós, Santa Mãe de Deus, para que sejamos dignos das promessas de Cristo. Amém.',
};

function getMysteryOfDay(): MysteryKey {
  const day = new Date().getDay();
  if (day === 1 || day === 6) return 'gozosos';
  if (day === 2 || day === 5) return 'dolorosos';
  if (day === 3 || day === 0) return 'gloriosos';
  return 'luminosos';
}

function getDayName(): string {
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return days[new Date().getDay()];
}

// ---------- Prayer Mode ----------
const PrayerMode: React.FC<{ mysteryKey: MysteryKey; intention: string; onClose: () => void }> = ({ mysteryKey, intention, onClose }) => {
  const data = MYSTERY_DATA[mysteryKey];
  const [currentMystery, setCurrentMystery] = useState(0);
  const [phase, setPhase] = useState<'intro' | 'mystery' | 'decade' | 'closing'>('intro');
  const [expandedPrayer, setExpandedPrayer] = useState<string | null>(null);
  const [aveCount, setAveCount] = useState(0);

  const mystery = data.mysteries[currentMystery];

  return (
    <div className="fixed inset-0 z-[200] flex flex-col overflow-y-auto"
      style={{ background: 'linear-gradient(180deg, #1a1510 0%, #0d0b08 50%, #1a1510 100%)' }}>
      {/* Header — minimal */}
      <div className="flex items-center justify-between p-4">
        <button onClick={onClose} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
          <Icons.ArrowDown className="w-5 h-5 rotate-90 text-amber-200/70" />
        </button>
        <span className="text-[10px] font-black uppercase tracking-widest text-amber-200/40">{data.title}</span>
        <div className="w-9" />
      </div>

      {/* Progress */}
      {(phase === 'mystery' || phase === 'decade') && (
        <div className="flex gap-1 px-6 pt-2">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= currentMystery ? 'bg-amber-400/60' : 'bg-white/10'}`} />
          ))}
        </div>
      )}

      {/* Intention */}
      {intention && phase === 'intro' && (
        <div className="mx-6 mt-4 p-4 bg-amber-400/5 border border-amber-400/10 rounded-2xl text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-300/50 mb-1">Intenção</p>
          <p className="text-base font-serif text-amber-100/70 italic">"{intention}"</p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-start justify-center p-6">
        <div className="w-full max-w-xl bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8 md:p-10 space-y-6 backdrop-blur-sm">
          {/* Audio Player — works in background */}
          <PrayerAudioPlayer
            variant="dark"
            prayers={[
              { label: 'Pai Nosso', text: PRAYERS.paiNosso },
              ...Array.from({ length: 10 }, (_, i) => ({ label: `Ave Maria ${i + 1}`, text: PRAYERS.aveMaria })),
              { label: 'Glória ao Pai', text: PRAYERS.gloria },
            ]}
          />

          {/* YouTube Player — optional visual */}
          <YouTubePlayer videoId={YOUTUBE_IDS[mysteryKey]} title={data.title} />

          {phase === 'intro' && (
            <>
              <h3 className="text-xl font-serif font-bold text-amber-100 text-center">Orações Iniciais</h3>
              <p className="text-xs text-amber-200/40 text-center font-serif italic">Sinal da Cruz + Credo + 3 Ave-Marias + Glória</p>
              {[
                { key: 'paiNosso', label: 'Pai Nosso' },
                { key: 'aveMaria', label: 'Ave Maria' },
                { key: 'gloria', label: 'Glória ao Pai' },
              ].map(p => (
                <div key={p.key} className="bg-white/[0.04] rounded-2xl p-5 cursor-pointer border border-white/[0.06] hover:bg-white/[0.07] transition-all" onClick={() => setExpandedPrayer(expandedPrayer === p.key ? null : p.key)}>
                  <p className="font-bold text-sm text-amber-100/90">{p.label}</p>
                  {expandedPrayer === p.key && (
                    <p className="text-base text-amber-100/60 mt-3 font-serif leading-[1.9]">{PRAYERS[p.key as keyof typeof PRAYERS]}</p>
                  )}
                </div>
              ))}
              <button onClick={() => setPhase('mystery')} className="w-full py-3.5 bg-amber-400/20 text-amber-200 border border-amber-400/20 rounded-xl font-bold text-sm hover:bg-amber-400/30 transition-all">
                Iniciar 1º Mistério →
              </button>
            </>
          )}

          {phase === 'mystery' && (
            <>
              <div className="text-center space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400/50">{currentMystery + 1}º Mistério</span>
                <h3 className="text-2xl font-serif font-bold text-amber-100 leading-snug">{mystery.title}</h3>
                <p className="text-sm text-amber-400/60 font-bold">{mystery.scripture}</p>
              </div>
              <div className="bg-white/[0.04] rounded-2xl p-6 border border-white/[0.06]">
                <p className="text-lg text-amber-100/60 font-serif leading-[1.9] text-center">{mystery.meditation}</p>
              </div>
              <button onClick={() => setPhase('decade')} className="w-full py-3.5 bg-amber-400/20 text-amber-200 border border-amber-400/20 rounded-xl font-bold text-sm hover:bg-amber-400/30 transition-all">
                Rezar a Dezena →
              </button>
            </>
          )}

          {phase === 'decade' && (
            <>
              <p className="text-center text-[10px] font-black uppercase tracking-widest text-amber-200/30">{currentMystery + 1}º Mistério — Dezena</p>
              
              {/* Bead Counter */}
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="flex items-center gap-2.5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setAveCount(i + 1)}
                      className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                        i < aveCount
                          ? 'bg-amber-400 border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)] scale-110'
                          : 'bg-transparent border-amber-400/25 hover:border-amber-400/50'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-amber-200/40 text-xs font-bold">{aveCount}/10 Ave-Marias</p>
              </div>

              {[
                { key: 'paiNosso', label: 'Pai Nosso' },
                { key: 'aveMaria', label: 'Ave Maria (×10)' },
                { key: 'gloria', label: 'Glória ao Pai' },
              ].map(p => (
                <div key={p.key} className="bg-white/[0.04] rounded-2xl p-5 cursor-pointer border border-white/[0.06] hover:bg-white/[0.07] transition-all" onClick={() => setExpandedPrayer(expandedPrayer === p.key ? null : p.key)}>
                  <p className="font-bold text-sm text-amber-100/90">{p.label}</p>
                  {expandedPrayer === p.key && (
                    <p className="text-base text-amber-100/60 mt-3 font-serif leading-[1.9]">{PRAYERS[p.key as keyof typeof PRAYERS]}</p>
                  )}
                </div>
              ))}
              <button onClick={() => {
                setExpandedPrayer(null);
                setAveCount(0);
                if (currentMystery < 4) {
                  setCurrentMystery(currentMystery + 1);
                  setPhase('mystery');
                } else {
                  setPhase('closing');
                }
              }} className="w-full py-3.5 bg-amber-400/20 text-amber-200 border border-amber-400/20 rounded-xl font-bold text-sm hover:bg-amber-400/30 transition-all">
                {currentMystery < 4 ? 'Próximo Mistério →' : 'Concluir Rosário →'}
              </button>
            </>
          )}

          {phase === 'closing' && (
            <>
              <h3 className="text-xl font-serif font-bold text-amber-100 text-center">Oração Final</h3>
              <div className="bg-white/[0.04] rounded-2xl p-5 cursor-pointer border border-white/[0.06] hover:bg-white/[0.07] transition-all" onClick={() => setExpandedPrayer(expandedPrayer === 'salve' ? null : 'salve')}>
                <p className="font-bold text-sm text-amber-100/90">Salve Rainha</p>
                {expandedPrayer === 'salve' && (
                  <p className="text-base text-amber-100/60 mt-3 font-serif leading-[1.9]">{PRAYERS.salveRainha}</p>
                )}
              </div>
              <div className="text-center space-y-3 py-6">
                <Icons.Heart className="w-12 h-12 text-amber-400/40 mx-auto" />
                <p className="text-amber-100 font-serif font-bold text-xl">Rosário Completo!</p>
                <p className="text-base text-amber-200/40 font-serif italic">Que Nossa Senhora interceda por vós e vossas intenções.</p>
              </div>
              <button onClick={onClose} className="w-full py-3.5 bg-amber-400/20 text-amber-200 border border-amber-400/20 rounded-xl font-bold text-sm hover:bg-amber-400/30 transition-all">
                ✝ Amém — Finalizar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------- Main Page ----------
const PrayerPage: React.FC = () => {
  const todayKey = getMysteryOfDay();
  const todayData = MYSTERY_DATA[todayKey];
  const [intention, setIntention] = useState('');
  const [prayingMystery, setPrayingMystery] = useState<MysteryKey | null>(null);

  if (prayingMystery) {
    return createPortal(
      <PrayerMode mysteryKey={prayingMystery} intention={intention} onClose={() => setPrayingMystery(null)} />,
      document.body
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <Icons.Heart className="w-4 h-4 text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Oratio</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Oração e Devoção</h1>
        <p className="text-muted-foreground font-serif italic">Um companheiro para sua vida de oração.</p>
      </div>

      {/* BLOCK 1 — Terço do Dia */}
      <div className="bg-card border border-border rounded-3xl p-8 md:p-10 text-center space-y-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-primary">{getDayName()}</span>
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">📿 Terço de Hoje</h2>
        <p className="text-lg font-serif text-muted-foreground">{todayData.emoji} {todayData.title}</p>
        <p className="text-xs text-muted-foreground">{todayData.days}</p>

        {/* Audio Player — works in background */}
        <div className="max-w-lg mx-auto pt-2">
          <PrayerAudioPlayer
            prayers={[
              { label: 'Pai Nosso', text: PRAYERS.paiNosso },
              ...Array.from({ length: 10 }, (_, i) => ({ label: `Ave Maria ${i + 1}`, text: PRAYERS.aveMaria })),
              { label: 'Glória ao Pai', text: PRAYERS.gloria },
              { label: 'Salve Rainha', text: PRAYERS.salveRainha },
            ]}
          />
        </div>

        {/* YouTube Player — optional video */}
        <div className="max-w-lg mx-auto pt-2">
          <YouTubePlayer videoId={YOUTUBE_IDS[todayKey]} title={todayData.title} />
        </div>

        {/* Intention */}
        <div className="max-w-md mx-auto pt-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">
            🧠 Por quem você oferece este terço?
          </label>
          <input
            type="text"
            value={intention}
            onChange={e => setIntention(e.target.value)}
            placeholder="Escreva sua intenção..."
            className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm font-serif text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <button
          onClick={() => setPrayingMystery(todayKey)}
          className="inline-flex items-center gap-3 px-8 py-4 bg-foreground text-background rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-primary hover:text-primary-foreground transition-all mt-2"
        >
          <span>▶️</span> Rezar Agora
        </button>
      </div>

      {/* BLOCK 2 — Escolher Mistérios */}
      <div className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-foreground text-center">Mistérios do Rosário</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(Object.entries(MYSTERY_DATA) as [MysteryKey, typeof MYSTERY_DATA[MysteryKey]][]).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setPrayingMystery(key)}
              className={`p-5 rounded-2xl border text-center transition-all group hover:border-primary/50 hover:bg-primary/5 ${
                key === todayKey ? 'bg-primary/5 border-primary/30' : 'bg-card border-border'
              }`}
            >
              <span className="text-3xl block mb-2">{val.emoji}</span>
              <p className="font-serif font-bold text-sm text-foreground group-hover:text-primary transition-colors">{val.title.replace('Mistérios ', '')}</p>
              <p className="text-[9px] text-muted-foreground mt-1 uppercase tracking-widest font-bold">{val.days}</p>
              {key === todayKey && (
                <span className="inline-block mt-2 text-[8px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">Hoje</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* BLOCK 3 — Rosário Completo */}
      <div className="bg-card border border-border rounded-3xl p-8 text-center space-y-4">
        <h2 className="text-xl font-serif font-bold text-foreground">📿 Rosário Completo</h2>
        <p className="text-sm text-muted-foreground font-serif">Reze os 4 conjuntos de mistérios — 20 dezenas completas.</p>
        <p className="text-xs text-muted-foreground italic">Escolha um dos mistérios acima para começar. Após finalizar, volte e reze o próximo.</p>
      </div>

      {/* Orações Essenciais */}
      <div className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-foreground text-center">Orações Essenciais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'paiNosso', title: 'Pai Nosso' },
            { key: 'aveMaria', title: 'Ave Maria' },
            { key: 'gloria', title: 'Glória ao Pai' },
            { key: 'salveRainha', title: 'Salve Rainha' },
          ].map(p => (
            <div key={p.key} className="bg-card border border-border rounded-2xl p-5">
              <p className="font-serif font-bold text-foreground mb-2">{p.title}</p>
              <p className="text-sm text-muted-foreground font-serif leading-relaxed">{PRAYERS[p.key as keyof typeof PRAYERS]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrayerPage;
