/**
 * SaintWorkReaderPage — Leitor canônico da Biblioteca Patrística.
 *
 * Rota: /biblioteca/escritos/:autor/:obra/capitulo/:ordem
 * Usa o ReaderShell (Reader Architecture Rule) com EditorialHero e navegação.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  getWorkBySlug,
  getChapter,
  listChapters,
} from '@/services/saintWorksService';
import type { SaintWork, SaintWorkChapter } from '@/types/saintWorks';
import { SAINT_WORK_CATEGORY_LABELS } from '@/types/saintWorks';
import { ReaderShell } from '@/components/reader';
import { EditorialHero } from '@/components/editorial';
import { EditorialCredits } from '@/components/biblioteca/EditorialCredits';
import { Button } from '@/components/ui/button';
import { Icons } from '@/constants';
import { EditorialClosure } from '@/components/reader';
import { resolveEditorialClosure } from '@/lib/editorial/resolveClosure';

type ChapterSummary = Pick<SaintWorkChapter, 'id' | 'order' | 'title' | 'subtitle' | 'reading_minutes'>;

/** Escapa regex e divide o termo em tokens (>=2 chars, sem stopwords triviais). */
function buildHighlightRegex(raw: string): RegExp | null {
  const tokens = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos p/ comparar
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (tokens.length === 0) return null;
  return new RegExp(`(${tokens.join('|')})`, 'gi');
}

/** Percorre nós de texto sob `root` e envolve matches em <mark data-search-hit>. */
function applyHighlight(root: HTMLElement, term: string): number {
  const re = buildHighlightRegex(term);
  if (!re) return 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = (node as Text).parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'MARK') return NodeFilter.FILTER_REJECT;
      return node.nodeValue && node.nodeValue.trim().length > 0
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });
  const targets: Text[] = [];
  let n: Node | null = walker.nextNode();
  while (n) {
    targets.push(n as Text);
    n = walker.nextNode();
  }
  let hits = 0;
  for (const textNode of targets) {
    const text = textNode.nodeValue ?? '';
    // Trabalha em variante sem acento para casar acentuadas também.
    const noAcc = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!re.test(noAcc)) {
      re.lastIndex = 0;
      continue;
    }
    re.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(noAcc)) !== null) {
      const start = m.index;
      const end = start + m[0].length;
      if (start > last) frag.appendChild(document.createTextNode(text.slice(last, start)));
      const mark = document.createElement('mark');
      mark.setAttribute('data-search-hit', '');
      mark.className = 'bg-primary/25 text-foreground rounded-sm px-0.5';
      mark.textContent = text.slice(start, end);
      frag.appendChild(mark);
      last = end;
      hits++;
      if (m.index === re.lastIndex) re.lastIndex++;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    textNode.parentNode?.replaceChild(frag, textNode);
  }
  return hits;
}

