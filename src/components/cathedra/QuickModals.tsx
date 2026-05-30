import { Button } from '@/components/ui/button';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../constants';
import { AppRoute } from '../../types';
import { supabase } from '@/integrations/supabase/client';
import { useCatechismParagraph } from '@/hooks/useCatechismParagraph';


interface QuickModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Bible Modal ───
export const BibleModal: React.FC<QuickModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [book, setBook] = useState('Gn');
  const [chapter, setChapter] = useState(1);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const BOOKS = [
    'Gn','Ex','Lv','Nm','Dt','Js','Jz','Rt','1Sm','2Sm','1Rs','2Rs','1Cr','2Cr',
    'Esd','Ne','Tb','Jt','Est','1Mc','2Mc','Jó','Sl','Pr','Ecl','Ct','Sb','Eclo',
    'Is','Jr','Lm','Br','Ez','Dn','Os','Jl','Am','Ab','Jn','Mq','Na','Hab','Sf','Ag','Zc','Ml',
    'Mt','Mc','Lc','Jo','At','Rm','1Cor','2Cor','Gl','Ef','Fl','Cl','1Ts','2Ts',
    '1Tm','2Tm','Tt','Fm','Hb','Tg','1Pd','2Pd','1Jo','2Jo','3Jo','Jd','Ap',
  ];

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setText('');
    supabase.functions.invoke('bible-text', { body: { book, chapter } })
      .then(({ data, error }) => {
        setText(error ? 'Erro ao carregar.' : data?.text || 'Texto não disponível.');
        setLoading(false);
      });
  }, [isOpen, book, chapter]);

  if (!isOpen) return null;

  return (
    <ModalShell title="Bíblia — Consulta Rápida" onClose={onClose}>
      <div className="flex gap-spacing-xs mb-spacing-md">
        <select 
          value={book} 
          onChange={e => { setBook(e.target.value); setChapter(1); }}
          className="px-spacing-sm py-spacing-xs rounded-premium-full border border-border bg-card text-foreground text-premium-sm focus:ring-2 focus:ring-primary outline-none"
          aria-label="Selecionar livro da Bíblia"
        >
          {BOOKS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <input 
          type="number" 
          min={1} 
          max={150} 
          value={chapter} 
          onChange={e => setChapter(Number(e.target.value))}
          className="w-spacing-3xl px-spacing-sm py-spacing-xs rounded-premium-full border border-border bg-card text-foreground text-premium-sm text-center focus:ring-2 focus:ring-primary outline-none" 
          aria-label="Número do capítulo"
        />

      </div>
      {loading ? <LoadingSkeleton /> : (
        <div className="max-h-[50vh] overflow-y-auto pr-spacing-xs custom-scrollbar">
          <p className="font-serif text-foreground/90 leading-relaxed whitespace-pre-line text-premium-sm">{text}</p>
        </div>
      )}
      <div className="mt-spacing-lg pt-spacing-md border-t border-border">
        <Button 
          onClick={() => { navigate(`${AppRoute.BIBLE}?book=${book}&ch=${chapter}`); onClose(); }}
          className="w-full py-spacing-sm bg-primary text-primary-foreground rounded-premium-full text-premium-xs font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-spacing-xs"
        >
          <Icons.Book className="w-spacing-sm h-spacing-sm" />
          Ir para a Bíblia Completa
        </Button>
      </div>
    </ModalShell>
  );
};

// ─── Catechism Modal ───
export const CatechismModal: React.FC<QuickModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [paragraph, setParagraph] = useState(1);
  const { data, isLoading, isError } = useCatechismParagraph(paragraph);

  if (!isOpen) return null;


  return (
    <ModalShell title="Catecismo — Consulta Rápida" onClose={onClose}>
      <div className="flex items-center gap-spacing-sm mb-spacing-md">
        <span className="text-primary font-bold">§</span>
        <input 
          type="number" 
          min={1} 
          max={2865} 
          value={paragraph} 
          onChange={e => setParagraph(Number(e.target.value))}
          className="w-spacing-4xl px-spacing-sm py-spacing-xs rounded-premium-full border border-border bg-card text-foreground text-premium-sm text-center focus:ring-2 focus:ring-primary outline-none" 
          aria-label="Número do parágrafo do Catecismo"
        />
        <div className="flex gap-spacing-2xs">
          <Button 
            onClick={() => setParagraph(Math.max(1, paragraph - 1))} 
            className="px-spacing-xs py-spacing-2xs rounded-premium-full border border-border text-premium-xs focus-visible:ring-2 focus-visible:ring-primary outline-none hover:bg-muted"
            aria-label="Parágrafo anterior"
          >
            ←
          </Button>
          <Button 
            onClick={() => setParagraph(Math.min(2865, paragraph + 1))} 
            className="px-spacing-xs py-spacing-2xs rounded-premium-full border border-border text-premium-xs focus-visible:ring-2 focus-visible:ring-primary outline-none hover:bg-muted"
            aria-label="Próximo parágrafo"
          >
            →
          </Button>
        </div>

      </div>
      {isLoading ? <LoadingSkeleton /> : (
        <div className="max-h-[50vh] overflow-y-auto pr-spacing-xs custom-scrollbar">
          <p className="font-serif text-foreground/90 leading-relaxed text-premium-sm">
            {isError ? 'Erro ao carregar o parágrafo.' : data?.content}
          </p>
        </div>
      )}
      <div className="mt-spacing-lg pt-spacing-md border-t border-border">
        <Button 
          onClick={() => { navigate(`${AppRoute.CATECHISM}?p=${paragraph}`); onClose(); }}
          className="w-full py-spacing-sm bg-primary text-primary-foreground rounded-premium-full text-premium-xs font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-spacing-xs"
        >
          <Icons.Cross className="w-spacing-sm h-spacing-sm" />
          Ir para o Catecismo Completo
        </Button>
      </div>
    </ModalShell>
  );
};

