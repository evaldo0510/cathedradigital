import React, { useState } from 'react';
import { Icons } from '../../constants';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

const AQUINO_CONCEPTS = [
  {
    id: 1,
    title: "Existência de Deus",
    aquino: "Deus pode ser conhecido pela razão",
    pch: "“Nem tudo que é invisível… é inexistente.”",
    pergunta: "O que você exige ver antes de confiar?"
  },
  {
    id: 2,
    title: "Fé e Razão",
    aquino: "Não se contradizem",
    pch: "“A fé não anula a lógica… ela a completa.”",
    pergunta: "Onde você separou pensar de acreditar?"
  },
  {
    id: 3,
    title: "Lei Natural",
    aquino: "O bem está inscrito no ser humano",
    pch: "“Você já sabia… antes de justificar.”",
    pergunta: "Onde você ignorou o que já sentia ser certo?"
  },
  {
    id: 4,
    title: "Virtude",
    aquino: "Hábitos que constroem o bem",
    pch: "“Você não se torna… você repete.”",
    pergunta: "O que você tem repetido sem perceber?"
  },
  {
    id: 5,
    title: "Livre-Arbítrio",
    aquino: "O homem escolhe",
    pch: "“Você não está preso… está condicionado.”",
    pergunta: "O que você ainda pode decidir hoje?"
  },
  {
    id: 6,
    title: "Felicidade",
    aquino: "O fim último é Deus",
    pch: "“Nada finito preenche um vazio infinito.”",
    pergunta: "O que você espera que te complete… mas nunca completa?"
  },
  {
    id: 7,
    title: "Mal",
    aquino: "É ausência do bem",
    pch: "“Nem tudo que dói… é presença do mal. Às vezes é falta de luz.”",
    pergunta: "Onde falta clareza na sua vida?"
  },
  {
    id: 8,
    title: "Ordem",
    aquino: "Tudo tem propósito",
    pch: "“O caos, muitas vezes… é ordem que você ainda não entendeu.”",
    pergunta: "O que parece confuso… mas pode ter sentido?"
  },
  {
    id: 9,
    title: "Consciência",
    aquino: "Julga o certo e o errado",
    pch: "“Você sempre soube… só tentou não ouvir.”",
    pergunta: "O que você está evitando reconhecer?"
  },
  {
    id: 10,
    title: "Verdade",
    aquino: "Adequação entre mente e realidade",
    pch: "“A verdade não muda… só a nossa coragem de aceitá-la.”",
    pergunta: "O que você já sabe… mas não assume?"
  }
];

interface Question {
  id: number;
  title: string;
  articles: { id: number; title: string; body: string }[];
}

interface SumaSection {
  part: string;
  title: string;
  questions: Question[];
}

