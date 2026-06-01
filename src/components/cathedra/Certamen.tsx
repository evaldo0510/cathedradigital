import { Button } from '@/components/ui/button';
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';


interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  category: string;
}

const QUIZ_BANK: QuizQuestion[] = [
  // === Bíblia ===
  { question: 'Quantos livros tem a Bíblia católica?', options: ['66', '72', '73', '76'], correct: 2, explanation: 'A Bíblia católica possui 73 livros: 46 do Antigo Testamento e 27 do Novo Testamento, incluindo os 7 livros deuterocanônicos.', category: 'Bíblia' },
  { question: 'Quantas são as Bem-Aventuranças?', options: ['7', '8', '9', '10'], correct: 1, explanation: 'São 8 Bem-Aventuranças, ensinadas por Jesus no Sermão da Montanha (Mt 5,3-12).', category: 'Bíblia' },
  { question: 'Qual é o menor livro do Novo Testamento?', options: ['2 João', '3 João', 'Judas', 'Filêmon'], correct: 1, explanation: '3 João é o menor livro do Novo Testamento, com apenas 15 versículos.', category: 'Bíblia' },
  { question: 'Quem escreveu a maioria das epístolas do NT?', options: ['Pedro', 'Paulo', 'João', 'Tiago'], correct: 1, explanation: 'São Paulo escreveu 13 das 21 epístolas do Novo Testamento.', category: 'Bíblia' },
  { question: 'Qual o primeiro milagre de Jesus no Evangelho de João?', options: ['Multiplicação dos pães', 'Bodas de Caná', 'Cura de um cego', 'Ressurreição de Lázaro'], correct: 1, explanation: 'Nas Bodas de Caná (Jo 2,1-11), Jesus transformou água em vinho — seu primeiro "sinal".', category: 'Bíblia' },
  { question: 'Quantos dias durou o dilúvio segundo Gênesis?', options: ['7 dias', '40 dias', '100 dias', '150 dias'], correct: 1, explanation: 'Choveu por 40 dias e 40 noites (Gn 7,12). As águas prevaleceram 150 dias na terra.', category: 'Bíblia' },

  // === Sacramentos ===
  { question: 'Qual é o primeiro sacramento de iniciação cristã?', options: ['Eucaristia', 'Batismo', 'Crisma', 'Confissão'], correct: 1, explanation: 'O Batismo é o primeiro e mais fundamental sacramento, porta de entrada para os demais sacramentos (CIC §1213).', category: 'Sacramentos' },
  { question: 'Quantos são os sacramentos da Igreja Católica?', options: ['5', '6', '7', '8'], correct: 2, explanation: 'São 7 sacramentos: Batismo, Crisma, Eucaristia, Penitência, Unção dos Enfermos, Ordem e Matrimônio (CIC §1210).', category: 'Sacramentos' },
  { question: 'Qual sacramento é chamado "sacramento dos mortos"?', options: ['Eucaristia', 'Penitência', 'Ordem', 'Crisma'], correct: 1, explanation: 'A Penitência (Confissão) é chamada "sacramento dos mortos" porque pode restituir a vida da graça a quem a perdeu pelo pecado mortal.', category: 'Sacramentos' },
  { question: 'Na Eucaristia, o que ocorre com o pão e o vinho?', options: ['Simbolização', 'Transubstanciação', 'Consubstanciação', 'Impanação'], correct: 1, explanation: 'A doutrina católica ensina a transubstanciação: a substância do pão e do vinho se converte no Corpo e Sangue de Cristo, permanecendo os acidentes (CIC §1376).', category: 'Sacramentos' },
  { question: 'Quais são os sacramentos de iniciação cristã?', options: ['Batismo, Crisma, Ordem', 'Batismo, Crisma, Eucaristia', 'Batismo, Penitência, Eucaristia', 'Crisma, Eucaristia, Matrimônio'], correct: 1, explanation: 'Os três sacramentos de iniciação cristã são Batismo, Confirmação (Crisma) e Eucaristia (CIC §1212).', category: 'Sacramentos' },
  { question: 'Quem pode administrar o sacramento da Ordem?', options: ['Qualquer sacerdote', 'Apenas o Papa', 'Um bispo', 'Um diácono'], correct: 2, explanation: 'Somente um bispo validamente ordenado pode conferir o sacramento da Ordem em seus três graus: diaconato, presbiterado e episcopado (CIC §1576).', category: 'Sacramentos' },

  // === Liturgia ===
  { question: 'Qual é o centro e ápice da liturgia católica?', options: ['Liturgia das Horas', 'Santa Missa', 'Adoração Eucarística', 'Procissões'], correct: 1, explanation: 'A celebração eucarística (Santa Missa) é "fonte e ápice de toda a vida cristã" (Lumen Gentium 11, CIC §1324).', category: 'Liturgia' },
  { question: 'Quantos tempos litúrgicos há no ano?', options: ['4', '5', '6', '7'], correct: 2, explanation: 'São 6 tempos litúrgicos: Advento, Natal, Quaresma, Tríduo Pascal, Tempo Pascal e Tempo Comum.', category: 'Liturgia' },
  { question: 'Qual a cor litúrgica da Quaresma?', options: ['Branco', 'Verde', 'Roxo', 'Vermelho'], correct: 2, explanation: 'O roxo é usado na Quaresma e no Advento, simbolizando penitência e conversão.', category: 'Liturgia' },
  { question: 'O que significa "Kyrie Eleison"?', options: ['Glória a Deus', 'Senhor, tende piedade', 'Santo, Santo, Santo', 'Cordeiro de Deus'], correct: 1, explanation: '"Kyrie Eleison" é grego e significa "Senhor, tende piedade de nós". É uma das partes mais antigas da liturgia.', category: 'Liturgia' },
  { question: 'Qual é a parte mais importante da Missa?', options: ['Homilia', 'Comunhão', 'Consagração', 'Glória'], correct: 2, explanation: 'A Consagração é o momento central da Missa, quando o pão e o vinho se tornam o Corpo e o Sangue de Cristo pela ação do Espírito Santo.', category: 'Liturgia' },
  { question: 'O que é o Tríduo Pascal?', options: ['Os 3 dias antes do Natal', 'Quinta, Sexta e Sábado Santos', 'Os 3 domingos antes da Páscoa', 'Os 3 dias após Pentecostes'], correct: 1, explanation: 'O Tríduo Pascal compreende a Quinta-feira Santa, Sexta-feira da Paixão e Sábado Santo — culminando na Vigília Pascal.', category: 'Liturgia' },

  // === Mariologia ===
  { question: 'Qual dogma mariano foi proclamado em 1854?', options: ['Assunção de Maria', 'Imaculada Conceição', 'Maternidade Divina', 'Virgindade Perpétua'], correct: 1, explanation: 'A Imaculada Conceição foi proclamada pelo Papa Pio IX em 8 de dezembro de 1854, pela bula Ineffabilis Deus.', category: 'Mariologia' },
  { question: 'Quantos dogmas marianos a Igreja proclamou?', options: ['2', '3', '4', '5'], correct: 2, explanation: 'São 4 dogmas marianos: Maternidade Divina (431), Virgindade Perpétua (649), Imaculada Conceição (1854) e Assunção (1950).', category: 'Mariologia' },
  { question: 'Em qual Concílio Maria foi declarada "Theotokos"?', options: ['Niceia (325)', 'Éfeso (431)', 'Calcedônia (451)', 'Trento (1545)'], correct: 1, explanation: 'No Concílio de Éfeso (431), Maria foi solenemente declarada Theotokos (Mãe de Deus), contra a heresia de Nestório.', category: 'Mariologia' },
  { question: 'Quando foi proclamado o dogma da Assunção de Maria?', options: ['1854', '1870', '1917', '1950'], correct: 3, explanation: 'O dogma da Assunção de Maria foi proclamado pelo Papa Pio XII em 1º de novembro de 1950, pela Constituição Apostólica Munificentissimus Deus.', category: 'Mariologia' },
  { question: 'Qual título mariano aparece em Apocalipse 12?', options: ['Rosa Mística', 'Estrela da Manhã', 'Mulher vestida de sol', 'Mãe das Dores'], correct: 2, explanation: '"Apareceu no céu um grande sinal: uma Mulher vestida de sol, com a lua debaixo dos pés e uma coroa de doze estrelas na cabeça" (Ap 12,1).', category: 'Mariologia' },
  { question: 'Qual oração mariana contém as palavras do Anjo Gabriel?', options: ['Salve Rainha', 'Magnificat', 'Ave Maria', 'Sub Tuum Praesidium'], correct: 2, explanation: 'A Ave Maria começa com a saudação do Anjo Gabriel: "Ave, cheia de graça, o Senhor é contigo" (Lc 1,28).', category: 'Mariologia' },

  // === Escatologia ===
  { question: 'Quais são os "Novíssimos" na doutrina católica?', options: ['Céu, Inferno, Purgatório', 'Morte, Juízo, Inferno, Paraíso', 'Ressurreição, Ascensão, Pentecostes, Parusia', 'Batismo, Crisma, Eucaristia, Ordem'], correct: 1, explanation: 'Os quatro Novíssimos (últimas coisas) são: Morte, Juízo, Inferno e Paraíso (CIC §§1020-1060).', category: 'Escatologia' },
  { question: 'O que é o Purgatório?', options: ['Lugar de tormento eterno', 'Estado de purificação final', 'Reencarnação', 'Limbo'], correct: 1, explanation: 'O Purgatório é o estado de purificação final para os que morrem na graça de Deus mas não estão perfeitamente purificados (CIC §1030-1032).', category: 'Escatologia' },
  { question: 'O que é a "Parusia"?', options: ['A criação do mundo', 'A segunda vinda de Cristo', 'A descida do Espírito Santo', 'A Ascensão de Jesus'], correct: 1, explanation: 'Parusia é o termo teológico para a segunda vinda gloriosa de Cristo no fim dos tempos, para julgar os vivos e os mortos (CIC §1040).', category: 'Escatologia' },
  { question: 'O que professa o Credo sobre o fim dos tempos?', options: ['A reencarnação das almas', 'A ressurreição da carne', 'A aniquilação do ser', 'O eterno retorno'], correct: 1, explanation: '"Creio na ressurreição da carne" — no último dia, os corpos dos mortos ressuscitarão e se unirão às suas almas (CIC §988-1004).', category: 'Escatologia' },
  { question: 'O Juízo Final é igual ao juízo particular?', options: ['Sim, são o mesmo', 'Não, o particular é após a morte de cada um', 'Não, o particular é só para os santos', 'Sim, ambos ocorrem no fim do mundo'], correct: 1, explanation: 'O juízo particular acontece imediatamente após a morte de cada pessoa. O Juízo Final (Universal) ocorrerá na segunda vinda de Cristo, diante de todos (CIC §1021-1022, §1038-1041).', category: 'Escatologia' },
  { question: 'Qual é a pena do Inferno segundo a doutrina católica?', options: ['Temporária e educativa', 'Eterna separação de Deus', 'Sono da alma', 'Inexistente'], correct: 1, explanation: 'O Inferno é a eterna separação de Deus, estado definitivo de auto-exclusão da comunhão com Deus e com os bem-aventurados (CIC §1033-1037).', category: 'Escatologia' },

  // === História ===
  { question: 'Quem convocou o Concílio de Trento?', options: ['Paulo III', 'Pio V', 'Leão X', 'Clemente VII'], correct: 0, explanation: 'O Papa Paulo III convocou o Concílio de Trento em 1545, em resposta à Reforma Protestante.', category: 'História' },
  { question: 'O Credo Niceno-Constantinopolitano foi definido em qual ano?', options: ['325 d.C.', '381 d.C.', '431 d.C.', '451 d.C.'], correct: 1, explanation: 'O Credo Niceno-Constantinopolitano foi finalizado no Concílio de Constantinopla em 381 d.C.', category: 'História' },
  { question: 'Qual Concílio definiu o cânon bíblico?', options: ['Niceia (325)', 'Hipona (393)', 'Calcedônia (451)', 'Latrão IV (1215)'], correct: 1, explanation: 'O Concílio de Hipona (393) definiu pela primeira vez o cânon das Escrituras.', category: 'História' },
  { question: 'Qual foi o último Concílio Ecumênico?', options: ['Trento', 'Vaticano I', 'Vaticano II', 'Latrão V'], correct: 2, explanation: 'O Concílio Vaticano II (1962-1965), convocado por João XXIII, é o último Concílio Ecumênico da Igreja.', category: 'História' },

  // === Santos ===
  { question: 'São Tomás de Aquino pertencia a qual Ordem religiosa?', options: ['Franciscana', 'Beneditina', 'Dominicana', 'Jesuíta'], correct: 2, explanation: 'São Tomás de Aquino (1225-1274) pertencia à Ordem dos Pregadores (Dominicanos).', category: 'Santos' },
  { question: 'Quem fundou a Companhia de Jesus (Jesuítas)?', options: ['São Francisco de Assis', 'Santo Inácio de Loyola', 'São Domingos', 'São Bento'], correct: 1, explanation: 'Santo Inácio de Loyola fundou a Companhia de Jesus em 1534, aprovada pelo Papa Paulo III em 1540.', category: 'Santos' },

  // === Dogmas ===
  { question: 'Qual dogma foi definido no Concílio de Niceia?', options: ['Transubstanciação', 'Divindade de Cristo', 'Imaculada Conceição', 'Infalibilidade Papal'], correct: 1, explanation: 'O Concílio de Niceia (325) definiu solenemente que Jesus Cristo é "Deus verdadeiro de Deus verdadeiro, consubstancial ao Pai".', category: 'Dogmas' },
  { question: 'A infalibilidade papal foi definida em qual Concílio?', options: ['Trento', 'Vaticano I', 'Vaticano II', 'Éfeso'], correct: 1, explanation: 'O dogma da Infalibilidade Papal foi definido no Concílio Vaticano I (1870), na constituição Pastor Aeternus.', category: 'Dogmas' },

  // === Moral ===
  { question: 'Qual é a virtude teologal mais importante segundo São Paulo?', options: ['Fé', 'Esperança', 'Caridade', 'Prudência'], correct: 2, explanation: '"A maior delas é a caridade" (1Cor 13,13).', category: 'Moral' },
  { question: 'Qual é a "rainha de todas as virtudes"?', options: ['Justiça', 'Prudência', 'Temperança', 'Fortaleza'], correct: 1, explanation: 'A Prudência é chamada "auriga virtutum" (condutora das virtudes) por São Tomás.', category: 'Moral' },
  { question: 'Quantas são as virtudes cardeais?', options: ['3', '4', '5', '7'], correct: 1, explanation: 'São 4 virtudes cardeais: Prudência, Justiça, Fortaleza e Temperança (CIC §1805).', category: 'Moral' },
  { question: 'Quantos são os pecados capitais?', options: ['5', '6', '7', '10'], correct: 2, explanation: 'São 7 pecados capitais: soberba, avareza, inveja, ira, luxúria, gula e preguiça (acídia).', category: 'Moral' },
];

