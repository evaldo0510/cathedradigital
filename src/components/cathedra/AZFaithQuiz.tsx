import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Trophy, RotateCcw, Sparkles, ArrowRight, BookOpen, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

interface FaithTerm {
  term: string;
  definition: string;
  reference?: string;
  category?: string;
  deepInterpretation?: string;
  practicalApplication?: string;
  bibleVerses?: string[];
  catechismReferences?: string[];
  magisteriumReferences?: string[];
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  term: string;
  category: string;
  explanation: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateQuestions(terms: FaithTerm[], count = 10): QuizQuestion[] {
  const enriched = terms.filter(t => t.definition.length > 20);
  if (enriched.length < 4) return [];

  const selected = shuffle(enriched).slice(0, Math.min(count, enriched.length));
  
  return selected.map(term => {
    // Pick 3 wrong answers from other terms
    const others = shuffle(enriched.filter(t => t.term !== term.term)).slice(0, 3);
    const options = shuffle([
      { text: term.definition, correct: true },
      ...others.map(o => ({ text: o.definition, correct: false })),
    ]);

    return {
      question: `Qual é o significado de "${term.term}"?`,
      options: options.map(o => o.text),
      correctIndex: options.findIndex(o => o.correct),
      term: term.term,
      category: term.category || 'Geral',
      explanation: term.deepInterpretation || term.definition,
    };
  });
}

interface AZFaithQuizProps {
  terms: FaithTerm[];
  onClose: () => void;
}

const AZFaithQuiz: React.FC<AZFaithQuizProps> = ({ terms, onClose }) => {
  const questions = useMemo(() => generateQuestions(terms), [terms]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);

  const question = questions[currentQ];
  const total = questions.length;

  const handleSelect = useCallback((idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === question.correctIndex) {
      setScore(s => s + 1);
    }
  }, [answered, question]);

  const handleNext = useCallback(() => {
    if (currentQ + 1 >= total) {
      setFinished(true);
      if (score / total >= 0.7) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }
    } else {
      setCurrentQ(q => q + 1);
      setSelected(null);
      setAnswered(false);
    }
  }, [currentQ, total, score]);

  const handleRestart = useCallback(() => {
    setCurrentQ(0);
    setSelected(null);
    setScore(0);
    setAnswered(false);
    setFinished(false);
  }, []);

  if (questions.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <Brain className="w-12 h-12 text-muted-foreground mx-auto" />
        <p className="text-muted-foreground">Não há termos suficientes para gerar o quiz.</p>
        <Button variant="outline" onClick={onClose}>Voltar</Button>
      </div>
    );
  }

  if (finished) {
    const pct = Math.round((score / total) * 100);
    const grade = pct >= 90 ? 'Doutor da Fé!' : pct >= 70 ? 'Discípulo Fiel!' : pct >= 50 ? 'Peregrino Dedicado' : 'Continue estudando!';
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-3xl p-8 text-center space-y-6 max-w-md mx-auto"
      >
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Trophy className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-foreground mb-1">{grade}</h2>
          <p className="text-muted-foreground text-sm">
            Você acertou <span className="font-bold text-primary">{score}</span> de <span className="font-bold">{total}</span> ({pct}%)
          </p>
        </div>

        {/* Progress ring */}
        <div className="relative w-32 h-32 mx-auto">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" className="stroke-muted/30" />
            <circle
              cx="50" cy="50" r="42" fill="none" strokeWidth="8"
              className="stroke-primary"
              strokeLinecap="round"
              strokeDasharray={`${pct * 2.64} 264`}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-2xl font-black text-primary">{pct}%</span>
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={onClose} className="rounded-2xl gap-2">
            <BookOpen className="w-4 h-4" /> Voltar ao A-Z
          </Button>
          <Button onClick={handleRestart} className="rounded-2xl gap-2 bg-primary text-primary-foreground">
            <RotateCcw className="w-4 h-4" /> Jogar Novamente
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-bold">{currentQ + 1} / {total}</span>
        <span className="font-bold text-primary">{score} acertos</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${((currentQ + 1) / total) * 100}%` }}
          transition={{ type: 'spring', damping: 20 }}
        />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ type: 'spring', damping: 25 }}
          className="space-y-5"
        >
          <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              {question.category}
            </span>
            <h3 className="text-lg font-bold text-foreground leading-snug">
              {question.question}
            </h3>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {question.options.map((opt, idx) => {
              const isCorrect = idx === question.correctIndex;
              const isSelected = idx === selected;
              let classes = 'bg-card border border-border hover:border-primary/40 text-foreground/80';
              if (answered) {
                if (isCorrect) classes = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300';
                else if (isSelected) classes = 'bg-destructive/10 border-destructive/30 text-destructive';
                else classes = 'opacity-50 border-border text-muted-foreground';
              }
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={answered}
                  className={`w-full text-left p-4 rounded-2xl transition-all text-sm font-medium flex items-center gap-3 ${classes}`}
                >
                  <span className="w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-black">
                    {answered && isCorrect ? <Check className="w-4 h-4" /> : answered && isSelected ? <X className="w-4 h-4" /> : String.fromCharCode(65 + idx)}
                  </span>
                  <span className="line-clamp-3">{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Explanation + Next */}
          {answered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  {selected === question.correctIndex ? 'Correto!' : `A resposta certa era sobre "${question.term}"`}
                </p>
                <p className="text-xs text-foreground/70 leading-relaxed line-clamp-4 italic">
                  {question.explanation}
                </p>
              </div>
              <Button
                onClick={handleNext}
                className="w-full rounded-2xl h-12 gap-2 font-bold text-xs uppercase tracking-widest bg-primary text-primary-foreground"
              >
                {currentQ + 1 >= total ? 'Ver Resultado' : 'Próxima'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AZFaithQuiz;