const SUMA_DATA: SumaSection[] = [
  {
    part: 'Ia',
    title: 'Prima Pars — Deus e a Criação',
    questions: [
      {
        id: 1, title: 'Q. 1 — Da Sagrada Doutrina',
        articles: [
          { id: 1, title: 'Art. 1 — É necessária outra doutrina além das disciplinas filosóficas?', body: 'Respondeo: Foi necessário, para a salvação humana, que houvesse uma doutrina fundada na revelação divina, além das disciplinas filosóficas investigadas pela razão humana. Primeiro, porque o homem é ordenado a Deus como a um fim que excede a compreensão da razão, conforme Isaías 64,4: "Olho não viu, ó Deus, sem Ti, o que preparaste para os que Te amam." Ora, é necessário que o fim seja previamente conhecido pelos homens, para que a ele possam ordenar suas intenções e ações. Por isso foi necessário ao homem, para sua salvação, que certas coisas que excedem a razão humana lhe fossem dadas a conhecer por revelação divina.' },
          { id: 2, title: 'Art. 2 — A Sagrada Doutrina é ciência?', body: 'Respondeo: A Sagrada Doutrina é ciência. Mas deve-se saber que há dois gêneros de ciências. Umas procedem de princípios conhecidos pela luz natural do intelecto, como a aritmética e a geometria. Outras procedem de princípios conhecidos à luz de uma ciência superior: assim a perspectiva procede de princípios estabelecidos pela geometria. E desse modo a Sagrada Doutrina é ciência, porque procede de princípios conhecidos à luz de uma ciência superior, que é a ciência de Deus e dos bem-aventurados.' },
          { id: 3, title: 'Art. 3 — A Sagrada Doutrina é ciência una?', body: 'Respondeo: A Sagrada Doutrina é uma ciência una. A unidade da potência e do hábito deve ser considerada segundo o objeto, não materialmente, mas segundo a razão formal do objeto. Por exemplo, o homem, o asno e a pedra convêm na razão formal de colorido, que é objeto da vista. Ora, como a Sagrada Escritura considera certas coisas enquanto divinamente reveladas, tudo o que é divinamente revelável participa da mesma razão formal do objeto dessa ciência. Por isso compreende-se sob a Sagrada Doutrina como sob uma ciência una.' },
        ]
      },
      {
        id: 2, title: 'Q. 2 — Da Existência de Deus',
        articles: [
          { id: 1, title: 'Art. 1 — A existência de Deus é evidente por si mesma?', body: 'Respondeo: Uma coisa pode ser evidente por si mesma de dois modos: em si mesma e não para nós, ou em si mesma e para nós. A existência de Deus, em si mesma, é evidente por si mesma, pois o predicado é idêntico ao sujeito (Deus é o próprio Ser). Mas para nós, que não conhecemos a essência divina, não é evidente por si mesma, e precisa ser demonstrada por meio das coisas que nos são mais conhecidas, embora menos conhecidas por natureza — isto é, pelos efeitos.' },
          { id: 2, title: 'Art. 2 — A existência de Deus é demonstrável?', body: 'Respondeo: A existência de Deus pode ser demonstrada. Quando um efeito nos é mais manifesto do que a sua causa, procedemos do efeito ao conhecimento da causa. Todo efeito que depende de uma causa, suposta a existência do efeito, pode servir para demonstrar a existência dessa causa, porque os efeitos dependem da causa e, posto o efeito, é necessário que a causa preexista. Logo, a existência de Deus, embora não evidente para nós, é demonstrável pelos efeitos que nos são conhecidos.' },
          { id: 3, title: 'Art. 3 — Deus existe? (As Cinco Vias)', body: 'Respondeo: A existência de Deus pode ser demonstrada por cinco vias.\n\n1ª VIA — Pelo movimento: Tudo o que se move é movido por outro. Mas não se pode proceder ao infinito nos motores. Logo, é necessário chegar a um Primeiro Motor Imóvel, que todos chamam Deus.\n\n2ª VIA — Pela causa eficiente: Na série das causas eficientes não se pode proceder ao infinito. Logo, é necessário admitir uma Causa Eficiente Primeira, que todos chamam Deus.\n\n3ª VIA — Pelo possível e necessário: Se todas as coisas são possíveis de não ser, em algum momento nada teria existido. Logo, é necessário admitir algo necessário por si mesmo — Deus.\n\n4ª VIA — Pelos graus de perfeição: Há coisas mais ou menos boas, verdadeiras e nobres. Mas o "mais e o menos" se diz em relação a um máximo. Logo, existe algo que é maximamente ser e causa do ser de todas as coisas — Deus.\n\n5ª VIA — Pelo governo do mundo: Coisas sem inteligência agem em vista de um fim. Ora, o que não tem conhecimento só tende a um fim dirigido por algo inteligente. Logo, existe um ser inteligente que ordena todas as coisas a seu fim — Deus.' },
        ]
      },
      {
        id: 3, title: 'Q. 3 — Da Simplicidade de Deus',
        articles: [
          { id: 1, title: 'Art. 1 — Deus é corpo?', body: 'Respondeo: Deus absolutamente não é corpo. Isto se demonstra de três modos. Primeiro, porque nenhum corpo move sem ser movido, como se vê na experiência dos sentidos. Ora, demonstrou-se (Q.2, Art.3) que Deus é o primeiro motor imóvel. Logo, é manifesto que Deus não é corpo.' },
          { id: 2, title: 'Art. 4 — Em Deus há composição de essência e existência?', body: 'Respondeo: Deus não é somente sua essência, mas também seu próprio ser (esse). O que se pode mostrar de várias maneiras. Primeiro, porque tudo o que está em algo além de sua essência, deve ser causado ou pelos princípios da essência ou por algo extrínseco. Ora, não é possível que o ser (esse) seja causado apenas pela essência da coisa, pois nenhuma coisa basta para ser causa do seu próprio ser, se tem o ser causado. Logo, é necessário que aquilo cuja essência difere do seu ser tenha o ser causado por outro. Isto não pode dizer-se de Deus, porque Deus é a primeira causa eficiente. Logo, em Deus a essência não difere do ser.' },
        ]
      },
    ]
  },
  {
    part: 'Ia-IIae',
    title: 'Prima Secundae — A Vida Moral em Geral',
    questions: [
      {
        id: 1, title: 'Q. 1 — Do fim último do homem',
        articles: [
          { id: 1, title: 'Art. 1 — Compete ao homem agir por um fim?', body: 'Respondeo: Das ações que o homem pratica, somente aquelas são propriamente chamadas humanas que são próprias do homem enquanto homem. Ora, o homem difere das criaturas irracionais porque é senhor de seus atos. Por isso, somente aquelas ações são propriamente chamadas humanas das quais o homem é senhor. Ora, o homem é senhor de seus atos pela razão e pela vontade. Logo, são chamadas propriamente humanas as ações que procedem da vontade deliberada.' },
          { id: 2, title: 'Art. 7 — Há um fim último de todos os homens?', body: 'Respondeo: Pode-se falar do fim último de dois modos: quanto à razão formal de fim último, ou quanto àquilo em que se encontra a razão de fim último. Quanto à razão formal, todos concordam em desejar o fim último, pois todos desejam alcançar sua própria perfeição, que é a razão do fim último. Mas quanto àquilo em que essa razão se realiza, nem todos os homens concordam, pois uns desejam riquezas como bem perfeito, outros o prazer, outros outras coisas.' },
        ]
      },
      {
        id: 90, title: 'Q. 90 — Da essência da lei',
        articles: [
          { id: 1, title: 'Art. 1 — A lei pertence à razão?', body: 'Respondeo: A lei é uma regra e medida dos atos, segundo a qual alguém é induzido a agir ou a retrair-se da ação. Ora, a regra e medida dos atos humanos é a razão, que é o primeiro princípio dos atos humanos, pois pertence à razão ordenar para o fim, que é o primeiro princípio no agir. Logo, a lei é algo pertencente à razão.' },
          { id: 4, title: 'Art. 4 — Definição de lei', body: 'Respondeo: Dos quatro artigos precedentes se pode coligir a definição da lei: a lei não é outra coisa senão uma ordenação da razão para o bem comum, promulgada por aquele que tem o cuidado da comunidade. — "Lex est quaedam rationis ordinatio ad bonum commune, ab eo qui curam communitatis habet, promulgata."' },
        ]
      },
    ]
  },
  {
    part: 'IIa-IIae',
    title: 'Secunda Secundae — As Virtudes e os Vícios',
    questions: [
      {
        id: 1, title: 'Q. 1 — Da Fé',
        articles: [
          { id: 1, title: 'Art. 1 — O que é crer?', body: 'Respondeo: Crer é um ato do intelecto que assente à verdade divina por império da vontade movida por Deus mediante a graça. E assim esse ato está sujeito ao livre-arbítrio e ordenado a Deus; por isso o ato de fé pode ser meritório.' },
          { id: 2, title: 'Art. 2 — O objeto da fé', body: 'Respondeo: O objeto da fé pode ser considerado de dois modos. Por parte da coisa crida, e assim o objeto da fé é algo incomposto, a saber, a própria realidade sobre a qual versa a fé. Por parte do crente, e assim o objeto da fé é algo composto, a modo de enunciado. De ambos os modos se verifica que o objeto da fé é a Verdade Primeira.' },
        ]
      },
      {
        id: 23, title: 'Q. 23 — Da Caridade',
        articles: [
          { id: 1, title: 'Art. 1 — A caridade é amizade?', body: 'Respondeo: Nem todo amor tem razão de amizade, mas somente o amor que inclui benevolência, isto é, quando amamos alguém de tal modo que lhe queremos o bem. Se não queremos o bem daquilo que amamos, mas queremos o bem dele para nós, não é amizade, mas concupiscência. Ora, a benevolência não basta para a amizade, requer-se ainda a correspondência no amor, e essa mútua benevolência se funda em alguma comunicação. Havendo, pois, uma comunicação do homem com Deus, enquanto nos comunica sua bem-aventurança, é necessário que sobre essa comunicação se funde alguma amizade — e essa amizade é a caridade.' },
        ]
      },
    ]
  },
  {
    part: 'IIIa',
    title: 'Tertia Pars — Cristo e os Sacramentos',
    questions: [
      {
        id: 1, title: 'Q. 1 — Da conveniência da Encarnação',
        articles: [
          { id: 1, title: 'Art. 1 — Foi conveniente que Deus se encarnasse?', body: 'Respondeo: A cada coisa convém aquilo que lhe pertence segundo a razão de sua natureza. Ora, a natureza de Deus é a própria essência da bondade. Logo, tudo o que pertence à razão do bem convém a Deus. Ora, pertence à razão do bem comunicar-se aos outros. Logo, pertence à razão do sumo bem comunicar-se à criatura de modo sumamente. E isso se realiza maximamente quando Deus "de tal modo une a si a natureza criada que uma só Pessoa se constitui de três: o Verbo, a alma e a carne", como diz Agostinho.' },
          { id: 2, title: 'Art. 2 — Foi necessária a Encarnação para a reparação do gênero humano?', body: 'Respondeo: Uma coisa pode ser necessária para algum fim de dois modos. De um modo, sem o qual o fim não pode existir: como o alimento é necessário para a conservação da vida humana. De outro modo, aquilo pelo qual se chega ao fim de modo melhor e mais conveniente. E dessa maneira a Encarnação foi necessária para a reparação da natureza humana. Pois Deus, por sua potência onipotente, podia reparar a natureza humana de muitos outros modos. Mas nenhum modo teria sido mais conveniente.' },
        ]
      },
      {
        id: 73, title: 'Q. 73 — Do Sacramento da Eucaristia',
        articles: [
          { id: 1, title: 'Art. 1 — A Eucaristia é sacramento?', body: 'Respondeo: A Eucaristia é sacramento da Igreja. Pois sacramento, conforme dissemos, é aquilo que contém algo de sagrado. Ora, na Eucaristia contém-se algo de sagrado de modo absoluto, a saber, o próprio Cristo. Logo, a Eucaristia é verdadeiramente sacramento — e é o maior de todos os sacramentos.' },
          { id: 3, title: 'Art. 3 — A Eucaristia é necessária para a salvação?', body: 'Respondeo: Deve-se distinguir duas coisas neste sacramento: o próprio sacramento e a realidade do sacramento (res sacramenti). A realidade deste sacramento é a unidade do corpo místico, sem a qual não pode haver salvação. A ninguém se abre a porta da salvação senão pela Igreja. Quanto à recepção do sacramento, ela pode ser dispensada pela intenção, nos casos em que a recepção efetiva não é possível.' },
        ]
      },
    ]
  },
];

