import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Icons } from '../../constants';
import { 
  Heart, 
  ArrowLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Video, 
  Flame, 
  Star, 
  Zap, 
  Sparkles,
  Search,
  BookOpen,
  Calendar,
  Activity,
  Music,
  Youtube,
  Clock,
  Cross
} from 'lucide-react';
import ShareButton from './ShareButton';

type MysterySet = 'joyful' | 'sorrowful' | 'glorious' | 'luminous';

const YOUTUBE_IDS: Record<MysterySet, string> = {
  joyful: 'y0nohEWE7PI',
  sorrowful: 'etp-5E9f0lk',
  glorious: 'kcsu2e-0j2I',
  luminous: 'kmHzPZihdvY',
};

const YouTubePlayer: React.FC<{ videoId: string; title: string }> = ({ videoId, title }) => (
  <div className="w-full aspect-video rounded-3xl overflow-hidden border border-border bg-black shadow-2xl">
    <iframe
      src={`https://www.youtube.com/embed/${videoId}?rel=0`}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="w-full h-full"
    />
  </div>
);

const MYSTERIES: Record<MysterySet, { 
  name: string; 
  day: string; 
  icon: React.FC<{ className?: string }>;
  color: string;
  mysteries: { title: string; scripture: string; meditation: string }[] 
}> = {
  joyful: {
    name: 'Mistérios Gozosos',
    day: 'Segunda e Sábado',
    icon: Sparkles,
    color: 'text-primary bg-primary/10',
    mysteries: [
      { title: 'A Anunciação do Anjo a Maria', scripture: 'Lc 1,26-38', meditation: 'O Anjo Gabriel anuncia a Maria que ela será Mãe do Salvador. Maria diz "sim" com fé total: "Eis a serva do Senhor."' },
      { title: 'A Visitação de Maria a Isabel', scripture: 'Lc 1,39-56', meditation: 'Maria vai às pressas visitar Isabel. João Batista exulta no ventre. Maria entoa o Magnificat, cântico de louvor e humildade.' },
      { title: 'O Nascimento de Jesus', scripture: 'Lc 2,1-20', meditation: 'O Verbo se faz carne em Belém. Deus nasce na pobreza de uma manjedoura, revelando que Sua grandeza está na humildade.' },
      { title: 'A Apresentação de Jesus no Templo', scripture: 'Lc 2,22-38', meditation: 'Jesus é oferecido ao Pai. Simeão profetiza: "Luz para iluminar as nações" e uma espada atravessará o coração de Maria.' },
      { title: 'A Perda e o Encontro de Jesus no Templo', scripture: 'Lc 2,41-52', meditation: 'Após três dias de busca angustiante, Jesus é encontrado entre os doutores: "Não sabíeis que devo estar na casa de meu Pai?"' },
    ],
  },
  sorrowful: {
    name: 'Mistérios Dolorosos',
    day: 'Terça e Sexta',
    icon: Flame,
    color: 'text-secondary bg-secondary/10',
    mysteries: [
      { title: 'A Agonia de Jesus no Horto', scripture: 'Lc 22,39-46', meditation: 'Jesus sua sangue no Getsêmani. "Pai, se possível, afasta de mim este cálice; porém, não a minha vontade, mas a Tua."' },
      { title: 'A Flagelação de Jesus', scripture: 'Jo 19,1', meditation: 'Pilatos manda açoitar Jesus. Cada golpe é um pecado nosso que fere o Corpo de Cristo. "Por suas chagas fomos curados."' },
      { title: 'A Coroação de Espinhos', scripture: 'Mt 27,27-31', meditation: 'Os soldados tecem uma coroa de espinhos e a cravam na cabeça de Jesus, zombando: "Salve, Rei dos Judeus!"' },
      { title: 'Jesus Carrega a Cruz', scripture: 'Jo 19,17', meditation: 'Jesus toma sobre Si a Cruz — o peso de todos os pecados. Cada passo é um ato de amor redentor.' },
      { title: 'A Crucificação e Morte de Jesus', scripture: 'Lc 23,33-46', meditation: '"Pai, perdoai-os." "Está consumado." Jesus entrega o espírito. O sacrifício perfeito é consumado na Cruz.' },
    ],
  },
  glorious: {
    name: 'Mistérios Gloriosos',
    day: 'Quarta e Domingo',
    icon: Star,
    color: 'text-secondary bg-secondary/10',
    mysteries: [
      { title: 'A Ressurreição de Jesus', scripture: 'Mc 16,1-7', meditation: '"Ele ressuscitou, não está aqui!" A pedra foi removida. A morte foi vencida. Cristo é a Vida que triunfa para sempre.' },
      { title: 'A Ascensão de Jesus ao Céu', scripture: 'At 1,9-11', meditation: 'Jesus sobe aos céus diante dos apóstolos. "Ide e fazei discípulos de todas as nações." Ele vai preparar um lugar para nós.' },
      { title: 'A Vinda do Espírito Santo', scripture: 'At 2,1-4', meditation: 'Línguas de fogo descem sobre os apóstolos. O Espírito Santo os transforma de homens temerosos em pregadores intrépidos.' },
      { title: 'A Assunção de Maria ao Céu', scripture: 'Ap 12,1', meditation: 'Maria é elevada ao Céu em corpo e alma. A primeira redimida recebe a glória plena, sinal de nossa esperança.' },
      { title: 'A Coroação de Maria como Rainha', scripture: 'Ap 12,1; Sl 45,10', meditation: 'Maria é coroada Rainha do Céu e da Terra. Ela intercede por nós como Mãe e Rainha junto ao trono de Deus.' },
    ],
  },
  luminous: {
    name: 'Mistérios Luminosos',
    day: 'Quinta',
    icon: Zap,
    color: 'text-secondary bg-secondary/10',
    mysteries: [
      { title: 'O Batismo de Jesus no Jordão', scripture: 'Mt 3,13-17', meditation: '"Este é o meu Filho amado." Jesus desce às águas do Jordão, santificando o Batismo e revelando a Trindade.' },
      { title: 'As Bodas de Caná', scripture: 'Jo 2,1-11', meditation: '"Fazei tudo o que Ele vos disser." Maria intercede. Jesus transforma água em vinho — Seu primeiro sinal, revelando Sua glória.' },
      { title: 'O Anúncio do Reino de Deus', scripture: 'Mc 1,14-15', meditation: '"Convertei-vos e crede no Evangelho." Jesus percorre a Galileia anunciando o Reino, curando os doentes, libertando os cativos.' },
      { title: 'A Transfiguração de Jesus', scripture: 'Mt 17,1-8', meditation: 'No Tabor, o rosto de Jesus brilha como o sol. Moisés e Elias aparecem. "Este é o meu Filho amado, ouvi-O!"' },
      { title: 'A Instituição da Eucaristia', scripture: 'Lc 22,19-20', meditation: '"Isto é o meu Corpo... Isto é o meu Sangue." Na Última Ceia, Jesus institui o sacramento do Seu amor perpétuo.' },
    ],
  },
};

