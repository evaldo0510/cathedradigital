import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import SacredImage from './SacredImage';
import DeepContentSection from './DeepContentSection';
import { toast } from 'sonner';
import { parseTheologicalReferences } from '@/lib/theologicalRefParser';
import BibleVersePopover from './BibleVersePopover';
import CatechismPopover from './CatechismPopover';

const DOCS = {
  'ge': { name: 'Gaudete et Exsultate', type: 'Exortação Apostólica', year: 2018 },
  'ss': { name: 'Spe Salvi', type: 'Encíclica', year: 2007 },
  'dce': { name: 'Deus Caritas Est', type: 'Encíclica', year: 2005 },
  'lf': { name: 'Lumen Fidei', type: 'Encíclica', year: 2013 },
  'vat2-gs': { name: 'Gaudium et Spes', type: 'Constituição Pastoral', year: 1965 },
  'vat2-lg': { name: 'Lumen Gentium', type: 'Constituição Dogmática', year: 1964 },
  'cv': { name: 'Christus Vivit', type: 'Exortação Apostólica', year: 2019 },
  'ev': { name: 'Evangelium Vitae', type: 'Encíclica', year: 1995 },
  'al': { name: 'Amoris Laetitia', type: 'Exortação Apostólica', year: 2016 },
  'hv': { name: 'Humanae Vitae', type: 'Encíclica', year: 1968 },
};

const getDocName = (id: string) => DOCS[id as keyof typeof DOCS]?.name || 'Documento';
const getDocType = (id: string) => DOCS[id as keyof typeof DOCS]?.type || 'Magistério';

const SPIRITUAL_GUIDANCE = [
  {
    id: 'ansiedade',
    theme: 'Ansiedade',
    icon: <Icons.Activity className="w-5 h-5" />,
    question: 'O que a Igreja diz sobre a ansiedade?',
    magisteriumAnswer: 'A confiança em Deus é o caminho da paz interior. "Não andeis ansiosos" não é um comando vazio — é um convite a entregar o peso ao único que pode carregá-lo.',
    sourceDoc: 'Gaudete et Exsultate §112',
    textoBase: 'Lançai sobre Ele todas as vossas preocupações, porque Ele cuida de vós. (1 Pe 5,7)',
    explicacao: 'A Igreja nos ensina que a ansiedade muitas vezes nasce da ilusão de que temos o controle total sobre nossas vidas. Confiar em Deus não é passividade, mas a sabedoria de fazer a nossa parte e deixar o resultado nas mãos de quem nos ama infinitamente.',
    interpretacaoProfunda: 'No Magistério, a paz não é apenas ausência de problemas, mas a presença de uma Certeza. O Papa Francisco em Gaudete et Exsultate nos lembra que a alegria cristã é acompanhada pelo senso de humor e pela confiança absoluta na Providência Divina.',
    aplicacaoPratica: 'Quando a ansiedade bater, pare por 30 segundos. Respire fundo e diga: "Jesus, eu confio em Vós". Repita isso até que seu coração sinta que o peso não é mais só seu.',
    reflexaoFinal: 'O que aconteceria se eu realmente acreditasse que Deus cuida de mim mais do que eu mesmo?',
    exercicio: 'Escreva em um papel tudo o que te preocupa hoje. Dobre o papel e coloque-o sob um crucifixo ou uma imagem de Maria, simbolizando que você entregou essas questões a Deus.',
    pch: '"Ansiedade é tentar prever…\no que só pode ser vivido."',
    innerQuestion: 'O que você está tentando resolver sem confiar?',
    relatedDocs: ['ge', 'ss', 'vat2-gs'],
  },
  {
    id: 'medo',
    theme: 'Medo',
    icon: <Icons.Sun className="w-5 h-5" />,
    question: 'O que a Igreja diz sobre o medo?',
    magisteriumAnswer: 'O medo é humano, mas não deve governar. A presença de Deus é mais forte que qualquer escuridão. "Não temas, porque eu te resgatei."',
    sourceDoc: 'Spe Salvi §32',
    pch: '"O medo cresce…\nonde a presença é esquecida."',
    innerQuestion: 'Onde você se sente sozinho diante do medo?',
    relatedDocs: ['ss', 'dce', 'lf'],
  },
  {
    id: 'proposito',
    theme: 'Propósito',
    icon: <Icons.Compass className="w-5 h-5" />,
    question: 'Qual é o sentido da minha vida?',
    magisteriumAnswer: 'Cada pessoa tem uma vocação única. A santidade não é privilégio de poucos, mas chamado universal — é encontrar Deus no concreto da vida.',
    sourceDoc: 'Gaudete et Exsultate §14',
    pch: '"Força não é ausência de fraqueza…\né direção apesar dela."',
    innerQuestion: 'O que ainda te move quando tudo pesa?',
    relatedDocs: ['ge', 'vat2-lg', 'cv'],
  },
  {
    id: 'sofrimento',
    theme: 'Sofrimento',
    icon: <Icons.Cross className="w-5 h-5" />,
    question: 'Por que existe sofrimento?',
    magisteriumAnswer: 'O sofrimento, quando unido à cruz de Cristo, tem poder redentor. Não é castigo, mas mistério de amor e transformação.',
    sourceDoc: 'Salvifici Doloris §19',
    pch: '"A dor não veio destruir…\nveio revelar o que ainda é frágil."',
    innerQuestion: 'O que o sofrimento está tentando te ensinar?',
    relatedDocs: ['ss', 'ev', 'vat2-gs'],
  },
  {
    id: 'relacionamentos',
    theme: 'Relacionamentos',
    icon: <Icons.Heart className="w-5 h-5" />,
    question: 'Como amar de verdade?',
    magisteriumAnswer: 'O amor autêntico é dom de si mesmo. Não é posse, é entrega. A família é escola de amor e comunhão.',
    sourceDoc: 'Amoris Laetitia §89',
    pch: '"Amar não é completar o outro…\né caminhar junto sem exigir destino."',
    innerQuestion: 'Você está amando ou controlando?',
    relatedDocs: ['al', 'dce', 'hv'],
  },
];

