import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Icons } from '../../constants';
import { Button } from '@/components/ui/button';
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
  <div className="w-full aspect-video rounded-premium overflow-hidden border border-border bg-black shadow-premium-hover">
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
  const [intention, setIntention] = useState('');

  if (!selectedSet) {
    return (
      <motion.div className="max-w-5xl mx-auto space-y-spacing-2xl pb-spacing-2xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <motion.div className="text-center space-y-spacing-md pt-spacing-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <div className="inline-flex items-center gap-spacing-xs px-spacing-md py-spacing-2xs bg-primary/5 border border-primary/10 rounded-premium">
            <Heart className="w-spacing-md h-spacing-md text-primary" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Rosarium</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground tracking-tight">Santo Rosário</h1>
          <p className="text-lg text-muted-foreground font-serif italic max-w-spacing-2xl mx-auto">Reze os 20 mistérios com meditações profundas e guia passo a passo para sua jornada de fé.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-lg">
          {(Object.entries(MYSTERIES) as [MysterySet, typeof MYSTERIES[MysterySet]][]).map(([key, val]) => (
            <Button key={key} onClick={() => setSelectedSet(key)}
              className="text-left p-spacing-xl md:p-spacing-xl rounded-[2.5rem] bg-card border border-border hover:border-primary/40 hover:shadow-premium-hover hover:-translate-y-1 transition-all group relative overflow-hidden">
              <div className={`absolute top-0 right-0 p-spacing-xl opacity-[0.03] group-hover:opacity-[0.06] transition-opacity`}>
                <val.icon className="w-spacing-4xl h-spacing-4xl -mr-spacing-2xl -mt-spacing-2xl rotate-12" />
              </div>
              <div className="relative z-10">
                <div className={`w-spacing-2xl h-spacing-2xl rounded-full flex items-center justify-center mb-spacing-lg transition-transform group-hover:scale-110 ${val.color}`}>
                  <val.icon className="w-spacing-lg h-spacing-lg" />
                </div>
                <span className="text-xs font-black text-primary/60 uppercase tracking-[0.2em]">{val.day}</span>
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mt-spacing-xs group-hover:text-primary transition-colors">{val.name}</h2>
                <div className="mt-spacing-lg space-y-spacing-xs">
                  {val.mysteries.map((m, i) => (
                    <div key={i} className="flex items-center gap-spacing-sm">
                      <div className="w-spacing-2xs h-spacing-2xs rounded-premium bg-primary/20" />
                      <p className="text-xs text-muted-foreground font-serif italic opacity-70">{m.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Button>
          ))}
        </div>

        <motion.div 
          className="bg-card border border-border rounded-[2.5rem] p-spacing-xl md:p-spacing-2xl text-center space-y-spacing-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="w-spacing-3xl h-spacing-3xl rounded-premium bg-primary/10 flex items-center justify-center text-primary mx-auto mb-spacing-md">
            <BookOpen className="w-spacing-xl h-spacing-xl" />
          </div>
          <div className="space-y-spacing-xs">
            <h2 className="text-2xl font-serif font-bold text-foreground">Outras Orações e Devoções</h2>
            <p className="text-muted-foreground font-serif italic max-w-spacing-xl mx-auto">
              Encontre o Pai Nosso, Ave Maria, Salve Rainha, Via-Sacra e outras orações tradicionais da Igreja.
            </p>
          </div>
          <Button 
            onClick={() => window.location.href = '/oracao'}
            className="inline-flex items-center gap-spacing-xs px-spacing-xl py-spacing-md bg-muted hover:bg-muted/80 text-foreground rounded-full font-bold text-xs uppercase tracking-widest transition-all"
          >
            Explorar Devoções <ChevronRight className="w-spacing-md h-spacing-md" />
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  const set = MYSTERIES[selectedSet];

  if (!isPraying) {
    return (
      <div className="max-w-spacing-4xl mx-auto space-y-spacing-xl pb-spacing-2xl">
        <div className="flex flex-col md:flex-row md:items-center gap-spacing-lg justify-between">
          <div className="flex items-center gap-spacing-lg">
            <Button onClick={() => setSelectedSet(null)} className="p-spacing-sm rounded-full bg-card border border-border hover:bg-primary/5 transition-all active:scale-95 shadow-md">
              <ArrowLeft className="w-spacing-lg h-spacing-lg text-foreground" />
            </Button>
            <div className="space-y-spacing-2xs">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-primary/60">{set.day}</span>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">{set.name}</h1>
            </div>
          </div>
          <Button onClick={() => { setIsPraying(true); setCurrentMystery(0); setStep('intro'); }}
            className="px-spacing-xl py-spacing-md bg-foreground text-background rounded-full font-black uppercase text-xs tracking-[0.2em] shadow-premium-hover hover:bg-primary hover:text-primary-foreground transition-all active:scale-95">
            Iniciar Oração
          </Button>
        </div>

        <YouTubePlayer videoId={YOUTUBE_IDS[selectedSet]} title={set.name} />

        <div className="grid md:grid-cols-3 gap-spacing-xl">
          <div className="md:col-span-2 grid gap-spacing-md">
            <h3 className="text-xl font-serif font-bold px-spacing-xs">Mistérios e Meditações</h3>
            {set.mysteries.map((m, i) => (
              <div key={i} className="p-spacing-lg md:p-spacing-xl rounded-premium bg-card border border-border shadow-md hover:shadow-premium transition-shadow">
                <div className="flex items-start gap-spacing-lg">
                  <div className="w-spacing-2xl h-spacing-2xl rounded-premium bg-primary/5 text-primary flex items-center justify-center font-black text-lg shrink-0 border border-primary/10">{i + 1}</div>
                  <div className="space-y-spacing-sm">
                    <div className="space-y-spacing-2xs">
                      <p className="font-serif font-bold text-xl text-foreground">{m.title}</p>
                      <p className="text-xs text-primary font-bold uppercase tracking-widest">{m.scripture}</p>
                    </div>
                    <p className="text-base text-muted-foreground leading-relaxed font-serif italic">"{m.meditation}"</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="space-y-spacing-lg">
            <div className="p-spacing-xl rounded-[2rem] bg-card border border-border shadow-md space-y-spacing-md">
              <div className="flex items-center gap-spacing-sm">
                <div className="w-spacing-xl h-spacing-xl rounded-premium bg-primary/10 flex items-center justify-center text-primary">
                  <Activity className="w-spacing-md h-spacing-md" />
                </div>
                <h3 className="text-lg font-serif font-bold">Suas Intenções</h3>
              </div>
              <p className="text-xs text-muted-foreground font-serif italic leading-relaxed">
                Escreva por quem ou pelo que você oferece este terço. Sua intenção guiará sua meditação.
              </p>
              <textarea
                value={intention}
                onChange={e => setIntention(e.target.value)}
                placeholder="Ex: Pela minha família, pela paz no mundo..."
                className="w-full px-spacing-md py-spacing-md rounded-full bg-muted/50 border border-border text-sm font-serif text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none h-spacing-4xl"
              />
            </div>
            
            <div className="p-spacing-xl rounded-[2rem] bg-primary text-primary-foreground shadow-premium-hover shadow-primary/20 space-y-spacing-md">
              <p className="text-sm font-serif italic opacity-90 leading-relaxed">
                "O Rosário é a minha oração predileta. Oração maravilhosa! Maravilhosa na sua simplicidade e na sua profundidade."
              </p>
              <p className="text-xs font-black uppercase tracking-widest opacity-60">— São João Paulo II</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Prayer mode
  const mystery = set.mysteries[currentMystery];

  const renderStep = () => {
    if (step === 'intro') {
      return (
        <div className="space-y-spacing-xl animate-in fade-in duration-500">
          <div className="text-center space-y-spacing-xs">
            <h3 className="text-2xl font-serif font-bold text-secondary">Orações Iniciais</h3>
            <p className="text-xs text-secondary/40 font-serif italic">Sinal da Cruz + Credo + 3 Ave-Marias + Glória</p>
          </div>
          
          {intention && (
            <div className="mx-auto p-spacing-md bg-secondary/5 border border-secondary/10 rounded-premium text-center max-w-spacing-sm animate-in fade-in slide-in-from-top-spacing-xs duration-700">
              <p className="text-xs font-black uppercase tracking-widest text-secondary/50 mb-spacing-2xs">Intenção</p>
              <p className="text-base font-serif text-secondary/70 italic leading-relaxed">"{intention}"</p>
            </div>
          )}
          <div className="space-y-spacing-sm">
            {['signOfCross', 'creed', 'ourFather'].map(k => (
              <div key={k} className="group bg-white/[0.04] rounded-premium p-spacing-lg cursor-pointer border border-white/[0.06] hover:bg-white/[0.07] transition-all" onClick={() => setShowPrayer(showPrayer === k ? null : k)}>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm text-secondary/90">{PRAYERS[k as keyof typeof PRAYERS].title}</p>
                  <ChevronRight className={`w-spacing-md h-spacing-md text-secondary/30 transition-transform ${showPrayer === k ? 'rotate-90' : ''}`} />
                </div>
                {showPrayer === k && <p className="text-lg md:text-xl text-secondary/60 mt-spacing-md font-serif leading-relaxed animate-in fade-in slide-in-from-top-spacing-xs duration-300">{PRAYERS[k as keyof typeof PRAYERS].text}</p>}
              </div>
            ))}
          </div>
          <p className="text-xs text-secondary/40 text-center font-serif italic max-w-spacing-xs mx-auto leading-relaxed">Reze 3 Ave-Marias pelas virtudes da Fé, Esperança e Caridade, seguidas do Glória.</p>
          <Button onClick={() => setStep('mystery')} className="w-full py-spacing-md bg-secondary/20 text-secondary border border-secondary/20 rounded-full font-black uppercase text-xs tracking-[0.2em] hover:bg-secondary/30 transition-all shadow-premium shadow-primary/20">
            Iniciar 1º Mistério
          </Button>
        </div>
      );
    }

    if (step === 'mystery') {
      return (
        <div className="space-y-spacing-xl animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center space-y-spacing-sm">
            <span className="text-xs font-black uppercase tracking-widest text-secondary/50">{currentMystery + 1}º Mistério</span>
            <h3 className="text-3xl font-serif font-bold text-secondary leading-tight">{mystery.title}</h3>
            <p className="text-sm text-secondary/60 font-bold tracking-wide">{mystery.scripture}</p>
          </div>
          <div className="bg-white/[0.04] rounded-[2.5rem] p-spacing-xl border border-white/[0.06] relative shadow-premium-hover">
            <Icons.Feather className="absolute -top-spacing-sm -right-spacing-sm w-spacing-xl h-spacing-xl text-secondary/10 rotate-12" />
            <p className="text-xl text-secondary/70 font-serif leading-relaxed text-center italic">"{mystery.meditation}"</p>
          </div>
          <div className="flex justify-center">
            <ShareButton
              title={`Rosário — ${currentMystery + 1}º Mistério`}
              text={`${mystery.title}\n\n"${mystery.meditation}"\n\n${mystery.scripture}`}
              className="border-secondary/20 text-secondary/60 hover:text-secondary hover:border-secondary/40"
              variant="outline"
              size="sm"
            />
          </div>
          <Button onClick={() => setStep('decade')} className="w-full py-spacing-md bg-secondary/20 text-secondary border border-secondary/20 rounded-full font-black uppercase text-xs tracking-[0.2em] hover:bg-secondary/30 transition-all shadow-premium shadow-primary/20">
            Rezar a Dezena
          </Button>
        </div>
      );
    }

    if (step === 'decade') {
      return (
        <div className="space-y-spacing-xl animate-in fade-in duration-500">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-widest text-secondary/30 mb-spacing-lg">{currentMystery + 1}º Mistério — Dezena</p>
            
            {/* Bead Counter */}
            <div className="flex flex-col items-center gap-spacing-lg py-spacing-md">
              <div className="grid grid-cols-5 gap-spacing-md md:flex md:items-center md:gap-spacing-md">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Button
                    key={i}
                    onClick={() => setAveCount(i + 1)}
                    className={`w-spacing-lg h-spacing-lg rounded-full border-2 transition-all duration-300 ${
                      i < aveCount
                        ? 'bg-secondary border-secondary shadow-[0_0_15px_rgba(200,169,106,0.6)] scale-110'
                        : 'bg-transparent border-secondary/25 hover:border-secondary/50'
                    }`}
                  />
                ))}
              </div>
              <p className="text-secondary/40 text-xs font-black uppercase tracking-[0.2em]">{aveCount}/10 Ave-Marias</p>
            </div>
          </div>

          <div className="space-y-spacing-sm">
            {['ourFather', 'hailMary', 'glory', 'fatima'].map(k => (
              <div key={k} className="group bg-white/[0.04] rounded-premium p-spacing-lg cursor-pointer border border-white/[0.06] hover:bg-white/[0.07] transition-all" onClick={() => setShowPrayer(showPrayer === k ? null : k)}>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm text-secondary/90">
                    {PRAYERS[k as keyof typeof PRAYERS].title}
                    {k === 'hailMary' && <span className="text-secondary/40 font-normal ml-spacing-xs tracking-widest opacity-50"> (×10)</span>}
                  </p>
                  <ChevronRight className={`w-spacing-md h-spacing-md text-secondary/30 transition-transform ${showPrayer === k ? 'rotate-90' : ''}`} />
                </div>
                {showPrayer === k && <p className="text-lg md:text-xl text-secondary/60 mt-spacing-md font-serif leading-relaxed animate-in fade-in slide-in-from-top-spacing-xs duration-300">{PRAYERS[k as keyof typeof PRAYERS].text}</p>}
              </div>
            ))}
          </div>
          <Button onClick={() => {
            setAveCount(0);
            if (currentMystery < 4) {
              setCurrentMystery(currentMystery + 1);
              setStep('mystery');
              setShowPrayer(null);
            } else {
              setStep('closing');
            }
          }} className="w-full py-spacing-md bg-secondary/20 text-secondary border border-secondary/20 rounded-full font-black uppercase text-xs tracking-[0.2em] hover:bg-secondary/30 transition-all shadow-premium shadow-primary/20">
            {currentMystery < 4 ? `Próximo Mistério` : 'Concluir Rosário'}
          </Button>
        </div>
      );
    }

    // closing
    return (
      <div className="space-y-spacing-xl animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center space-y-spacing-xs">
          <h3 className="text-2xl font-serif font-bold text-secondary">Oração Final</h3>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-secondary/50">Salve Rainha</p>
        </div>
        <div className="bg-white/[0.04] rounded-premium p-spacing-xl cursor-pointer border border-white/[0.06] hover:bg-white/[0.07] transition-all" onClick={() => setShowPrayer(showPrayer === 'salve' ? null : 'salve')}>
          <div className="flex items-center justify-between mb-spacing-xs">
            <p className="font-bold text-sm text-secondary/90">{PRAYERS.salveRainha.title}</p>
            <ChevronRight className={`w-spacing-md h-spacing-md text-secondary/30 transition-transform ${showPrayer === 'salve' ? 'rotate-90' : ''}`} />
          </div>
          {showPrayer === 'salve' && <p className="text-lg text-secondary/60 mt-spacing-md font-serif leading-relaxed italic animate-in fade-in slide-in-from-top-spacing-xs duration-300">{PRAYERS.salveRainha.text}</p>}
        </div>
        <div className="text-center space-y-spacing-md py-spacing-xl">
          <div className="relative inline-block font-serif">
            <Heart className="w-spacing-3xl h-spacing-3xl text-secondary/20 mx-auto" />
            <Sparkles className="absolute -top-spacing-2xs -right-spacing-2xs w-spacing-xl h-spacing-xl text-secondary/40 animate-pulse" />
          </div>
          <div className="space-y-spacing-sm">
            <p className="text-secondary font-serif font-bold text-3xl tracking-tight">Rosário Completo!</p>
            <p className="text-base text-secondary/40 font-serif italic max-w-spacing-xs mx-auto leading-relaxed">Que Nossa Senhora interceda por vós e vossas intenções. Amém.</p>
          </div>
        </div>
        <Button onClick={() => { setIsPraying(false); setSelectedSet(null); }}
          className="w-full py-spacing-md bg-secondary text-primary rounded-full font-black uppercase text-xs tracking-[0.2em] hover:bg-secondary transition-all shadow-premium-hover shadow-secondary/20">
          <Icons.Cross className="w-spacing-md h-spacing-md inline mr-spacing-xs" /> Amém — Finalizar
        </Button>
      </div>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col overflow-y-auto"
      style={{ background: 'linear-gradient(180deg, #0B1F3A 0%, #050D19 50%, #0B1F3A 100%)' }}>
      <div className="flex items-center justify-between p-spacing-lg sticky top-0 z-10 bg-inherit/80 ">
        <Button onClick={() => { setIsPraying(false); }} className="p-spacing-sm rounded-full bg-card/50 border border-white/10 hover:bg-white/10 transition-all">
          <ArrowLeft className="w-spacing-md h-spacing-md text-secondary/70" />
        </Button>
        <span className="text-xs font-black uppercase tracking-widest text-secondary/40">{set.name}</span>
        <div className="w-spacing-xl" />
      </div>

      <div className="flex-1 flex items-start justify-center p-spacing-lg md:p-spacing-2xl">
        <div className="w-full max-w-spacing-xl">
          {step !== 'intro' && step !== 'closing' && (
            <div className="flex gap-spacing-2xs mb-spacing-xl">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className={`flex-1 h-spacing-2xs rounded-full transition-all duration-500 ${i <= currentMystery ? 'bg-secondary shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'bg-white/10'}`} />
              ))}
            </div>
          )}
          
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-[3rem] p-spacing-xl md:p-spacing-2xl  shadow-premium-hover shadow-black/50">
            {renderStep()}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Rosary;