const PRAYERS = {
  signOfCross: { title: 'Sinal da Cruz', text: 'Em nome do Pai, e do Filho, e do Espírito Santo. Amém.' },
  creed: { title: 'Credo Apostólico', text: 'Creio em Deus Pai Todo-Poderoso, Criador do céu e da terra; e em Jesus Cristo, seu único Filho, nosso Senhor, que foi concebido pelo poder do Espírito Santo, nasceu da Virgem Maria; padeceu sob Pôncio Pilatos, foi crucificado, morto e sepultado; desceu à mansão dos mortos; ressuscitou ao terceiro dia; subiu aos céus; está sentado à direita de Deus Pai Todo-Poderoso, donde há de vir a julgar os vivos e os mortos. Creio no Espírito Santo, na Santa Igreja Católica, na comunhão dos Santos, na remissão dos pecados, na ressurreição da carne, na vida eterna. Amém.' },
  ourFather: { title: 'Pai Nosso', text: 'Pai nosso que estais nos céus, santificado seja o vosso nome, venha a nós o vosso reino, seja feita a vossa vontade assim na terra como no céu. O pão nosso de cada dia nos dai hoje, perdoai-nos as nossas ofensas assim como nós perdoamos a quem nos tem ofendido, e não nos deixeis cair em tentação, mas livrai-nos do mal. Amém.' },
  hailMary: { title: 'Ave Maria', text: 'Ave Maria, cheia de graça, o Senhor é convosco, bendita sois vós entre as mulheres e bendito é o fruto do vosso ventre, Jesus. Santa Maria, Mãe de Deus, rogai por nós pecadores, agora e na hora da nossa morte. Amém.' },
  glory: { title: 'Glória ao Pai', text: 'Glória ao Pai, e ao Filho, e ao Espírito Santo. Como era no princípio, agora e sempre, e por todos os séculos dos séculos. Amém.' },
  fatima: { title: 'Oração de Fátima', text: 'Ó meu Jesus, perdoai-nos, livrai-nos do fogo do Inferno, levai as almas todas para o Céu, e socorrei principalmente as que mais precisarem.' },
  salveRainha: { title: 'Salve Rainha', text: 'Salve Rainha, Mãe de Misericórdia, vida, doçura, esperança nossa, salve! A vós bradamos, os degredados filhos de Eva. A vós suspiramos, gemendo e chorando neste vale de lágrimas. Eia, pois, advogada nossa, esses vossos olhos misericordiosos a nós volvei. E depois deste desterro, mostrai-nos Jesus, bendito fruto do vosso ventre. Ó clemente, ó piedosa, ó doce sempre Virgem Maria. Rogai por nós, Santa Mãe de Deus, para que sejamos dignos das promessas de Cristo. Amém.' },
};