const Magisterium: React.FC = () => {
  const [selected, setSelected] = useState(SPIRITUAL_GUIDANCE[0]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleSelect = (item: typeof SPIRITUAL_GUIDANCE[0]) => {
    if (selected.id === item.id) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setSelected(item);
      setIsTransitioning(false);
    }, 300);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20 px-4">
      <SEOHead 
        title="Magistério da Igreja" 
        description="Acesse encíclicas, exortações e documentos fundamentais do Magistério da Igreja Católica." 
        path="/magisterium"
      />

      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <Icons.Scroll className="w-4 h-4 text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Magisterium Ecclesiae</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Magistério</h1>
        <p className="text-muted-foreground font-serif italic max-w-lg mx-auto">A voz da Igreja guiando o coração dos fiéis através dos séculos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-3">
          {SPIRITUAL_GUIDANCE.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                selected.id === item.id 
                  ? 'bg-primary text-primary-foreground shadow-lg border-primary' 
                  : 'bg-card border-border hover:border-primary/30'
              }`}
            >
              <div className={`p-2 rounded-xl ${selected.id === item.id ? 'bg-white/20' : 'bg-muted'}`}>
                {item.icon}
              </div>
              <span className="font-bold text-sm">{item.theme}</span>
            </button>
          ))}
        </div>

        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-card border border-border rounded-[2.5rem] p-8 md:p-12 shadow-sm space-y-8"
            >
              <div className="pt-8 border-t border-border/40">
                <DeepContentSection content={{
                  textoBase: selected.textoBase || selected.magisteriumAnswer,
                  explicacao: (selected as any).explicacao || '',
                  interpretacaoProfunda: (selected as any).interpretacaoProfunda || '',
                  aplicacaoPratica: (selected as any).aplicacaoPratica || '',
                  reflexaoFinal: (selected as any).reflexaoFinal || '',
                  exercicio: (selected as any).exercicio || ''
                }} title="Lumen Veritatis" />
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">{selected.question}</h2>
                <p className="text-lg text-muted-foreground leading-relaxed font-serif italic">"{selected.magisteriumAnswer}"</p>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
                  <Icons.Scroll className="w-4 h-4" /> {selected.sourceDoc}
                </div>
              </div>

              <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 space-y-4">
                <p className="text-xl font-serif font-bold text-primary leading-tight">{selected.pch}</p>
                <p className="text-sm font-bold text-foreground">{selected.innerQuestion}</p>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Documentos Relacionados</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selected.relatedDocs.map(docId => (
                    <div key={docId} className="p-4 rounded-xl border border-border bg-muted/30 flex items-center gap-3">
                      <Icons.FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-xs font-bold text-foreground">{getDocName(docId)}</p>
                        <p className="text-[10px] text-muted-foreground">{getDocType(docId)} • {DOCS[docId as keyof typeof DOCS]?.year}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Magisterium;
