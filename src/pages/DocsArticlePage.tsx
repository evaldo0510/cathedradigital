/**
 * Portal de Documentação — guia individual (`/docs/:slug`), localizado.
 */
import React, { useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLang } from '@/hooks/useLang';
import { getDocsBundle, getDocGuide } from '@/content/docs';
import { recordDocView } from '@/lib/docsPopularity';


function slugifyHeading(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function DocsArticlePage() {
  const { slug = '' } = useParams();
  const { lang } = useLang();
  const bundle = useMemo(() => getDocsBundle(lang), [lang]);
  const guide = useMemo(() => getDocGuide(lang, slug), [lang, slug]);

  // Popularidade local alimenta o desempate da busca do portal.
  useEffect(() => {
    if (guide) recordDocView(guide.slug);
  }, [guide]);

  if (!guide) return <Navigate to="/docs" replace />;


  return (
    <>
      <Helmet>
        <title>{`${guide.title} · ${bundle.ui.portalTitle} · Cathedra`}</title>
        <meta name="description" content={guide.summary} />
      </Helmet>

      <section className="mx-auto max-w-3xl px-4 py-10">
        <Link
          to="/docs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          {bundle.ui.back}
        </Link>

        <header className="mt-6 mb-8 border-b border-border pb-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {bundle.categories[guide.category]}
          </p>
          <h1 className="mt-1 font-display text-3xl font-black tracking-tight text-foreground">{guide.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{guide.summary}</p>
        </header>

        <nav aria-label={bundle.ui.onThisPage} className="mb-8 rounded-lg border border-border bg-muted/30 p-4">
          <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">{bundle.ui.onThisPage}</p>
          <ul className="space-y-1">
            {guide.sections.map((section) => (
              <li key={section.heading}>
                <a href={`#${slugifyHeading(section.heading)}`} className="text-sm text-primary hover:underline">
                  {section.heading}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-8">
          {guide.sections.map((section) => (
            <section key={section.heading} id={slugifyHeading(section.heading)}>
              <h2 className="font-display text-xl font-bold text-foreground">{section.heading}</h2>
              {section.body.map((paragraph, i) => (
                <p key={i} className="mt-3 text-base leading-relaxed text-foreground/85">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
