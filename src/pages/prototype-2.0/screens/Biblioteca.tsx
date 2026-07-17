import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PrototypeShell from '../PrototypeShell';
import { ChevronRight } from 'lucide-react';

const BASE = '/prototype-2.0';

const TEMAS = [
  { slug: 'perdao', nome: 'Perdão', fontes: 6 },
  { slug: 'videira', nome: 'Videira', fontes: 6 },
  { slug: 'cruz', nome: 'Cruz', fontes: 6 },
  { slug: 'reino', nome: 'Reino', fontes: 5 },
];

const Biblioteca: React.FC = () => {
  const [tab, setTab] = useState<'tema' | 'fonte' | 'testemunhos'>('tema');

  return (
    <PrototypeShell title="Estudar" back={`${BASE}/atrio`}>
      {/* Abas */}
      <div className="flex gap-1 border-b border-border -mx-4 px-4 mb-4">
        {[
          { id: 'tema', label: 'Por Tema' },
          { id: 'fonte', label: 'Por Fonte' },
          { id: 'testemunhos', label: 'Testemunhos' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-3 py-2 text-sm border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'tema' && (
        <>
          <input
            type="search"
            placeholder="estudar…"
            className="w-full bg-muted/50 border border-border rounded px-3 py-2 text-sm mb-6"
          />

          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
            Em destaque hoje (Tempo Comum)
          </p>
          <div className="grid grid-cols-2 gap-3">
            {TEMAS.map((t) => (
              <Link
                key={t.slug}
                to={`${BASE}/estudar/tema/${t.slug}`}
                className="border border-border rounded-md p-4 hover:border-primary hover:bg-muted/30"
              >
                <div className="font-serif text-lg">{t.nome}</div>
                <div className="text-xs text-muted-foreground mt-1">{t.fontes} fontes</div>
              </Link>
            ))}
          </div>

          <div className="text-center my-6 text-xs text-muted-foreground">— ou —</div>

          <ul className="border border-border rounded divide-y divide-border">
            <li>
              <button onClick={() => setTab('fonte')} className="w-full flex items-center justify-between p-3 text-sm hover:bg-muted/40">
                Explorar por Fonte <ChevronRight size={16} />
              </button>
            </li>
            <li>
              <button onClick={() => setTab('testemunhos')} className="w-full flex items-center justify-between p-3 text-sm hover:bg-muted/40">
                Testemunhos <ChevronRight size={16} />
              </button>
            </li>
            <li>
              <Link to={`${BASE}/estudar/verbete`} className="flex items-center justify-between p-3 text-sm hover:bg-muted/40">
                Verbete (A–Z) <ChevronRight size={16} />
              </Link>
            </li>
          </ul>
        </>
      )}

      {tab === 'fonte' && (
        <ul className="border border-border rounded divide-y divide-border">
          {[
            { label: 'Bíblia', to: `${BASE}/leitor?ref=jo15` },
            { label: 'Catecismo', to: `${BASE}/leitor?ref=cic1234` },
            { label: 'Magistério', to: `${BASE}/leitor?ref=mag1` },
            { label: 'Código Canônico', to: `${BASE}/leitor?ref=can204` },
            { label: 'Padres da Igreja', to: `${BASE}/leitor?ref=padres1` },
            { label: 'Concílios', to: `${BASE}/leitor?ref=trento14` },
            { label: 'Suma Teológica', to: `${BASE}/leitor?ref=st3q8` },
          ].map((f) => (
            <li key={f.label}>
              <Link to={f.to} className="flex items-center justify-between p-3 text-sm hover:bg-muted/40">
                {f.label} <ChevronRight size={16} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {tab === 'testemunhos' && (
        <ul className="border border-border rounded divide-y divide-border">
          {['Santos', 'Papas', 'Aparições marianas'].map((t) => (
            <li key={t}>
              <Link to={`${BASE}/estudar/testemunhos`} className="flex items-center justify-between p-3 text-sm hover:bg-muted/40">
                {t} <ChevronRight size={16} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PrototypeShell>
  );
};

export default Biblioteca;
