import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';

const BASE = '/prototype-2.0';

interface Hit { fonte: string; ref: string; excerpt: string; leitor: string; nexus?: boolean }

const CORPUS: Hit[] = [
  { fonte: 'Bíblia', ref: 'Jo 15,1', excerpt: '"Eu sou a videira verdadeira…"', leitor: 'jo15', nexus: true },
  { fonte: 'Bíblia', ref: 'Jo 15,5', excerpt: '"… sem mim nada podeis fazer."', leitor: 'jo15' },
  { fonte: 'Bíblia', ref: 'Sl 80,9', excerpt: '"Do Egito trouxeste uma videira…"', leitor: 'sl23' },
  { fonte: 'Catecismo', ref: '§755', excerpt: 'A Igreja é a videira mística escolhida por Deus.', leitor: 'cic1234', nexus: true },
  { fonte: 'Catecismo', ref: '§787', excerpt: 'Comunhão íntima entre Cristo e os discípulos.', leitor: 'cic1234' },
  { fonte: 'Padres', ref: 'Agostinho · Tract. 81', excerpt: 'Sobre a videira e os ramos…', leitor: 'jo15', nexus: true },
  { fonte: 'Padres', ref: 'Cirilo Alex. · Comm. Jo', excerpt: 'Comentário ao capítulo 15.', leitor: 'jo15' },
  { fonte: 'Magistério', ref: 'Lumen Gentium 6', excerpt: 'Imagens da Igreja: videira, rebanho, edificação.', leitor: 'jo15' },
  { fonte: 'Orações', ref: 'Oração pelo aumento da fé', excerpt: '…', leitor: 'laudes' },
  { fonte: 'Jornadas', ref: 'Introdução à Fé', excerpt: '14 dias · Credo, sacramentos, moral.', leitor: 'jo15' },
];

const Pesquisa: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? 'videira');

  const back = (location.state as any)?.from ?? `${BASE}/atrio`;

  const results = useMemo(() => {
    if (q.trim().length < 2) return [];
    const needle = q.toLowerCase();
    return CORPUS.filter(
      (h) => h.ref.toLowerCase().includes(needle) || h.excerpt.toLowerCase().includes(needle) || h.fonte.toLowerCase().includes(needle),
    );
  }, [q]);

  const grouped = useMemo(() => {
    const g: Record<string, Hit[]> = {};
    for (const h of results) (g[h.fonte] ||= []).push(h);
    return g;
  }, [results]);

  const totalFontes = ['Bíblia', 'Catecismo', 'Padres', 'Magistério', 'Cânon', 'Orações', 'Jornadas'];

  return (
    <div className="min-h-dvh bg-background/95 backdrop-blur text-foreground max-w-2xl mx-auto px-4 py-4">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') navigate(back);
            if (e.key === 'Enter' && results[0]) navigate(`${BASE}/leitor?ref=${results[0].leitor}`);
          }}
          placeholder="Buscar em tudo…"
          className="flex-1 bg-transparent outline-none text-lg font-serif"
        />
        <button onClick={() => navigate(back)} aria-label="Fechar" className="p-1.5 rounded hover:bg-muted">
          <X size={18} />
        </button>
      </div>

      {q.trim().length < 2 ? (
        <div className="mt-6">
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">
            Sugestões de sintaxe
          </p>
          <ul className="text-sm space-y-2 font-mono">
            <li><button onClick={() => setQ('jo 15')} className="hover:text-primary">jo 15 → João 15</button></li>
            <li><button onClick={() => setQ('cic 1234')} className="hover:text-primary">cic 1234 → CIC §1234</button></li>
            <li><button onClick={() => setQ('cân 204')} className="hover:text-primary">cân 204 → Cânon 204</button></li>
          </ul>
        </div>
      ) : (
        <div className="mt-4">
          {totalFontes.map((fonte) => {
            const hits = grouped[fonte] ?? [];
            return (
              <section key={fonte} className="mb-5">
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
                  {fonte} ({hits.length})
                </p>
                {hits.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Sem resultados nesta fonte.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {hits.map((h, i) => (
                      <li key={i}>
                        <Link
                          to={`${BASE}/leitor?ref=${h.leitor}`}
                          className="block p-2 -mx-2 rounded hover:bg-muted/50"
                        >
                          <span className="text-sm font-medium">▸ {h.ref}</span>
                          {h.nexus && <span className="ml-1 text-primary text-xs">°</span>}
                          <span className="block text-xs text-muted-foreground truncate">{h.excerpt}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      <div className="sticky bottom-0 -mx-4 px-4 py-2 border-t border-border bg-background/95 text-xs text-muted-foreground flex gap-2">
        Filtros:
        <button className="px-2 py-0.5 border border-border rounded">Tempo</button>
        <button className="px-2 py-0.5 border border-border rounded">Fonte</button>
        <button className="px-2 py-0.5 border border-border rounded">PT</button>
      </div>
    </div>
  );
};

export default Pesquisa;
