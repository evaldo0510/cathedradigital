import { Button } from '@/components/ui/button';
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ShareButton from './ShareButton';
import { createPortal } from 'react-dom';
import { Icons } from '../../constants';
import DeepContentSection from './DeepContentSection';
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
  <div className="w-full aspect-video rounded-premium overflow-hidden border border-border bg-black shadow-premium">
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
    color: 'text-primary bg-primary/10',
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
    color: 'text-secondary bg-secondary/10',
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
    color: 'text-secondary bg-secondary/10',
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
    color: 'text-secondary bg-secondary/10',
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

const PRAYER_DETAILS = {
  paiNosso: {
    textoBase: PRAYERS.paiNosso,
    explicacao: 'A oração que o próprio Jesus nos ensinou. É o modelo perfeito de oração, onde primeiro louvamos ao Pai e depois pedimos o que necessitamos para o corpo e para a alma.',
    interpretacaoProfunda: 'Dizemos "Pai Nosso", não "meu Pai", porque somos uma família em Cristo. Ao dizer "Seja feita a vossa vontade", entregamos nossa liberdade a Deus, confiando que Seu plano é melhor que o nosso.',
    aplicacaoPratica: 'Ao rezar hoje, tente pausar em "seja feita a vossa vontade" e pense em uma situação difícil que você está vivendo, entregando-a totalmente a Ele.',
    reflexaoFinal: 'Eu realmente quero que a vontade de Deus seja feita, ou estou apenas tentando convencer Deus a fazer a minha?',
    exercicio: 'Reze o Pai Nosso uma única vez, mas demore pelo menos 1 minuto, saboreando cada palavra.'
  },
  aveMaria: {
    textoBase: PRAYERS.aveMaria,
    explicacao: 'A saudação angélica unida à oração da Igreja. Reconhecemos a cheia de graça e pedimos sua intercessão agora e no momento final de nossa vida.',
    interpretacaoProfunda: 'A primeira parte da oração é bíblica (Lucas 1). A segunda parte é a súplica da Igreja. Maria é o canal pelo qual Jesus veio ao mundo e continua sendo o caminho mais curto para chegar a Ele.',
    aplicacaoPratica: 'Quando estiver em uma situação de pecado ou tentação, diga: "rogai por nós pecadores, agora". Sinta o socorro imediato de Maria.',
    reflexaoFinal: 'Como Maria pode me ajudar a ser mais fiel a Jesus hoje?',
    exercicio: 'Reze uma Ave Maria em latim (Ave Maria, gratia plena...) para conectar-se com a tradição milenar da Igreja.'
  }
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
      style={{ background: 'linear-gradient(180deg, #0B1F3A 0%, #050D19 50%, #0B1F3A 100%)' }}>
      {/* Header — minimal */}
      <div className="flex items-center justify-between p-spacing-md sticky top-0 z-10 bg-inherit/80 ">
        <Button onClick={onClose} className="p-spacing-xs rounded-full bg-card/50 border border-white/10 hover:bg-white/10 transition-all">
          <ArrowLeft className="w-spacing-md h-spacing-md text-secondary/70" />
        </Button>
        <span className="text-xs font-black uppercase tracking-widest text-secondary/40">{data.title}</span>
        <div className="w-spacing-xl" />
      </div>

      {/* Progress */}
      {(phase === 'mystery' || phase === 'decade') && (
        <div className="flex gap-spacing-2xs px-spacing-lg pt-spacing-xs max-w-spacing-xl mx-auto w-full">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className={`flex-1 h-spacing-2xs rounded-full transition-all duration-500 ${i <= currentMystery ? 'bg-secondary shadow-[0_0_8px_rgba(200,169,106,0.5)]' : 'bg-white/10'}`} />
          ))}
        </div>
      )}

      {/* Intention */}
      {intention && phase === 'intro' && (
        <div className="mx-spacing-lg mt-spacing-md p-spacing-md bg-secondary/5 border border-secondary/10 rounded-premium text-center max-w-spacing-xl md:mx-auto">
          <p className="text-xs font-black uppercase tracking-widest text-secondary/50 mb-spacing-2xs">Intenção</p>
          <p className="text-base font-serif text-secondary/70 italic leading-relaxed">"{intention}"</p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-start justify-center p-spacing-lg">
        <div className="w-full max-w-spacing-xl bg-white/[0.03] border border-white/[0.06] rounded-[2.5rem] p-spacing-xl md:p-spacing-2xl space-y-spacing-xl  shadow-premium-hover shadow-black/50">
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
            <div className="space-y-spacing-lg">
              <div className="text-center space-y-spacing-xs">
                <h3 className="text-2xl font-serif font-bold text-secondary">Orações Iniciais</h3>
                <p className="text-xs text-secondary/40 font-serif italic">Sinal da Cruz + Credo + 3 Ave-Marias + Glória</p>
              </div>
              <div className="space-y-spacing-sm">
                {[
                  { key: 'paiNosso', label: 'Pai Nosso' },
                  { key: 'aveMaria', label: 'Ave Maria' },
                  { key: 'gloria', label: 'Glória ao Pai' },
                ].map(p => (
                  <div key={p.key} className="group bg-white/[0.04] rounded-premium p-spacing-md cursor-pointer border border-white/[0.06] hover:bg-white/[0.07] transition-all" onClick={() => setExpandedPrayer(expandedPrayer === p.key ? null : p.key)}>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-secondary/90">{p.label}</p>
                      <ChevronRight className={`w-spacing-md h-spacing-md text-secondary/30 transition-transform ${expandedPrayer === p.key ? 'rotate-90' : ''}`} />
                    </div>
                    {expandedPrayer === p.key && (
                      <p className="text-lg md:text-xl text-secondary/60 mt-spacing-sm font-serif leading-relaxed animate-in fade-in slide-in-from-top-spacing-xs duration-300">{PRAYERS[p.key as keyof typeof PRAYERS]}</p>
                    )}
                  </div>
                ))}

                {expandedPrayer && (PRAYER_DETAILS as any)[expandedPrayer] && (
                  <div className="mt-spacing-xl pt-spacing-xl border-t border-white/10">
                    <DeepContentSection content={(PRAYER_DETAILS as any)[expandedPrayer]} title="Profundidade da Oração" />
                  </div>
                )}
              </div>
              <Button onClick={() => setPhase('mystery')} className="w-full py-spacing-md bg-secondary/20 text-secondary border border-secondary/20 rounded-full font-black uppercase text-xs tracking-widest hover:bg-secondary/30 transition-all shadow-premium shadow-primary/20">
                Iniciar 1º Mistério
              </Button>
            </div>
          )}

          {phase === 'mystery' && (
            <div className="space-y-spacing-xl animate-in fade-in zoom-in-95 duration-500">
              <div className="text-center space-y-spacing-sm">
                <span className="text-xs font-black uppercase tracking-widest text-secondary/50">{currentMystery + 1}º Mistério</span>
                <h3 className="text-3xl font-serif font-bold text-secondary leading-tight">{mystery.title}</h3>
                <p className="text-sm text-secondary/60 font-bold tracking-wide">{mystery.scripture}</p>
              </div>
              <div className="bg-white/[0.04] rounded-[2rem] p-spacing-xl border border-white/[0.06] relative">
                <Icons.Feather className="absolute -top-spacing-sm -right-spacing-sm w-spacing-xl h-spacing-xl text-secondary/10 rotate-12" />
                <p className="text-xl text-secondary/70 font-serif leading-relaxed text-center italic">"{mystery.meditation}"</p>
              </div>
              <Button onClick={() => setPhase('decade')} className="w-full py-spacing-md bg-secondary/20 text-secondary border border-secondary/20 rounded-full font-black uppercase text-xs tracking-widest hover:bg-secondary/30 transition-all shadow-premium shadow-primary/20">
                Rezar a Dezena
              </Button>
            </div>
          )}

          {phase === 'decade' && (
            <div className="space-y-spacing-xl animate-in fade-in duration-500">
              <div className="text-center">
                <p className="text-xs font-black uppercase tracking-widest text-secondary/30 mb-spacing-md">{currentMystery + 1}º Mistério — Dezena</p>
                
                {/* Bead Counter */}
                <div className="flex flex-col items-center gap-spacing-md py-spacing-md">
                  <div className="grid grid-cols-5 gap-spacing-md md:flex md:items-center md:gap-spacing-sm">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <Button
                        key={i}
                        onClick={() => setAveCount(i + 1)}
                        className={`w-spacing-lg h-spacing-lg rounded-full border-2 transition-all duration-300 ${
                          i < aveCount
                            ? 'bg-secondary border-secondary shadow-[0_0_12px_rgba(200,169,106,0.6)] scale-110'
                            : 'bg-transparent border-secondary/25 hover:border-secondary/50'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-secondary/40 text-xs font-black uppercase tracking-[0.2em]">{aveCount}/10 Ave-Marias</p>
                </div>
              </div>

              <div className="space-y-spacing-sm">
                {[
                  { key: 'paiNosso', label: 'Pai Nosso' },
                  { key: 'aveMaria', label: 'Ave Maria (×10)' },
                  { key: 'gloria', label: 'Glória ao Pai' },
                ].map(p => (
                  <div key={p.key} className="group bg-white/[0.04] rounded-premium p-spacing-md cursor-pointer border border-white/[0.06] hover:bg-white/[0.07] transition-all" onClick={() => setExpandedPrayer(expandedPrayer === p.key ? null : p.key)}>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-secondary/90">{p.label}</p>
                      <ChevronRight className={`w-spacing-md h-spacing-md text-secondary/30 transition-transform ${expandedPrayer === p.key ? 'rotate-90' : ''}`} />
                    </div>
                    {expandedPrayer === p.key && (
                      <p className="text-lg md:text-xl text-secondary/60 mt-spacing-sm font-serif leading-relaxed animate-in fade-in slide-in-from-top-spacing-xs duration-300">{PRAYERS[p.key as keyof typeof PRAYERS]}</p>
                    )}
                  </div>
                ))}
              </div>

              <Button onClick={() => {
                setExpandedPrayer(null);
                setAveCount(0);
                if (currentMystery < 4) {
                  setCurrentMystery(currentMystery + 1);
                  setPhase('mystery');
                } else {
                  setPhase('closing');
                }
              }} className="w-full py-spacing-md bg-secondary/20 text-secondary border border-secondary/20 rounded-full font-black uppercase text-xs tracking-widest hover:bg-secondary/30 transition-all shadow-premium shadow-primary/20">
                {currentMystery < 4 ? 'Próximo Mistério' : 'Concluir Rosário'}
              </Button>
            </div>
          )}

          {phase === 'closing' && (
            <div className="space-y-spacing-xl animate-in fade-in zoom-in-95 duration-700">
              <h3 className="text-2xl font-serif font-bold text-secondary text-center">Oração Final</h3>
              <div className="bg-white/[0.04] rounded-premium p-spacing-lg cursor-pointer border border-white/[0.06] hover:bg-white/[0.07] transition-all" onClick={() => setExpandedPrayer(expandedPrayer === 'salve' ? null : 'salve')}>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm text-secondary/90">Salve Rainha</p>
                  <ChevronRight className={`w-spacing-md h-spacing-md text-secondary/30 transition-transform ${expandedPrayer === 'salve' ? 'rotate-90' : ''}`} />
                </div>
                {expandedPrayer === 'salve' && (
                  <p className="text-lg text-secondary/60 mt-spacing-md font-serif leading-relaxed italic animate-in fade-in slide-in-from-top-spacing-xs duration-300">{PRAYERS.salveRainha}</p>
                )}
              </div>
              <div className="text-center space-y-spacing-md py-spacing-xl">
                <div className="relative inline-block font-serif">
                  <Heart className="w-spacing-3xl h-spacing-3xl text-secondary/20 mx-auto" />
                  <Sparkles className="absolute -top-spacing-2xs -right-spacing-2xs w-spacing-lg h-spacing-lg text-secondary/40 animate-pulse" />
                </div>
                <div className="space-y-spacing-xs">
                  <p className="text-secondary font-serif font-bold text-2xl">Rosário Completo!</p>
                  <p className="text-base text-secondary/40 font-serif italic max-w-[280px] mx-auto leading-relaxed">Que Nossa Senhora interceda por vós e por todas as vossas intenções.</p>
                </div>
              </div>
              <Button onClick={onClose} className="w-full py-spacing-md bg-secondary text-primary rounded-full font-black uppercase text-xs tracking-[0.2em] hover:bg-secondary transition-all shadow-premium-hover shadow-secondary/20">
                <Icons.Cross className="w-spacing-md h-spacing-md inline mr-spacing-xs" /> Amém — Finalizar
              </Button>
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
    <motion.div 
      className="max-w-5xl mx-auto space-y-spacing-2xl pb-spacing-2xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <motion.div 
        className="text-center space-y-spacing-md pt-spacing-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="inline-flex items-center gap-spacing-xs px-spacing-md py-spacing-2xs bg-primary/5 border border-primary/10 rounded-premium">
          <Heart className="w-spacing-md h-spacing-md text-primary" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Oratio et Devotio</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground tracking-tight">Oração e Devoção</h1>
        <p className="text-lg text-muted-foreground font-serif italic max-w-spacing-2xl mx-auto">"A oração é a respiração da alma. Sem ela, a vida interior desfalece."</p>
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-spacing-xl"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
      >
        {/* Main Content — Today's Rosary */}
        <div className="lg:col-span-2 space-y-spacing-xl">
          <div className="group relative overflow-hidden bg-card border border-border rounded-[2.5rem] p-spacing-xl md:p-spacing-2xl shadow-premium-hover shadow-black/[0.02]">
            <div className="absolute top-0 right-0 p-spacing-xl opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
              <todayData.icon className="w-spacing-4xl h-spacing-4xl -mr-spacing-2xl -mt-spacing-2xl rotate-12" />
            </div>

            <div className="relative space-y-spacing-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-spacing-md">
                <div className="space-y-spacing-2xs">
                  <div className="flex items-center gap-spacing-xs text-xs font-black uppercase tracking-[0.2em] text-primary/60">
                    <Calendar className="w-spacing-sm h-spacing-sm" />
                    {getDayName()}
                  </div>
                  <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">Terço de Hoje</h2>
                </div>
                <div className={`inline-flex items-center gap-spacing-sm px-spacing-md py-spacing-xs rounded-full ${todayData.color} border border-current/10`}>
                  <todayData.icon className="w-spacing-md h-spacing-md" />
                  <span className="text-sm font-serif font-bold tracking-tight">{todayData.title}</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-spacing-xl items-center">
                <div className="space-y-spacing-lg">
                  <div className="space-y-spacing-md">
                    <div className="flex items-center gap-spacing-sm">
                      <div className="w-spacing-xl h-spacing-xl rounded-premium bg-primary/10 flex items-center justify-center text-primary">
                        <MessageSquare className="w-spacing-md h-spacing-md" />
                      </div>
                      <p className="text-sm font-serif text-muted-foreground italic leading-relaxed">
                        "Rezai o Terço todos os dias para alcançar a paz para o mundo."
                      </p>
                    </div>
                    <div className="space-y-spacing-sm">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-spacing-xs">
                        <Activity className="w-spacing-sm h-spacing-sm" /> Suas Intenções
                      </label>
                      <textarea
                        value={intention}
                        onChange={e => setIntention(e.target.value)}
                        placeholder="Escreva por quem ou pelo que você oferece este terço..."
                        className="w-full px-spacing-md py-spacing-md rounded-full bg-muted/50 border border-border text-sm font-serif text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none h-spacing-4xl"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => setPrayingMystery(todayKey)}
                    className="w-full inline-flex items-center justify-center gap-spacing-sm px-spacing-xl py-spacing-md bg-foreground text-background rounded-full font-black uppercase text-xs tracking-[0.2em] shadow-premium-hover hover:bg-primary hover:text-primary-foreground transition-all active:scale-95"
                  >
                    <Play className="w-spacing-md h-spacing-md fill-current" /> Começar Rosário
                  </Button>
                </div>

                <div className="space-y-spacing-md">
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
          <div className="space-y-spacing-lg">
            <div className="flex items-center justify-between px-spacing-xs">
              <h3 className="text-2xl font-serif font-bold">Mistérios do Rosário</h3>
              <Button 
                onClick={() => navigate('/rosary')}
                className="text-xs font-black uppercase tracking-widest text-primary hover:underline transition-all"
              >
                Ver Rosário Completo <ChevronRight className="w-spacing-sm h-spacing-sm inline ml-spacing-2xs" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-spacing-md">
              {(Object.entries(MYSTERY_DATA) as [MysteryKey, typeof MYSTERY_DATA[MysteryKey]][]).map(([key, val]) => (
                <Button
                  key={key}
                  onClick={() => setPrayingMystery(key)}
                  className={`group relative flex items-center gap-spacing-md p-spacing-lg rounded-full border transition-all hover:shadow-premium-hover hover:-translate-y-1 ${
                    key === todayKey ? 'bg-primary/5 border-primary/30 shadow-premium' : 'bg-card border-border hover:border-primary/30'
                  }`}
                >
                  <div className={`w-spacing-2xl h-spacing-2xl rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${val.color}`}>
                    <val.icon className="w-spacing-lg h-spacing-lg" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-spacing-xs">
                      <p className="font-serif font-bold text-foreground group-hover:text-primary transition-colors">{val.title}</p>
                      {key === todayKey && (
                        <span className="text-xs font-black uppercase tracking-widest text-primary bg-primary/10 px-spacing-xs py-spacing-3xs rounded-full">Hoje</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-spacing-2xs uppercase tracking-widest font-black opacity-60">{val.days}</p>
                  </div>
                  <ChevronRight className="w-spacing-md h-spacing-md text-muted-foreground/60 group-hover:text-primary/50 group-hover:translate-x-1 transition-all" />
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar — Essential Prayers */}
        <motion.div 
          className="space-y-spacing-xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="bg-card border border-border rounded-[2rem] p-spacing-xl shadow-md space-y-spacing-lg">
            <div className="flex items-center gap-spacing-sm">
              <div className="w-spacing-xl h-spacing-xl rounded-premium bg-primary/10 flex items-center justify-center text-primary">
                <BookOpen className="w-spacing-md h-spacing-md" />
              </div>
              <h3 className="text-xl font-serif font-bold">Orações Comuns</h3>
            </div>
            <div className="space-y-spacing-sm">
              {[
                { key: 'paiNosso', title: 'Pai Nosso', icon: Sun },
                { key: 'aveMaria', title: 'Ave Maria', icon: Star },
                { key: 'gloria', title: 'Glória ao Pai', icon: Sparkles },
                { key: 'salveRainha', title: 'Salve Rainha', icon: Heart },
              ].map(p => (
                <div key={p.key} className="p-spacing-md rounded-premium bg-muted/30 border border-border/50 space-y-spacing-sm hover:bg-muted/50 transition-colors group">
                  <div className="flex items-center gap-spacing-sm">
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
          
          <div className="bg-primary text-primary-foreground rounded-[2rem] p-spacing-xl space-y-spacing-md shadow-premium-hover shadow-primary/20">
            <Cross className="w-spacing-xl h-spacing-xl opacity-50" />
            <h4 className="text-xl font-serif font-bold">Via-Sacra</h4>
            <p className="text-sm opacity-80 leading-relaxed font-serif">
              Medite sobre a Paixão de Cristo em 14 estações de profunda oração.
            </p>
            <Button onClick={() => navigate('/via-crucis')} className="w-full py-spacing-sm bg-white/10 hover:bg-white/20 border border-white/20 rounded-full font-bold text-xs uppercase tracking-widest transition-all">
              Explorar Via-Sacra
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default PrayerPage;