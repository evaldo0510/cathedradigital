import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../constants';
import { AppRoute } from '../../types';
import { supabase } from '@/integrations/supabase/client';

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
      <div className="flex gap-2 mb-4">
        <select value={book} onChange={e => { setBook(e.target.value); setChapter(1); }}
          className="px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none">
          {BOOKS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <input type="number" min={1} max={150} value={chapter} onChange={e => setChapter(Number(e.target.value))}
          className="w-20 px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm text-center focus:outline-none" />
      </div>
      {loading ? <LoadingSkeleton /> : (
        <div className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
          <p className="font-serif text-foreground/90 leading-relaxed whitespace-pre-line text-sm">{text}</p>
        </div>
      )}
      <div className="mt-6 pt-4 border-t border-border">
        <button 
          onClick={() => { navigate(`${AppRoute.BIBLE}?book=${book}&ch=${chapter}`); onClose(); }}
          className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <Icons.Book className="w-3.5 h-3.5" />
          Ir para a Bíblia Completa
        </button>
      </div>
    </ModalShell>
  );
};

// ─── Catechism Modal ───
export const CatechismModal: React.FC<QuickModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [paragraph, setParagraph] = useState(1);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setText('');
    supabase.functions.invoke('catechism-text', { body: { paragraph } })
      .then(({ data, error }) => {
        setText(error ? 'Erro ao carregar.' : data?.content || `§${paragraph} — conteúdo não disponível.`);
        setLoading(false);
      });
  }, [isOpen, paragraph]);

  if (!isOpen) return null;

  return (
    <ModalShell title="Catecismo — Consulta Rápida" onClose={onClose}>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-primary font-bold">§</span>
        <input type="number" min={1} max={2865} value={paragraph} onChange={e => setParagraph(Number(e.target.value))}
          className="w-24 px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm text-center focus:outline-none" />
        <div className="flex gap-1">
          <button onClick={() => setParagraph(Math.max(1, paragraph - 1))} className="px-2 py-1 rounded-lg border border-border text-xs">←</button>
          <button onClick={() => setParagraph(Math.min(2865, paragraph + 1))} className="px-2 py-1 rounded-lg border border-border text-xs">→</button>
        </div>
      </div>
      {loading ? <LoadingSkeleton /> : (
        <div className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
          <p className="font-serif text-foreground/90 leading-relaxed text-sm">{text}</p>
        </div>
      )}
    </ModalShell>
  );
};

// ─── Documents Modal ───
export const DocumentsModal: React.FC<QuickModalProps> = ({ isOpen, onClose }) => {
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
      <div className="relative mb-4">
        <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar documento..."
          className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none" />
      </div>
      <div className="max-h-[50vh] overflow-y-auto space-y-1">
        {filtered.map(d => (
          <div key={d.title} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors">
            <div>
              <p className="text-sm font-semibold text-foreground">{d.title}</p>
              <p className="text-[10px] text-muted-foreground">{d.author} • {d.year}</p>
            </div>
            <span className="text-[10px] text-primary font-bold">→ Magistério</span>
          </div>
        ))}
      </div>
    </ModalShell>
  );
};

// ─── Shared Shell ───
const ModalShell: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-[180] flex items-center justify-center p-4" onClick={onClose}>
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
    <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-primary">{title}</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground"><Icons.ArrowDown className="w-4 h-4 rotate-180" /></button>
      </div>
      {children}
    </div>
  </div>
);

const LoadingSkeleton = () => (
  <div className="space-y-3 py-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="h-4 bg-muted rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
    ))}
  </div>
);
