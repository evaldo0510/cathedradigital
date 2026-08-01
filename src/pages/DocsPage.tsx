/**
 * Portal de Documentação — índice com busca, localizado por idioma da URL.
 * O conteúdo vem de `src/content/docs` (pt, en, es, it, la).
 */
import React, { useMemo, useState, useId } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Search, BookOpen, ArrowRight, Languages } from 'lucide-react';
import { useLang } from '@/hooks/useLang';
import { Input } from '@/components/ui/input';
import { getDocsBundle, searchDocsDetailed, type DocCategory, type DocSearchResult } from '@/content/docs';
import { highlightText } from '@/lib/highlightText';

const CATEGORY_ORDER: DocCategory[] = ['inicio', 'leitura', 'oracao', 'estudo'];

export default function DocsPage() {
  const { lang } = useLang();
  const bundle = useMemo(() => getDocsBundle(lang), [lang]);
  const [query, setQuery] = useState('');
  const searchId = useId();

  const results = useMemo(() => searchDocsDetailed(lang, query), [lang, query]);
  const grouped = useMemo(() => {
    const map = new Map<DocCategory, DocSearchResult[]>();
    for (const result of results) {
      map.set(result.guide.category, [...(map.get(result.guide.category) ?? []), result]);
    }
    return map;
  }, [results]);


  return (
    <>
      <Helmet>
        <title>{`${bundle.ui.portalTitle} · Cathedra`}</title>
        <meta name="description" content={bundle.ui.portalSubtitle} />
      </Helmet>

      <section className="mx-auto max-w-4xl px-4 py-10">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Cathedra</p>
          <h1 className="mt-1 font-display text-3xl font-black tracking-tight text-foreground">
            {bundle.ui.portalTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{bundle.ui.portalSubtitle}</p>
        </header>

        <div className="relative mb-8">
          <label htmlFor={searchId} className="sr-only">
            {bundle.ui.searchLabel}
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={bundle.ui.searchPlaceholder}
            className="pl-9"
          />
          <p aria-live="polite" className="mt-2 text-xs text-muted-foreground">
            {bundle.ui.resultsCount(results.length)}
          </p>
        </div>

        {results.length === 0 ? (
          <p className="rounded-lg border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
            {bundle.ui.empty}
          </p>
        ) : (
          <div className="space-y-10">
            {CATEGORY_ORDER.filter((c) => grouped.has(c)).map((category) => (
              <section key={category}>
                <h2 className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
                  {bundle.categories[category]}
                </h2>
                <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {grouped.get(category)!.map(({ guide, snippet }) => (
                    <li key={guide.slug}>
                      <Link
                        to={`/docs/${guide.slug}`}
                        className="group flex h-full flex-col rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/40"
                      >
                        <span className="flex items-center gap-2 font-display text-base font-bold text-foreground">
                          <BookOpen aria-hidden="true" className="h-4 w-4 text-primary" />
                          {highlightText(guide.title, query)}
                        </span>
                        <span className="mt-2 flex-1 text-sm text-muted-foreground">
                          {highlightText(guide.summary, query)}
                        </span>
                        {snippet && (
                          <span className="mt-2 border-l-2 border-border pl-3 text-xs italic text-muted-foreground">
                            {highlightText(snippet, query)}
                          </span>
                        )}
                        {guide.fallbackFrom && bundle.ui.translationNotice && (
                          <span className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Languages aria-hidden="true" className="h-3 w-3" />
                            {bundle.ui.translationNotice}
                          </span>
                        )}
                        <ArrowRight
                          aria-hidden="true"
                          className="mt-3 h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5"
                        />
                      </Link>
                    </li>
                  ))}

                </ul>
              </section>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