const CATEGORIES = ['Todos', ...Array.from(new Set(QUIZ_BANK.map(q => q.category)))];

const Certamen: React.FC = () => {
  const [category, setCategory] = useState('Todos');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const filtered = useMemo(() => {
    const pool = category === 'Todos' ? [...QUIZ_BANK] : QUIZ_BANK.filter(q => q.category === category);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
  }, [category, showResult]);

  const question = filtered[currentIndex];

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setAnswered(a => a + 1);
    if (idx === question.correct) setScore(s => s + 1);
  };

  const nextQuestion = () => {
    if (currentIndex >= filtered.length - 1) {
      setShowResult(true);
    } else {
      setCurrentIndex(i => i + 1);
      setSelected(null);
    }
  };

  const restart = () => {
    setCurrentIndex(0);
    setSelected(null);
    setScore(0);
    setAnswered(0);
    setShowResult(false);
  };

  const shareResult = () => {
    const pct = Math.round((score / (answered || 1)) * 100);
    const date = new Date().toLocaleDateString('pt-BR');
    const text = `Meu resultado no Certamen Fidei (Quiz da Fé):\nScore: ${score}/${answered} (${pct}%)\nData: ${date}\n\n"Pois quem busca, encontra." (Mt 7,8)`;
    if (navigator.share) {
      navigator.share({ title: 'Meu Resultado no Quiz da Fé', text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Resultado copiado para a área de transferência!');
    }
  };

  if (showResult) {
    const pct = Math.round((score / (answered || 1)) * 100);
    return (
      <div className="max-w-spacing-2xl mx-auto space-y-spacing-xl p-spacing-md">
        <div className="bg-card border border-border rounded-premium p-spacing-xl text-center space-y-spacing-lg shadow-premium-hover">
          <div className="w-spacing-3xl h-spacing-3xl rounded-premium bg-primary/10 flex items-center justify-center mx-auto text-primary">
            {pct >= 80 ? <Icons.Trophy className="w-spacing-xl h-spacing-xl" /> : pct >= 50 ? <Icons.BookOpen className="w-spacing-xl h-spacing-xl" /> : <Icons.Heart className="w-spacing-xl h-spacing-xl" />}
          </div>
          <h2 className="text-premium-3xl font-serif font-bold text-foreground">Resultado do Aprendizado</h2>
          <p className="text-premium-5xl font-black text-primary">{score}/{answered}</p>
          <div className="space-y-spacing-xs">
            <p className="text-premium-lg text-muted-foreground font-serif italic">
              {pct >= 80 ? 'Excelente! Conhecimento sólido da fé!' : pct >= 50 ? 'Bom progresso. Continue estudando!' : 'Continue sua formação. A fé se aprofunda com o estudo.'}
            </p>
            <p className="text-premium-xs text-muted-foreground">Avaliação realizada em {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-spacing-md justify-center pt-spacing-md">
            <Button onClick={restart} className="px-spacing-xl py-spacing-md bg-secondary text-secondary-foreground rounded-premium-full font-black uppercase text-premium-xs tracking-widest hover:bg-secondary/80 transition-all flex items-center justify-center gap-spacing-xs">
              <Icons.RotateCcw className="w-spacing-md h-spacing-md" />
              Tentar Novamente
            </Button>
            <Button onClick={shareResult} className="px-spacing-xl py-spacing-md bg-primary text-primary-foreground rounded-premium-full font-black uppercase text-premium-xs tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-spacing-xs shadow-premium shadow-primary/20">
              <Icons.Share2 className="w-spacing-md h-spacing-md" />
              Compartilhar Resultado
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="max-w-spacing-3xl mx-auto space-y-spacing-xl p-spacing-md">
      <div className="text-center space-y-spacing-sm">
        <div className="inline-flex items-center gap-spacing-xs px-spacing-sm py-spacing-2xs bg-primary/10 rounded-premium">
          <Icons.Star className="w-spacing-md h-spacing-md text-primary" />
          <span className="text-premium-xs font-black uppercase tracking-[0.2em] text-primary">Certamen Fidei</span>
        </div>
        <h1 className="text-premium-3xl md:text-premium-5xl font-serif font-bold text-foreground">Quiz da Fé</h1>
        <p className="text-muted-foreground font-serif italic">Teste seus conhecimentos teológicos e compartilhe com sua comunidade.</p>
      </div>

      <div className="flex flex-wrap gap-spacing-xs justify-center">
        {CATEGORIES.map(cat => (
          <Button key={cat} onClick={() => { setCategory(cat); restart(); }}
            className={`px-spacing-md py-spacing-xs rounded-premium-full text-premium-xs font-bold transition-all ${cat === category ? 'bg-foreground text-background shadow-premium scale-105' : 'bg-card border border-border text-foreground hover:bg-primary/5'}`}>
            {cat}
          </Button>
        ))}
      </div>

      <div className="flex items-center justify-between text-premium-sm px-spacing-xs">
        <span className="text-muted-foreground font-bold">Pergunta {currentIndex + 1}/{filtered.length}</span>
        <div className="h-spacing-xs flex-1 mx-spacing-md bg-muted rounded-premium overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / filtered.length) * 100}%` }}
            className="h-full bg-primary"
          />
        </div>
        <span className="text-primary font-black">{score} acertos</span>
      </div>

      <div className="bg-card border border-border rounded-premium p-spacing-xl space-y-spacing-lg shadow-premium-md">
        <span className="text-premium-xs font-black uppercase tracking-widest text-primary bg-primary/10 px-spacing-xs py-spacing-2xs rounded">{question.category}</span>
        <h2 className="text-premium-xl md:text-premium-2xl font-serif font-bold text-foreground leading-tight">{question.question}</h2>

        <div className="space-y-spacing-sm">
          {question.options.map((opt, idx) => {
            let cls = 'bg-muted border-border hover:border-primary/50 hover:bg-primary/5';
            if (selected !== null) {
              if (idx === question.correct) cls = 'bg-emerald-500/10 border-emerald-500/50 text-emerald-700 font-bold';
              else if (idx === selected) cls = 'bg-destructive/10 border-destructive/50 text-destructive font-bold';
              else cls = 'opacity-50 bg-muted border-border';
            }
            return (
              <Button key={idx} onClick={() => handleAnswer(idx)}
                className={`w-full text-left p-spacing-md rounded-premium-full border font-bold text-premium-sm transition-all flex items-center gap-spacing-md ${cls}`}>
                <span className="w-spacing-xl h-spacing-xl rounded-premium-full bg-background flex items-center justify-center text-muted-foreground text-premium-xs">{String.fromCharCode(65 + idx)}</span>
                <span className="flex-1">{opt}</span>
              </Button>
            );
          })}
        </div>

        {selected !== null && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-muted rounded-premium-full p-spacing-lg space-y-spacing-sm border border-border"
          >
            <p className="text-premium-sm font-bold text-foreground flex items-center gap-spacing-xs">
              {selected === question.correct ? '✅ Resposta Correta!' : '❌ Ops, não foi dessa vez.'}
            </p>
            <p className="text-premium-sm text-muted-foreground font-serif leading-relaxed italic">{question.explanation}</p>
            
            <Button 
              onClick={nextQuestion}
              className="w-full mt-spacing-md py-spacing-md bg-primary text-primary-foreground rounded-premium-full font-black uppercase text-premium-xs tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-spacing-xs"
            >
              {currentIndex >= filtered.length - 1 ? 'Ver Resultado Final' : 'Próxima Pergunta'}
              <Icons.ArrowRight className="w-spacing-md h-spacing-md" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Certamen;
