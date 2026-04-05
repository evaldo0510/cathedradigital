import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ShareButton from './ShareButton';
import { createPortal } from 'react-dom';
import { Icons } from '../../constants';
import { 
  Heart, 
  ArrowLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Video, 
  MessageSquare, 
  Flame, 
  Sun, 
  Cloud, 
  Moon,
  Zap,
  Star,
  Activity,
  Calendar,
  Sparkles,
  BookOpen,
  Music,
  Clock,
  Youtube,
  Search,
  Cross
} from 'lucide-react';
import PrayerAudioPlayer from './PrayerAudioPlayer';

type MysteryKey = 'gozosos' | 'dolorosos' | 'gloriosos' | 'luminosos';

const YOUTUBE_IDS: Record<MysteryKey, string> = {
  gozosos: 'y0nohEWE7PI',
  dolorosos: 'etp-5E9f0lk',
  gloriosos: 'kcsu2e-0j2I',
  luminosos: 'kmHzPZihdvY',
};

const YouTubePlayer: React.FC<{ videoId: string; title: string }> = ({ videoId, title }) => (
  <div className="w-full aspect-video rounded-2xl overflow-hidden border border-border bg-black shadow-lg">
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
  icon: React.FC<{ className?: string }>;
  days: string;
  color: string;
  mysteries: { title: string; scripture: string; meditation: string }[];
}> = {
  gozosos: {
    title: 'Mistérios Gozosos',
    icon: Sparkles,
    days: 'Segunda e Sábado',
    color: 'text-sky-500 bg-sky-500/10',
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
    icon: Flame,
    days: 'Terça e Sexta',
    color: 'text-rose-500 bg-rose-500/10',
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
    icon: Star,
    days: 'Quarta e Domingo',
    color: 'text-amber-500 bg-amber-500/10',
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
    icon: Zap,
    days: 'Quinta',
    color: 'text-yellow-500 bg-yellow-500/10',
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
      <div className="flex items-center justify-between p-4 sticky top-0 z-10 bg-inherit/80 backdrop-blur-md">
        <button onClick={onClose} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
          <ArrowLeft className="w-5 h-5 text-amber-200/70" />
        </button>
        <span className="text-[10px] font-black uppercase tracking-widest text-amber-200/40">{data.title}</span>
        <div className="w-9" />
      </div>

      {/* Progress */}
      {(phase === 'mystery' || phase === 'decade') && (
        <div className="flex gap-1 px-6 pt-2 max-w-xl mx-auto w-full">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-500 ${i <= currentMystery ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'bg-white/10'}`} />
          ))}
        </div>
      )}

      {/* Intention */}
      {intention && phase === 'intro' && (
        <div className="mx-6 mt-4 p-4 bg-amber-400/5 border border-amber-400/10 rounded-2xl text-center max-w-xl md:mx-auto">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-300/50 mb-1">Intenção</p>
          <p className="text-base font-serif text-amber-100/70 italic leading-relaxed">"{intention}"</p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-start justify-center p-6">
        <div className="w-full max-w-xl bg-white/[0.03] border border-white/[0.06] rounded-[2.5rem] p-8 md:p-12 space-y-8 backdrop-blur-sm shadow-2xl shadow-black/50">
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
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-serif font-bold text-amber-100">Orações Iniciais</h3>
                <p className="text-xs text-amber-200/40 font-serif italic">Sinal da Cruz + Credo + 3 Ave-Marias + Glória</p>
              </div>
              <div className="space-y-3">
                {[
                  { key: 'paiNosso', label: 'Pai Nosso' },
                  { key: 'aveMaria', label: 'Ave Maria' },
                  { key: 'gloria', label: 'Glória ao Pai' },
                ].map(p => (
                  <div key={p.key} className="group bg-white/[0.04] rounded-2xl p-5 cursor-pointer border border-white/[0.06] hover:bg-white/[0.07] transition-all" onClick={() => setExpandedPrayer(expandedPrayer === p.key ? null : p.key)}>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-amber-100/90">{p.label}</p>
                      <ChevronRight className={`w-4 h-4 text-amber-200/30 transition-transform ${expandedPrayer === p.key ? 'rotate-90' : ''}`} />
                    </div>
                    {expandedPrayer === p.key && (
                      <p className="text-lg md:text-xl text-amber-100/60 mt-3 font-serif leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">{PRAYERS[p.key as keyof typeof PRAYERS]}</p>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => setPhase('mystery')} className="w-full py-4 bg-amber-400/20 text-amber-200 border border-amber-400/20 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-400/30 transition-all shadow-lg shadow-amber-900/20">
                Iniciar 1º Mistério
              </button>
            </div>
          )}

          {phase === 'mystery' && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="text-center space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400/50">{currentMystery + 1}º Mistério</span>
                <h3 className="text-3xl font-serif font-bold text-amber-100 leading-tight">{mystery.title}</h3>
                <p className="text-sm text-amber-400/60 font-bold tracking-wide">{mystery.scripture}</p>
              </div>
              <div className="bg-white/[0.04] rounded-[2rem] p-8 border border-white/[0.06] relative">
                <Icons.Feather className="absolute -top-3 -right-3 w-8 h-8 text-amber-400/10 rotate-12" />
                <p className="text-xl text-amber-100/70 font-serif leading-relaxed text-center italic">"{mystery.meditation}"</p>
              </div>
              <button onClick={() => setPhase('decade')} className="w-full py-4 bg-amber-400/20 text-amber-200 border border-amber-400/20 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-400/30 transition-all shadow-lg shadow-amber-900/20">
                Rezar a Dezena
              </button>
            </div>
          )}

          {phase === 'decade' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-200/30 mb-4">{currentMystery + 1}º Mistério — Dezena</p>
                
                {/* Bead Counter */}
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="grid grid-cols-5 gap-4 md:flex md:items-center md:gap-3">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setAveCount(i + 1)}
                        className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                          i < aveCount
                            ? 'bg-amber-400 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)] scale-110'
                            : 'bg-transparent border-amber-400/25 hover:border-amber-400/50'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-amber-200/40 text-[10px] font-black uppercase tracking-[0.2em]">{aveCount}/10 Ave-Marias</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'paiNosso', label: 'Pai Nosso' },
                  { key: 'aveMaria', label: 'Ave Maria (×10)' },
                  { key: 'gloria', label: 'Glória ao Pai' },
                ].map(p => (
                  <div key={p.key} className="group bg-white/[0.04] rounded-2xl p-5 cursor-pointer border border-white/[0.06] hover:bg-white/[0.07] transition-all" onClick={() => setExpandedPrayer(expandedPrayer === p.key ? null : p.key)}>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-amber-100/90">{p.label}</p>
                      <ChevronRight className={`w-4 h-4 text-amber-200/30 transition-transform ${expandedPrayer === p.key ? 'rotate-90' : ''}`} />
                    </div>
                    {expandedPrayer === p.key && (
                      <p className="text-lg md:text-xl text-amber-100/60 mt-3 font-serif leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">{PRAYERS[p.key as keyof typeof PRAYERS]}</p>
                    )}
                  </div>
                ))}
              </div>

              <button onClick={() => {
                setExpandedPrayer(null);
                setAveCount(0);
                if (currentMystery < 4) {
                  setCurrentMystery(currentMystery + 1);
                  setPhase('mystery');
                } else {
                  setPhase('closing');
                }
              }} className="w-full py-4 bg-amber-400/20 text-amber-200 border border-amber-400/20 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-400/30 transition-all shadow-lg shadow-amber-900/20">
                {currentMystery < 4 ? 'Próximo Mistério' : 'Concluir Rosário'}
              </button>
            </div>
          )}

          {phase === 'closing' && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
              <h3 className="text-2xl font-serif font-bold text-amber-100 text-center">Oração Final</h3>
              <div className="bg-white/[0.04] rounded-2xl p-6 cursor-pointer border border-white/[0.06] hover:bg-white/[0.07] transition-all" onClick={() => setExpandedPrayer(expandedPrayer === 'salve' ? null : 'salve')}>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm text-amber-100/90">Salve Rainha</p>
                  <ChevronRight className={`w-4 h-4 text-amber-200/30 transition-transform ${expandedPrayer === 'salve' ? 'rotate-90' : ''}`} />
                </div>
                {expandedPrayer === 'salve' && (
                  <p className="text-lg text-amber-100/60 mt-4 font-serif leading-relaxed italic animate-in fade-in slide-in-from-top-2 duration-300">{PRAYERS.salveRainha}</p>
                )}
              </div>
              <div className="text-center space-y-4 py-8">
                <div className="relative inline-block">
                  <Heart className="w-16 h-16 text-amber-400/20 mx-auto" />
                  <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-amber-400/40 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <p className="text-amber-100 font-serif font-bold text-2xl">Rosário Completo!</p>
                  <p className="text-base text-amber-200/40 font-serif italic max-w-[280px] mx-auto leading-relaxed">Que Nossa Senhora interceda por vós e por todas as vossas intenções.</p>
                </div>
              </div>
              <button onClick={onClose} className="w-full py-4 bg-amber-400 text-amber-950 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-amber-300 transition-all shadow-xl shadow-amber-400/20">
                ✝ Amém — Finalizar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------- Main Page ----------
const PrayerPage: React.FC = () => {
  const navigate = useNavigate();
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
    <div className="max-w-5xl mx-auto space-y-12 pb-12">
      {/* Header */}
      <div className="text-center space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/5 border border-primary/10 rounded-full">
          <Heart className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Oratio et Devotio</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground tracking-tight">Oração e Devoção</h1>
        <p className="text-lg text-muted-foreground font-serif italic max-w-2xl mx-auto">"A oração é a respiração da alma. Sem ela, a vida interior desfalece."</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content — Today's Rosary */}
        <div className="lg:col-span-2 space-y-8">
          <div className="group relative overflow-hidden bg-card border border-border rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-black/[0.02]">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
              <todayData.icon className="w-48 h-48 -mr-12 -mt-12 rotate-12" />
            </div>

            <div className="relative space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">
                    <Calendar className="w-3 h-3" />
                    {getDayName()}
                  </div>
                  <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">Terço de Hoje</h2>
                </div>
                <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-2xl ${todayData.color} border border-current/10`}>
                  <todayData.icon className="w-5 h-5" />
                  <span className="text-sm font-serif font-bold tracking-tight">{todayData.title}</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <p className="text-sm font-serif text-muted-foreground italic leading-relaxed">
                        "Rezai o Terço todos os dias para alcançar a paz para o mundo."
                      </p>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Activity className="w-3 h-3" /> Suas Intenções
                      </label>
                      <textarea
                        value={intention}
                        onChange={e => setIntention(e.target.value)}
                        placeholder="Escreva por quem ou pelo que você oferece este terço..."
                        className="w-full px-5 py-4 rounded-2xl bg-muted/50 border border-border text-sm font-serif text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none h-24"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setPrayingMystery(todayKey)}
                    className="w-full inline-flex items-center justify-center gap-3 px-8 py-5 bg-foreground text-background rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-primary hover:text-primary-foreground transition-all active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-current" /> Começar Rosário
                  </button>
                </div>

                <div className="space-y-4">
                  <PrayerAudioPlayer
                    prayers={[
                      { label: 'Pai Nosso', text: PRAYERS.paiNosso },
                      ...Array.from({ length: 10 }, (_, i) => ({ label: `Ave Maria ${i + 1}`, text: PRAYERS.aveMaria })),
                      { label: 'Glória ao Pai', text: PRAYERS.gloria },
                      { label: 'Salve Rainha', text: PRAYERS.salveRainha },
                    ]}
                  />
                  <YouTubePlayer videoId={YOUTUBE_IDS[todayKey]} title={todayData.title} />
                </div>
              </div>
            </div>
          </div>

          {/* All Mysteries Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-2xl font-serif font-bold">Mistérios do Rosário</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Escolha um mistério</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(Object.entries(MYSTERY_DATA) as [MysteryKey, typeof MYSTERY_DATA[MysteryKey]][]).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setPrayingMystery(key)}
                  className={`group relative flex items-center gap-5 p-6 rounded-3xl border transition-all hover:shadow-xl hover:-translate-y-1 ${
                    key === todayKey ? 'bg-primary/5 border-primary/30 shadow-lg' : 'bg-card border-border hover:border-primary/30'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${val.color}`}>
                    <val.icon className="w-7 h-7" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-serif font-bold text-foreground group-hover:text-primary transition-colors">{val.title}</p>
                      {key === todayKey && (
                        <span className="text-[8px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">Hoje</span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-black opacity-60">{val.days}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary/50 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar — Essential Prayers */}
        <div className="space-y-8">
          <div className="bg-card border border-border rounded-[2rem] p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-serif font-bold">Orações Comuns</h3>
            </div>
            <div className="space-y-3">
              {[
                { key: 'paiNosso', title: 'Pai Nosso', icon: Sun },
                { key: 'aveMaria', title: 'Ave Maria', icon: Star },
                { key: 'gloria', title: 'Glória ao Pai', icon: Sparkles },
                { key: 'salveRainha', title: 'Salve Rainha', icon: Heart },
              ].map(p => (
                <div key={p.key} className="p-5 rounded-2xl bg-muted/30 border border-border/50 space-y-3 hover:bg-muted/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <p className="font-serif font-bold text-sm flex-1">{p.title}</p>
                    <ShareButton
                      title={p.title}
                      text={`${p.title}\n\n${PRAYERS[p.key as keyof typeof PRAYERS]}`}
                      size="sm"
                      className="border-0 p-0 hover:bg-transparent"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground font-serif leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all cursor-default">
                    {PRAYERS[p.key as keyof typeof PRAYERS]}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-primary text-primary-foreground rounded-[2rem] p-8 space-y-4 shadow-xl shadow-primary/20">
            <Cross className="w-8 h-8 opacity-50" />
            <h4 className="text-xl font-serif font-bold">Via-Sacra</h4>
            <p className="text-sm opacity-80 leading-relaxed font-serif">
              Medite sobre a Paixão de Cristo em 14 estações de profunda oração.
            </p>
            <button onClick={() => navigate('/via-crucis')} className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold text-xs uppercase tracking-widest transition-all">
              Explorar Via-Sacra
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrayerPage;