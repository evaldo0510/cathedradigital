import React, { useState, useMemo } from 'react';
import { Icons } from '../../constants';

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  category: string;
}

const QUIZ_BANK: QuizQuestion[] = [
  { question: 'Quantos livros tem a Bíblia católica?', options: ['66', '72', '73', '76'], correct: 2, explanation: 'A Bíblia católica possui 73 livros: 46 do Antigo Testamento e 27 do Novo Testamento, incluindo os 7 livros deuterocanônicos.', category: 'Bíblia' },
  { question: 'Qual é o primeiro sacramento de iniciação cristã?', options: ['Eucaristia', 'Batismo', 'Crisma', 'Confissão'], correct: 1, explanation: 'O Batismo é o primeiro e mais fundamental sacramento, porta de entrada para os demais sacramentos (CIC §1213).', category: 'Sacramentos' },
  { question: 'Quem convocou o Concílio de Trento?', options: ['Paulo III', 'Pio V', 'Leão X', 'Clemente VII'], correct: 0, explanation: 'O Papa Paulo III convocou o Concílio de Trento em 1545, em resposta à Reforma Protestante.', category: 'História' },
  { question: 'Quantos são os sacramentos da Igreja Católica?', options: ['5', '6', '7', '8'], correct: 2, explanation: 'São 7 sacramentos: Batismo, Crisma, Eucaristia, Penitência, Unção dos Enfermos, Ordem e Matrimônio (CIC §1210).', category: 'Sacramentos' },
  { question: 'Qual é o dogma proclamado em 1854?', options: ['Assunção de Maria', 'Imaculada Conceição', 'Infalibilidade Papal', 'Transubstanciação'], correct: 1, explanation: 'A Imaculada Conceição foi proclamada pelo Papa Pio IX em 8 de dezembro de 1854, pela bula Ineffabilis Deus.', category: 'Dogmas' },
  { question: 'São Tomás de Aquino pertencia a qual Ordem religiosa?', options: ['Franciscana', 'Beneditina', 'Dominicana', 'Jesuíta'], correct: 2, explanation: 'São Tomás de Aquino (1225-1274) pertencia à Ordem dos Pregadores (Dominicanos), fundada por São Domingos de Gusmão.', category: 'Santos' },
  { question: 'Qual é a virtude teologal mais importante segundo São Paulo?', options: ['Fé', 'Esperança', 'Caridade', 'Prudência'], correct: 2, explanation: '"A maior delas é a caridade" (1Cor 13,13). A caridade é a forma de todas as virtudes e nos une a Deus.', category: 'Moral' },
  { question: 'O Credo Niceno-Constantinopolitano foi definido em qual ano?', options: ['325 d.C.', '381 d.C.', '431 d.C.', '451 d.C.'], correct: 1, explanation: 'O Credo Niceno-Constantinopolitano foi finalizado no Concílio de Constantinopla em 381 d.C., complementando o Credo de Niceia (325).', category: 'História' },
  { question: 'Quantas são as Bem-Aventuranças?', options: ['7', '8', '9', '10'], correct: 1, explanation: 'São 8 Bem-Aventuranças, ensinadas por Jesus no Sermão da Montanha (Mt 5,3-12).', category: 'Bíblia' },
  { question: 'Qual é o menor livro do Novo Testamento?', options: ['2 João', '3 João', 'Judas', 'Filêmon'], correct: 1, explanation: '3 João é o menor livro do Novo Testamento, com apenas 15 versículos.', category: 'Bíblia' },
  { question: 'Qual Concílio definiu o cânon bíblico?', options: ['Niceia (325)', 'Hipona (393)', 'Calcedônia (451)', 'Latrão IV (1215)'], correct: 1, explanation: 'O Concílio de Hipona (393) definiu pela primeira vez o cânon das Escrituras, confirmado depois em Cartago (397) e reafirmado em Trento (1546).', category: 'História' },
  { question: 'Qual é a "rainha de todas as virtudes"?', options: ['Justiça', 'Prudência', 'Temperança', 'Fortaleza'], correct: 1, explanation: 'A Prudência é chamada "auriga virtutum" (condutora das virtudes) por São Tomás, pois dirige as demais virtudes cardeais.', category: 'Moral' },
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
    const pool = category === 'Todos' ? QUIZ_BANK : QUIZ_BANK.filter(q => q.category === category);
    return pool.sort(() => Math.random() - 0.5);
  }, [category]);

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

  if (showResult) {
    const pct = Math.round((score / answered) * 100);
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="bg-card border border-border rounded-3xl p-10 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <span className="text-4xl">{pct >= 80 ? '🏆' : pct >= 50 ? '📖' : '🙏'}</span>
          </div>
          <h2 className="text-3xl font-serif font-bold text-foreground">Resultado</h2>
          <p className="text-5xl font-black text-primary">{score}/{answered}</p>
          <p className="text-muted-foreground font-serif italic">
            {pct >= 80 ? 'Excelente! Conhecimento sólido da fé!' : pct >= 50 ? 'Bom progresso. Continue estudando!' : 'Continue sua formação. A fé se aprofunda com o estudo.'}
          </p>
          <button onClick={restart} className="px-8 py-4 bg-foreground text-background rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-primary-foreground transition-all">
            Jogar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <Icons.Star className="w-4 h-4 text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Certamen Fidei</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Certamen</h1>
        <p className="text-muted-foreground font-serif italic">Teste seus conhecimentos teológicos.</p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 justify-center">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => { setCategory(cat); restart(); }}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${cat === category ? 'bg-foreground text-background' : 'bg-card border border-border text-foreground hover:bg-primary/5'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Score bar */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground font-bold">Pergunta {currentIndex + 1}/{filtered.length}</span>
        <span className="text-primary font-black">{score} pontos</span>
      </div>

      {/* Question card */}
      <div className="bg-card border border-border rounded-3xl p-8 space-y-6">
        <span className="text-[10px] font-black uppercase tracking-widest text-primary">{question.category}</span>
        <h2 className="text-xl md:text-2xl font-serif font-bold text-foreground">{question.question}</h2>

        <div className="space-y-3">
          {question.options.map((opt, idx) => {
            let cls = 'bg-muted border-border hover:border-primary/50 hover:bg-primary/5';
            if (selected !== null) {
              if (idx === question.correct) cls = 'bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-300';
              else if (idx === selected) cls = 'bg-red-500/10 border-red-500/50 text-red-700 dark:text-red-300';
              else cls = 'opacity-50 bg-muted border-border';
            }
            return (
              <button key={idx} onClick={() => handleAnswer(idx)}
                className={`w-full text-left p-4 rounded-xl border font-bold text-sm transition-all ${cls}`}>
                <span className="mr-3 text-muted-foreground">{String.fromCharCode(65 + idx)}.</span>
                {opt}
              </button>
            );
          })}
        </div>

        {selected !== null && (
          <div className="bg-muted rounded-xl p-5 space-y-2">
            <p className="text-sm font-bold text-foreground">{selected === question.correct ? '✅ Correto!' : '❌ Incorreto'}</p>
            <p className="text-sm text-muted-foreground font-serif leading-relaxed">{question.explanation}</p>
          </div>
        )}

        {selected !== null && (
          <button onClick={nextQuestion} className="w-full py-3 bg-foreground text-background rounded-xl font-bold text-sm hover:bg-primary hover:text-primary-foreground transition-all">
            {currentIndex < filtered.length - 1 ? 'Próxima Pergunta →' : 'Ver Resultado'}
          </button>
        )}
      </div>
    </div>
  );
};

export default Certamen;
