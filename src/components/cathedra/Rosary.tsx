import React, { useState } from 'react';
import { Icons } from '../../constants';

type MysterySet = 'joyful' | 'sorrowful' | 'glorious' | 'luminous';

const YOUTUBE_IDS: Record<MysterySet, string> = {
  joyful: 'y0nohEWE7PI',
  sorrowful: '5jBHMsyvXMo',
  glorious: 'kcsu2e-0j2I',
  luminous: 'kmHzPZihdvY',
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

const MYSTERIES: Record<MysterySet, { name: string; day: string; mysteries: { title: string; scripture: string; meditation: string }[] }> = {
  joyful: {
    name: 'Mistérios Gozosos',
    day: 'Segunda e Sábado',
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

  if (!selectedSet) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
            <Icons.Heart className="w-4 h-4 text-primary" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Rosarium</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Santo Rosário</h1>
          <p className="text-muted-foreground font-serif italic">Reze os 20 mistérios com meditações e guia passo a passo.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(Object.entries(MYSTERIES) as [MysterySet, typeof MYSTERIES[MysterySet]][]).map(([key, val]) => (
            <button key={key} onClick={() => setSelectedSet(key)}
              className="text-left p-6 md:p-8 rounded-3xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group">
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">{val.day}</span>
              <h2 className="text-xl md:text-2xl font-serif font-bold text-foreground mt-2 group-hover:text-primary transition-colors">{val.name}</h2>
              <div className="mt-4 space-y-1">
                {val.mysteries.map((m, i) => (
                  <p key={i} className="text-xs text-muted-foreground">{i + 1}. {m.title}</p>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const set = MYSTERIES[selectedSet];

  if (!isPraying) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedSet(null)} className="p-2 rounded-xl bg-card border border-border hover:bg-primary/10 transition-all">
            <Icons.ArrowDown className="w-5 h-5 rotate-90 text-foreground" />
          </button>
          <div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">{set.day}</span>
            <h1 className="text-2xl font-serif font-bold text-foreground">{set.name}</h1>
          </div>
        </div>

        {/* YouTube Player */}
        <YouTubePlayer videoId={YOUTUBE_IDS[selectedSet]} title={set.name} />

        <div className="text-center">
          <button onClick={() => { setIsPraying(true); setCurrentMystery(0); setStep('intro'); }}
            className="px-8 py-4 bg-foreground text-background rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-primary hover:text-primary-foreground transition-all">
            Iniciar Oração
          </button>
        </div>

        <div className="space-y-4">
          {set.mysteries.map((m, i) => (
            <div key={i} className="p-5 rounded-2xl bg-card border border-border">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center font-black text-sm shrink-0">{i + 1}</div>
                <div>
                  <p className="font-serif font-bold text-foreground">{m.title}</p>
                  <p className="text-[10px] text-primary font-bold mt-0.5">{m.scripture}</p>
                  <p className="text-sm text-muted-foreground mt-2 font-serif">{m.meditation}</p>
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
        <div className="space-y-6">
          <h3 className="text-lg font-serif font-bold text-foreground text-center">Orações Iniciais</h3>
          {['signOfCross', 'creed', 'ourFather'].map(k => (
            <div key={k} className="bg-muted rounded-2xl p-5 cursor-pointer" onClick={() => setShowPrayer(showPrayer === k ? null : k)}>
              <p className="font-bold text-sm text-foreground">{PRAYERS[k as keyof typeof PRAYERS].title}</p>
              {showPrayer === k && <p className="text-sm text-foreground/80 mt-2 font-serif leading-relaxed">{PRAYERS[k as keyof typeof PRAYERS].text}</p>}
            </div>
          ))}
          <p className="text-xs text-muted-foreground text-center font-serif italic">Reze 3 Ave-Marias pelas virtudes da Fé, Esperança e Caridade, seguidas do Glória.</p>
          <button onClick={() => setStep('mystery')} className="w-full py-3 bg-foreground text-background rounded-xl font-bold text-sm">
            Iniciar 1º Mistério →
          </button>
        </div>
      );
    }

    if (step === 'mystery') {
      return (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">{currentMystery + 1}º Mistério</span>
            <h3 className="text-xl font-serif font-bold text-foreground">{mystery.title}</h3>
            <p className="text-sm text-primary font-bold">{mystery.scripture}</p>
          </div>
          <div className="bg-muted rounded-2xl p-6">
            <p className="text-foreground/80 font-serif leading-relaxed">{mystery.meditation}</p>
          </div>
          <button onClick={() => setStep('decade')} className="w-full py-3 bg-foreground text-background rounded-xl font-bold text-sm">
            Rezar a Dezena →
          </button>
        </div>
      );
    }

    if (step === 'decade') {
      return (
        <div className="space-y-6">
          <p className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">{currentMystery + 1}º Mistério — Dezena</p>
          {['ourFather', 'hailMary', 'glory', 'fatima'].map(k => (
            <div key={k} className="bg-muted rounded-2xl p-5 cursor-pointer" onClick={() => setShowPrayer(showPrayer === k ? null : k)}>
              <p className="font-bold text-sm text-foreground">
                {PRAYERS[k as keyof typeof PRAYERS].title}
                {k === 'hailMary' && <span className="text-muted-foreground font-normal"> (×10)</span>}
              </p>
              {showPrayer === k && <p className="text-sm text-foreground/80 mt-2 font-serif leading-relaxed">{PRAYERS[k as keyof typeof PRAYERS].text}</p>}
            </div>
          ))}
          <button onClick={() => {
            if (currentMystery < 4) {
              setCurrentMystery(currentMystery + 1);
              setStep('mystery');
              setShowPrayer(null);
            } else {
              setStep('closing');
            }
          }} className="w-full py-3 bg-foreground text-background rounded-xl font-bold text-sm">
            {currentMystery < 4 ? `Próximo Mistério →` : 'Concluir Rosário →'}
          </button>
        </div>
      );
    }

    // closing
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-serif font-bold text-foreground text-center">Oração Final</h3>
        <div className="bg-muted rounded-2xl p-5 cursor-pointer" onClick={() => setShowPrayer(showPrayer === 'salve' ? null : 'salve')}>
          <p className="font-bold text-sm text-foreground">{PRAYERS.salveRainha.title}</p>
          {showPrayer === 'salve' && <p className="text-sm text-foreground/80 mt-2 font-serif leading-relaxed">{PRAYERS.salveRainha.text}</p>}
        </div>
        <div className="text-center space-y-2 py-4">
          <Icons.Heart className="w-10 h-10 text-primary mx-auto" />
          <p className="text-foreground font-serif font-bold">Rosário Completo!</p>
          <p className="text-sm text-muted-foreground font-serif italic">Que Nossa Senhora interceda por vós e vossas intenções.</p>
        </div>
        <button onClick={() => { setIsPraying(false); setSelectedSet(null); }}
          className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm">
          ✝ Amém — Finalizar
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => { setIsPraying(false); }} className="p-2 rounded-xl bg-card border border-border hover:bg-primary/10 transition-all">
          <Icons.ArrowDown className="w-5 h-5 rotate-90 text-foreground" />
        </button>
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{set.name}</span>
        <div className="w-9" />
      </div>

      {step !== 'intro' && step !== 'closing' && (
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= currentMystery ? 'bg-primary' : 'bg-border'}`} />
          ))}
        </div>
      )}

      <div className="bg-card border border-border rounded-3xl p-8 md:p-10">
        {renderStep()}
      </div>
    </div>
  );
};

export default Rosary;
