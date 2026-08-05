import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { EditorialHero } from '@/components/editorial';
import { Button } from '@/components/ui/button';
import { Icons } from '@/constants';
import { globalSearchV2, type GlobalSearchHit, type SearchResultType } from '@/services/globalSearchService';
import { Link } from 'react-router-dom';

const TYPE_LABEL: Record<SearchResultType, string> = {
  bible: 'Bíblia',
  catechism: 'Catecismo',
  saint: 'Santo',
  patristic: 'Patrística',
  magisterium: 'Magistério',
  prayer: 'Oração',
  journey: 'Jornada',
  glossary: 'Glossário'
};

const TYPE_ICON: Record<SearchResultType, any> = {
  bible: Icons.BookOpen,
  catechism: Icons.Book,
  saint: Icons.User,
  patristic: Icons.ScrollText,
  magisterium: Icons.Globe,
  prayer: Icons.Hand,
  journey: Icons.Route,
  glossary: Icons.BookMarked
};

const TYPE_ROUTE: Record<SearchResultType, (hit: GlobalSearchHit) => string> = {
  bible: (h) => `/biblia/${h.slug}`,
  catechism: (h) => `/catecismo/${h.slug}`,
  saint: (h) => `/santos/${h.slug}`,
  patristic: (h) => `/biblioteca/escritos/${h.slug}`,
  magisterium: (h) => `/biblioteca/escritos/${h.slug}`,
  prayer: (h) => `/rezar/${h.slug}`,
  journey: (h) => `/jornadas/${h.slug}`,
  glossary: (h) => `/glossario/${h.slug}`
};

const BibliotecaInteligentePage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const [input, setInput] = useState(q);
  const [hits, setHits] = useState<GlobalSearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    setLoading(true);
    globalSearchV2(q)
      .then(setHits)
      .finally(() => setLoading(false));
  }, [q]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim().length < 2) return;
    setParams({ q: input.trim() });
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{q ? `“${q}” — Biblioteca Inteligente` : 'Biblioteca Inteligente · Cathedra'}</title>
      </Helmet>

      <EditorialHero
        kicker="Cérebro do Cathedra"
        title="Biblioteca Inteligente"
        subtitle="Encontre conexões entre a Bíblia, Tradição e Magistério em um só lugar."
        parchment
        size="md"
      />

      <div className="max-w-4xl mx-auto px-spacing-md py-spacing-xl space-y-spacing-xl">
        <form onSubmit={submit} className="flex gap-spacing-xs">
          <div className="relative flex-1">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ex.: ansiedade, eucaristia, esperança..."
              className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-premium focus:ring-2 focus:ring-primary/50 outline-none text-premium-base"
            />
          </div>
          <Button type="submit" disabled={input.trim().length < 2}>Buscar</Button>
        </form>

        {loading && <p className="text-center text-muted-foreground italic">Consultando o acervo...</p>}

        {!loading && hits.length > 0 && (
          <div className="grid gap-spacing-md">
            {hits.map((hit) => {
              const Icon = TYPE_ICON[hit.item_type] || Icons.Book;
              return (
                <Link
                  key={`${hit.item_type}-${hit.id}`}
                  to={TYPE_ROUTE[hit.item_type](hit)}
                  className="group flex gap-spacing-md p-spacing-md bg-card border border-border rounded-premium hover:border-primary/40 transition-all"
                >
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">
                        {TYPE_LABEL[hit.item_type]}
                      </span>
                      {hit.subtitle && (
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                          · {hit.subtitle}
                        </span>
                      )}
                    </div>
                    <h2 className="text-premium-md font-serif font-bold group-hover:text-primary transition-colors leading-tight">
                      {hit.title}
                    </h2>
                    <p className="text-premium-sm text-muted-foreground line-clamp-2 italic leading-relaxed">
                      {hit.content}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {!loading && q && hits.length === 0 && (
          <div className="text-center py-spacing-2xl">
            <p className="text-muted-foreground italic">
              Nenhuma conexão encontrada para “{q}”. Tente termos mais amplos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BibliotecaInteligentePage;