const SaintWorkReaderPage: React.FC = () => {
  const { autor, obra, ordem } = useParams<{ autor: string; obra: string; ordem: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlight = searchParams.get('highlight')?.trim() ?? '';
  const articleRef = useRef<HTMLElement | null>(null);
  const currentOrder = Math.max(1, parseInt(ordem ?? '1', 10) || 1);

  const [work, setWork] = useState<SaintWork | null>(null);
  const [chapter, setChapter] = useState<SaintWorkChapter | null>(null);
  const [chapters, setChapters] = useState<ChapterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!autor || !obra) return;
    setLoading(true);
    setNotFound(false);

    (async () => {
      const w = await getWorkBySlug(autor, obra);
      if (!alive) return;
      if (!w) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setWork(w);
      const [ch, chs] = await Promise.all([
        getChapter(w.id, currentOrder),
        listChapters(w.id),
      ]);
      if (!alive) return;
      if (!ch) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setChapter(ch);
      setChapters(chs);
      setLoading(false);
      // Scroll to top on chapter change
      window.scrollTo({ top: 0, behavior: 'auto' });
    })();

    return () => {
      alive = false;
    };
  }, [autor, obra, currentOrder]);

  const { prev, next } = useMemo(() => {
    if (!chapters.length) return { prev: null, next: null };
    const idx = chapters.findIndex((c) => c.order === currentOrder);
    return {
      prev: idx > 0 ? chapters[idx - 1] : null,
      next: idx >= 0 && idx < chapters.length - 1 ? chapters[idx + 1] : null,
    };
  }, [chapters, currentOrder]);

  // Realce dos termos vindos de ?highlight= + scroll até a 1ª ocorrência.
  useEffect(() => {
    if (!chapter || !highlight) return;
    const root = articleRef.current;
    if (!root) return;
    const raf = requestAnimationFrame(() => {
      const hits = applyHighlight(root, highlight);
      if (hits > 0) {
        const first = root.querySelector<HTMLElement>('mark[data-search-hit]');
        first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [chapter, highlight]);

  if (loading) {
    return (
      <section className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando capítulo...</p>
      </section>
    );
  }

  if (notFound || !work || !chapter) {
    return (
      <section className="min-h-screen flex flex-col items-center justify-center gap-spacing-md p-spacing-lg">
        <h2 className="text-premium-lg font-serif">Capítulo não encontrado</h2>
        <Button asChild variant="outline">
          <Link to={`/biblioteca/escritos/${autor}/${obra}`}>Voltar à obra</Link>
        </Button>
      </section>
    );
  }

  const canonicalUrl = `https://cathedradigital.com.br/biblioteca/escritos/${autor}/${obra}/capitulo/${chapter.order}`;

  return (
    <section className="min-h-screen bg-background">
      <Helmet>
        <title>{`${chapter.title} — ${work.title} · Cathedra`}</title>
        <meta
          name="description"
          content={
            chapter.body_plain
              ?.replace(/\s+/g, ' ')
              .slice(0, 155) ??
            `Capítulo ${chapter.order} de ${work.title}.`
          }
        />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <div className="mb-2 px-spacing-md pt-spacing-sm max-w-4xl mx-auto">
        <Link
          to={`/biblioteca/escritos/${autor}/${obra}`}
          className="inline-flex items-center gap-1 text-premium-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <Icons.ArrowLeft className="w-3.5 h-3.5" aria-hidden />
          {work.title}
        </Link>
      </div>

      <ReaderShell
        ariaLabel={`${work.title} — Capítulo ${chapter.order}: ${chapter.title}`}
        hero={
          <EditorialHero
            kicker={`${SAINT_WORK_CATEGORY_LABELS[work.category]} · Capítulo ${chapter.order}`}
            title={chapter.title}
            subtitle={chapter.subtitle ?? undefined}
            size="md"
          />
        }
        continuation={
          <div className="flex flex-col gap-spacing-2xl">
            {(() => {
              const closure = resolveEditorialClosure(chapter as unknown as { editorial_closure?: unknown })
                ?? resolveEditorialClosure(work as unknown as { editorial_closure?: unknown });
              return closure ? <EditorialClosure {...closure} /> : null;
            })()}
            <div className="max-w-[68ch] mx-auto flex items-center justify-between gap-spacing-md">
              {prev ? (
                <Button
                  variant="ghost"
                  onClick={() =>
                    navigate(`/biblioteca/escritos/${autor}/${obra}/capitulo/${prev.order}`)
                  }
                  className="gap-spacing-xs flex-1 justify-start min-w-0"
                >
                  <Icons.ArrowLeft className="w-4 h-4 flex-shrink-0" aria-hidden />
                  <span className="flex flex-col items-start min-w-0">
                    <span className="text-premium-xs uppercase text-muted-foreground">
                      Anterior
                    </span>
                    <span className="text-premium-sm truncate max-w-[16ch] md:max-w-none">
                      {prev.title}
                    </span>
                  </span>
                </Button>
              ) : (
                <span aria-hidden />
              )}
              {next ? (
                <Button
                  onClick={() =>
                    navigate(`/biblioteca/escritos/${autor}/${obra}/capitulo/${next.order}`)
                  }
                  className="gap-spacing-xs flex-1 justify-end min-w-0"
                >
                  <span className="flex flex-col items-end min-w-0">
                    <span className="text-premium-xs uppercase opacity-80">Próximo</span>
                    <span className="text-premium-sm truncate max-w-[16ch] md:max-w-none">
                      {next.title}
                    </span>
                  </span>
                  <Icons.ArrowRight className="w-4 h-4 flex-shrink-0" aria-hidden />
                </Button>
              ) : (
                <Link
                  to={`/biblioteca/escritos/${autor}/${obra}`}
                  className="ml-auto text-premium-xs text-primary hover:underline"
                >
                  Fim da obra · Voltar ao sumário
                </Link>
              )}
            </div>
          </div>
        }
      >
        <article
          ref={articleRef}
          className="prose prose-lg dark:prose-invert max-w-none font-serif leading-relaxed"
          dangerouslySetInnerHTML={{ __html: chapter.body_html }}
        />
        <div className="max-w-[68ch] mx-auto">
          <EditorialCredits
            isPublicDomain={work.is_public_domain}
            license={work.license}
            translationCredit={work.translation_credit}
            sourceUrl={work.source_url}
            compact
          />
        </div>
      </ReaderShell>
    </section>
  );
};

export default SaintWorkReaderPage;