// ─── Documents Modal ───
export const DocumentsModal: React.FC<QuickModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const DOCS = [
    { title: 'Lumen Gentium', author: 'Vaticano II', year: 1964 },
    { title: 'Dei Verbum', author: 'Vaticano II', year: 1965 },
    { title: 'Gaudium et Spes', author: 'Vaticano II', year: 1965 },
    { title: 'Laudato Si\'', author: 'Francisco', year: 2015 },
    { title: 'Fratelli Tutti', author: 'Francisco', year: 2020 },
    { title: 'Deus Caritas Est', author: 'Bento XVI', year: 2005 },
    { title: 'Veritatis Splendor', author: 'João Paulo II', year: 1993 },
    { title: 'Evangelium Vitae', author: 'João Paulo II', year: 1995 },
    { title: 'Fides et Ratio', author: 'João Paulo II', year: 1998 },
    { title: 'Rerum Novarum', author: 'Leão XIII', year: 1891 },
  ];

  const filtered = query
    ? DOCS.filter(d => d.title.toLowerCase().includes(query.toLowerCase()) || d.author.toLowerCase().includes(query.toLowerCase()))
    : DOCS;

  if (!isOpen) return null;

  return (
    <ModalShell title="Documentos — Consulta Rápida" onClose={onClose}>
      <div className="relative mb-spacing-md">
        <Icons.Search className="absolute left-spacing-sm top-spacing-2xs/2 -translate-y-1/2 w-spacing-md h-spacing-md text-muted-foreground" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar documento..."
          className="w-full pl-spacing-xl pr-spacing-md py-spacing-xs rounded-premium-full border border-border bg-card text-foreground text-premium-sm focus:outline-none" />
      </div>
      <div className="max-h-[50vh] overflow-y-auto space-y-spacing-2xs">
        {filtered.map(d => (
          <div key={d.title} className="flex items-center justify-between p-spacing-sm rounded-premium hover:bg-muted transition-colors">
            <div>
              <p className="text-premium-sm font-semibold text-foreground">{d.title}</p>
              <p className="text-premium-xs text-muted-foreground">{d.author} • {d.year}</p>
            </div>
            <span className="text-premium-xs text-primary font-bold">→ Magistério</span>
          </div>
        ))}
      </div>
      <div className="mt-spacing-lg pt-spacing-md border-t border-border">
        <Button 
          onClick={() => { navigate(AppRoute.MAGISTERIUM); onClose(); }}
          className="w-full py-spacing-sm bg-primary text-primary-foreground rounded-premium-full text-premium-xs font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-spacing-xs"
        >
          <Icons.Globe className="w-spacing-sm h-spacing-sm" />
          Ver Todos os Documentos
        </Button>
      </div>
    </ModalShell>
  );
};

// ─── Shared Shell ───
const ModalShell: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-[180] flex items-center justify-center p-spacing-md" 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="modal-title"
    >
      <div className="absolute inset-0 bg-black/60 " onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-spacing-lg bg-card border border-border rounded-premium shadow-premium-hover p-spacing-lg overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-spacing-md">
          <h3 id="modal-title" className="text-premium-sm font-black uppercase tracking-widest text-primary">{title}</h3>
          <Button 
            onClick={onClose} 
            className="p-spacing-2xs rounded-premium-full hover:bg-muted text-muted-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none"
            aria-label="Fechar modal"
          >
            <Icons.X className="w-spacing-md h-spacing-md" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
};


const LoadingSkeleton = () => (
  <div className="space-y-spacing-sm py-spacing-md">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="h-spacing-md bg-muted rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
    ))}
  </div>
);