const AquinasOpera: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'concepts' | 'suma'>('concepts');
  const [expandedPart, setExpandedPart] = useState<string | null>('Ia');
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleStartAquinasChat = () => {
    navigate(AppRoute.STUDY_MODE, { state: { mode: 'aquinas' } });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="text-center space-y-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
            <Icons.Brain className="w-4 h-4 text-primary" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Motor de Autoridade</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground">S. Tomás de Aquino</h1>
          <p className="text-muted-foreground font-serif italic max-w-lg mx-auto">
            Não apenas conteúdo… domínio intelectual aplicado à alma.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 p-1 bg-muted rounded-2xl w-fit mx-auto">
          <button
            onClick={() => setActiveTab('concepts')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'concepts' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            10 Conceitos
          </button>
          <button
            onClick={() => setActiveTab('suma')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'suma' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Suma Teológica
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'concepts' ? (
          <motion.div
            key="concepts"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AQUINO_CONCEPTS.map((concept, idx) => (
                <div key={concept.id} className="group bg-card border border-border rounded-3xl p-6 hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/5">
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-4xl font-serif text-primary/10 group-hover:text-primary/20 transition-colors">0{idx + 1}</span>
                    <div className="p-2 bg-primary/5 rounded-xl text-primary">
                      <Icons.Scroll className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-foreground mb-4">{concept.title}</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-2xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Aquino ensina:</p>
                      <p className="text-sm font-serif italic text-foreground/80">{concept.aquino}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Reflexão PCH:</p>
                      <p className="text-lg font-serif font-medium text-foreground">{concept.pch}</p>
                    </div>
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm font-serif font-bold text-primary">👉 {concept.pergunta}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Premium CTA */}
            <div className="relative overflow-hidden bg-foreground text-background rounded-[2.5rem] p-8 md:p-12">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-background/10 rounded-full border border-background/20">
                  <Icons.Star className="w-4 h-4 text-primary" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">Conteúdo Premium</span>
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl md:text-5xl font-serif font-bold leading-tight">Clareza Interior com Aquino</h2>
                  <p className="text-lg text-background/70 font-serif italic">A trilha completa para quem busca clareza mental e direção de vida.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-serif">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>Trilha completa guiada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>Reflexões profundas personalizadas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>IA IARA explicando decisões</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>Aplicação prática no cotidiano</span>
                  </div>
                </div>
                <button 
                  onClick={() => navigate(AppRoute.CHECKOUT)}
                  className="w-full md:w-auto px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Garantir acesso ao PRO
                </button>
              </div>
            </div>

            {/* AI Interaction Button */}
            <div className="text-center space-y-4">
              <p className="text-muted-foreground font-serif italic">Tem alguma dúvida sobre os ensinamentos de Aquino?</p>
              <button
                onClick={handleStartAquinasChat}
                className="inline-flex items-center gap-3 px-8 py-4 bg-primary/10 text-primary rounded-2xl font-bold hover:bg-primary/20 transition-all group"
              >
                <Icons.Brain className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Interagir com IARA (Modo Aquino)
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="suma"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
        {SUMA_DATA.map(section => (
          <div key={section.part} className="bg-card border border-border rounded-2xl overflow-hidden">
            <button
              onClick={() => setExpandedPart(expandedPart === section.part ? null : section.part)}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-primary/5 transition-all"
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">{section.part}</span>
                <h3 className="text-lg font-serif font-bold text-foreground">{section.title}</h3>
              </div>
              <Icons.ArrowDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedPart === section.part ? 'rotate-180' : ''}`} />
            </button>

            {expandedPart === section.part && (
              <div className="border-t border-border">
                {section.questions.map(q => (
                  <div key={`${section.part}-${q.id}`} className="border-b border-border last:border-0">
                    <button
                      onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                      className="w-full p-4 pl-8 flex items-center justify-between text-left hover:bg-muted/50 transition-all"
                    >
                      <span className="font-bold text-sm text-foreground">{q.title}</span>
                      <Icons.ArrowDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedQuestion === q.id ? 'rotate-180' : ''}`} />
                    </button>

                    {expandedQuestion === q.id && (
                      <div className="px-8 pb-4 space-y-2">
                        {q.articles.map(art => {
                          const artKey = `${section.part}-${q.id}-${art.id}`;
                          return (
                            <div key={artKey}>
                              <button
                                onClick={() => setExpandedArticle(expandedArticle === artKey ? null : artKey)}
                                className="w-full p-3 rounded-xl text-left hover:bg-primary/5 transition-all"
                              >
                                <span className="text-sm font-serif text-foreground/90">{art.title}</span>
                              </button>
                              {expandedArticle === artKey && (
                                <div className="px-3 pb-4">
                                  <p className="text-base md:text-lg text-foreground/80 font-serif leading-relaxed whitespace-pre-line bg-muted rounded-xl p-5">{art.body}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-muted rounded-2xl p-8 text-center space-y-4">
        <Icons.History className="w-8 h-8 text-primary/30 mx-auto" />
        <p className="text-sm text-muted-foreground font-serif italic max-w-sm mx-auto">A Suma Teológica contém 512 questões e 2.669 artigos. O conteúdo completo está sendo adicionado progressivamente.</p>
      </div>
    </div>
  );
};

export default AquinasOpera;