type PrayerStep = 'intro' | 'mystery' | 'decade' | 'closing';

const Rosary: React.FC = () => {
  const [selectedSet, setSelectedSet] = useState<MysterySet | null>(null);
  const [isPraying, setIsPraying] = useState(false);
  const [currentMystery, setCurrentMystery] = useState(0);
  const [step, setStep] = useState<PrayerStep>('intro');
  const [showPrayer, setShowPrayer] = useState<string | null>(null);
  const [aveCount, setAveCount] = useState(0);

  if (!selectedSet) {
    return (
      <motion.div className="max-w-5xl mx-auto space-y-12 pb-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <motion.div className="text-center space-y-4 pt-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/5 border border-primary/10 rounded-full">
            <Heart className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Rosarium</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground tracking-tight">Santo Rosário</h1>
          <p className="text-lg text-muted-foreground font-serif italic max-w-2xl mx-auto">Reze os 20 mistérios com meditações profundas e guia passo a passo para sua jornada de fé.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(Object.entries(MYSTERIES) as [MysterySet, typeof MYSTERIES[MysterySet]][]).map(([key, val]) => (
            <button key={key} onClick={() => setSelectedSet(key)}
              className="text-left p-8 md:p-10 rounded-[2.5rem] bg-card border border-border hover:border-primary/40 hover:shadow-2xl hover:-translate-y-1 transition-all group relative overflow-hidden">
              <div className={`absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity`}>
                <val.icon className="w-48 h-48 -mr-12 -mt-12 rotate-12" />
              </div>
              <div className="relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${val.color}`}>
                  <val.icon className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em]">{val.day}</span>
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mt-2 group-hover:text-primary transition-colors">{val.name}</h2>
                <div className="mt-6 space-y-2">
                  {val.mysteries.map((m, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-1 h-1 rounded-full bg-primary/20" />
                      <p className="text-xs text-muted-foreground font-serif italic opacity-70">{m.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    );
  }

  const set = MYSTERIES[selectedSet];

  if (!isPraying) {
    return (
      <div className="max-w-4xl mx-auto space-y-10 pb-12">
        <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => setSelectedSet(null)} className="p-3 rounded-2xl bg-card border border-border hover:bg-primary/5 transition-all active:scale-95 shadow-sm">
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">{set.day}</span>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">{set.name}</h1>
            </div>
          </div>
          <button onClick={() => { setIsPraying(true); setCurrentMystery(0); setStep('intro'); }}
            className="px-10 py-5 bg-foreground text-background rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-primary hover:text-primary-foreground transition-all active:scale-95">
            Iniciar Oração
          </button>
        </div>

        <YouTubePlayer videoId={YOUTUBE_IDS[selectedSet]} title={set.name} />

        <div className="grid gap-4">
          <h3 className="text-xl font-serif font-bold px-2">Mistérios e Meditações</h3>
          {set.mysteries.map((m, i) => (
            <div key={i} className="p-6 md:p-8 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black text-lg shrink-0 border border-primary/10">{i + 1}</div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="font-serif font-bold text-xl text-foreground">{m.title}</p>
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest">{m.scripture}</p>
                  </div>
                  <p className="text-base text-muted-foreground leading-relaxed font-serif italic">"{m.meditation}"</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Prayer mode
  const mystery = set.mysteries[currentMystery];

  const renderStep = () => {
    if (step === 'intro') {
      return (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-serif font-bold text-secondary">Orações Iniciais</h3>
            <p className="text-xs text-secondary/40 font-serif italic">Sinal da Cruz + Credo + 3 Ave-Marias + Glória</p>
          </div>
          <div className="space-y-3">
            {['signOfCross', 'creed', 'ourFather'].map(k => (
              <div key={k} className="group bg-white/[0.04] rounded-2xl p-6 cursor-pointer border border-white/[0.06] hover:bg-white/[0.07] transition-all" onClick={() => setShowPrayer(showPrayer === k ? null : k)}>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm text-secondary/90">{PRAYERS[k as keyof typeof PRAYERS].title}</p>
                  <ChevronRight className={`w-4 h-4 text-secondary/30 transition-transform ${showPrayer === k ? 'rotate-90' : ''}`} />
                </div>
                {showPrayer === k && <p className="text-lg md:text-xl text-secondary/60 mt-4 font-serif leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">{PRAYERS[k as keyof typeof PRAYERS].text}</p>}
              </div>
            ))}
          </div>
          <p className="text-xs text-secondary/40 text-center font-serif italic max-w-xs mx-auto leading-relaxed">Reze 3 Ave-Marias pelas virtudes da Fé, Esperança e Caridade, seguidas do Glória.</p>
          <button onClick={() => setStep('mystery')} className="w-full py-4 bg-secondary/20 text-secondary border border-secondary/20 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-secondary/30 transition-all shadow-lg shadow-amber-900/20">
            Iniciar 1º Mistério
          </button>
        </div>
      );
    }

    if (step === 'mystery') {
      return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-secondary/50">{currentMystery + 1}º Mistério</span>
            <h3 className="text-3xl font-serif font-bold text-secondary leading-tight">{mystery.title}</h3>
            <p className="text-sm text-secondary/60 font-bold tracking-wide">{mystery.scripture}</p>
          </div>
          <div className="bg-white/[0.04] rounded-[2.5rem] p-10 border border-white/[0.06] relative shadow-2xl">
            <Icons.Feather className="absolute -top-3 -right-3 w-8 h-8 text-secondary/10 rotate-12" />
            <p className="text-xl text-secondary/70 font-serif leading-relaxed text-center italic">"{mystery.meditation}"</p>
          </div>
          <div className="flex justify-center">
            <ShareButton
              title={`Rosário — ${currentMystery + 1}º Mistério`}
              text={`${mystery.title}\n\n"${mystery.meditation}"\n\n${mystery.scripture}`}
              className="border-secondary/20 text-secondary/60 hover:text-secondary hover:border-secondary/40"
              variant="button"
            />
          </div>
          <button onClick={() => setStep('decade')} className="w-full py-4 bg-secondary/20 text-secondary border border-secondary/20 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-secondary/30 transition-all shadow-lg shadow-amber-900/20">
            Rezar a Dezena
          </button>
        </div>
      );
    }

    if (step === 'decade') {
      return (
        <div className="space-y-10 animate-in fade-in duration-500">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-secondary/30 mb-6">{currentMystery + 1}º Mistério — Dezena</p>
            
            {/* Bead Counter */}
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="grid grid-cols-5 gap-4 md:flex md:items-center md:gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setAveCount(i + 1)}
                    className={`w-7 h-7 rounded-full border-2 transition-all duration-300 ${
                      i < aveCount
                        ? 'bg-secondary border-secondary shadow-[0_0_15px_rgba(251,191,36,0.6)] scale-110'
                        : 'bg-transparent border-secondary/25 hover:border-secondary/50'
                    }`}
                  />
                ))}
              </div>
              <p className="text-secondary/40 text-[10px] font-black uppercase tracking-[0.2em]">{aveCount}/10 Ave-Marias</p>
            </div>
          </div>

          <div className="space-y-3">
            {['ourFather', 'hailMary', 'glory', 'fatima'].map(k => (
              <div key={k} className="group bg-white/[0.04] rounded-2xl p-6 cursor-pointer border border-white/[0.06] hover:bg-white/[0.07] transition-all" onClick={() => setShowPrayer(showPrayer === k ? null : k)}>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm text-secondary/90">
                    {PRAYERS[k as keyof typeof PRAYERS].title}
                    {k === 'hailMary' && <span className="text-secondary/40 font-normal ml-2 tracking-widest opacity-50"> (×10)</span>}
                  </p>
                  <ChevronRight className={`w-4 h-4 text-secondary/30 transition-transform ${showPrayer === k ? 'rotate-90' : ''}`} />
                </div>
                {showPrayer === k && <p className="text-lg md:text-xl text-secondary/60 mt-4 font-serif leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">{PRAYERS[k as keyof typeof PRAYERS].text}</p>}
              </div>
            ))}
          </div>
          <button onClick={() => {
            setAveCount(0);
            if (currentMystery < 4) {
              setCurrentMystery(currentMystery + 1);
              setStep('mystery');
              setShowPrayer(null);
            } else {
              setStep('closing');
            }
          }} className="w-full py-4 bg-secondary/20 text-secondary border border-secondary/20 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-secondary/30 transition-all shadow-lg shadow-amber-900/20">
            {currentMystery < 4 ? `Próximo Mistério` : 'Concluir Rosário'}
          </button>
        </div>
      );
    }

    // closing
    return (
      <div className="space-y-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-serif font-bold text-secondary">Oração Final</h3>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary/50">Salve Rainha</p>
        </div>
        <div className="bg-white/[0.04] rounded-3xl p-8 cursor-pointer border border-white/[0.06] hover:bg-white/[0.07] transition-all" onClick={() => setShowPrayer(showPrayer === 'salve' ? null : 'salve')}>
          <div className="flex items-center justify-between mb-2">
            <p className="font-bold text-sm text-secondary/90">{PRAYERS.salveRainha.title}</p>
            <ChevronRight className={`w-4 h-4 text-secondary/30 transition-transform ${showPrayer === 'salve' ? 'rotate-90' : ''}`} />
          </div>
          {showPrayer === 'salve' && <p className="text-lg text-secondary/60 mt-4 font-serif leading-relaxed italic animate-in fade-in slide-in-from-top-2 duration-300">{PRAYERS.salveRainha.text}</p>}
        </div>
        <div className="text-center space-y-4 py-8">
          <div className="relative inline-block font-serif">
            <Heart className="w-20 h-20 text-secondary/20 mx-auto" />
            <Sparkles className="absolute -top-1 -right-1 w-8 h-8 text-secondary/40 animate-pulse" />
          </div>
          <div className="space-y-3">
            <p className="text-secondary font-serif font-bold text-3xl tracking-tight">Rosário Completo!</p>
            <p className="text-base text-secondary/40 font-serif italic max-w-xs mx-auto leading-relaxed">Que Nossa Senhora interceda por vós e vossas intenções. Amém.</p>
          </div>
        </div>
        <button onClick={() => { setIsPraying(false); setSelectedSet(null); }}
          className="w-full py-4 bg-secondary text-amber-950 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-secondary transition-all shadow-xl shadow-secondary/20">
          <Icons.Cross className="w-4 h-4 inline mr-2" /> Amém — Finalizar
        </button>
      </div>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col overflow-y-auto"
      style={{ background: 'linear-gradient(180deg, #0B1F3A 0%, #050D19 50%, #0B1F3A 100%)' }}>
      <div className="flex items-center justify-between p-6 sticky top-0 z-10 bg-inherit/80 backdrop-blur-md">
        <button onClick={() => { setIsPraying(false); }} className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
          <ArrowLeft className="w-5 h-5 text-secondary/70" />
        </button>
        <span className="text-[10px] font-black uppercase tracking-widest text-secondary/40">{set.name}</span>
        <div className="w-11" />
      </div>

      <div className="flex-1 flex items-start justify-center p-6 md:p-12">
        <div className="w-full max-w-xl">
          {step !== 'intro' && step !== 'closing' && (
            <div className="flex gap-1.5 mb-8">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${i <= currentMystery ? 'bg-secondary shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'bg-white/10'}`} />
              ))}
            </div>
          )}
          
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-[3rem] p-8 md:p-12 backdrop-blur-sm shadow-2xl shadow-black/50">
            {renderStep()}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Rosary;