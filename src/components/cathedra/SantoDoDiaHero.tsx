import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Icons } from '../../constants';
import SacredImage from './SacredImage';
import PassageActions from '@/components/shared/PassageActions';
import { Button } from '@/components/ui/button';
import { CATEGORY_LABELS } from './SaintDetail.categories';
import { type Saint } from '@/data/saints';
import { parseTheologicalReferences } from '@/lib/theologicalRefParser';
import BibleVersePopover from './BibleVersePopover';
import CatechismPopover from './CatechismPopover';

interface SantoDoDiaHeroProps {
  saint: Saint;
  date: Date;
  onOpen: (reflect?: boolean) => void;
}

type SectionKey = 'frase' | 'vida' | 'legado' | 'meditacao';

/**
 * Extrai o século (ex.: "Séc. IV", "Séc. XIX–XX") a partir de campos textuais
 * de nascimento/falecimento. Aceita anos livres em qualquer lugar do texto.
 * Fallback: "—".
 */
function extractCentury(born?: string, died?: string): string {
  const toRoman = (n: number) => {
    const map: Array<[number, string]> = [
      [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
      [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
      [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
    ];
    let out = '';
    for (const [v, s] of map) { while (n >= v) { out += s; n -= v; } }
    return out;
  };
  const centuryOf = (year: number) => Math.ceil(Math.abs(year) / 100);
  const pickYear = (raw?: string): number | null => {
    if (!raw) return null;
    const m = raw.match(/-?\d{1,4}/);
    if (!m) return null;
    const y = parseInt(m[0], 10);
    return Number.isFinite(y) ? y : null;
  };
  const b = pickYear(born);
  const d = pickYear(died);
  if (!b && !d) return '—';
  if (b && d) {
    const cb = centuryOf(b);
    const cd = centuryOf(d);
    return cb === cd ? `Séc. ${toRoman(cb)}` : `Séc. ${toRoman(cb)}–${toRoman(cd)}`;
  }
  const y = (b ?? d)!;
  return `Séc. ${toRoman(centuryOf(y))}`;
}

const FICHA_FALLBACK = {
  virtude: 'Santidade',
  padroado: 'Testemunho universal',
  legado: 'Sua vida permanece como memória viva da Igreja, iluminando gerações que buscam a santidade no cotidiano.',
  meditacao:
    'Que a intercessão deste servo de Deus nos ensine a converter o ordinário em oferta, e a reconhecer que a santidade é a única grandeza que permanece.',
};

const renderWithRefs = (text: string, keyPrefix: string) =>
  parseTheologicalReferences(text).map((seg, i) => {
    if (seg.type === 'bibleRef')
      return (
        <BibleVersePopover
          key={`${keyPrefix}-${i}`}
          abbr={seg.abbr!}
          chapter={seg.chapter!}
          verse={seg.verse}
          label={seg.value}
        />
      );
    if (seg.type === 'catechismRef')
      return <CatechismPopover key={`${keyPrefix}-${i}`} paragraph={seg.paragraph!} />;
    return <span key={`${keyPrefix}-${i}`}>{seg.value}</span>;
  });

const SantoDoDiaHero: React.FC<SantoDoDiaHeroProps> = ({ saint, date, onOpen }) => {
  const navigate = useNavigate();
  const dateLabel = useMemo(
    () => format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR }),
    [date],
  );

  const categoria = CATEGORY_LABELS[saint.category] || 'Testemunha da Fé';
  const virtude = saint.virtues?.[0] || FICHA_FALLBACK.virtude;
  const padroado = saint.patronOf?.[0] || FICHA_FALLBACK.padroado;
  const seculo = extractCentury(saint.born, saint.died);
  const feast =
    saint.feastDay || format(date, "d 'de' MMMM", { locale: ptBR });

  // Blocos editoriais com fallback: Vida (bio/fullBio), Legado (patronOf/virtues),
  // Meditação (aplicacaoPratica) e Frase (quotes[0]).
  const vida = saint.fullBio || saint.bio || FICHA_FALLBACK.legado;
  const legado =
    (saint.patronOf && saint.patronOf.length > 0
      ? `Padroeiro(a) de ${saint.patronOf.slice(0, 3).join(', ')}. `
      : '') +
    (saint.virtues && saint.virtues.length > 0
      ? `Reconhecido(a) pela testemunha em ${saint.virtues.slice(0, 3).join(', ')}.`
      : FICHA_FALLBACK.legado);
  const meditacao = (saint as any).aplicacaoPratica || FICHA_FALLBACK.meditacao;
  const frase = saint.quotes?.[0];

  const [expanded, setExpanded] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const sectionRefs = useRef<Record<SectionKey, HTMLElement | null>>({
    frase: null,
    vida: null,
    legado: null,
    meditacao: null,
  });

  const toggleExpanded = useCallback(() => {
    // Preserva a rolagem: mantém a distância do topo do artigo à viewport.
    const el = articleRef.current;
    const before = el?.getBoundingClientRect().top ?? 0;
    setExpanded((prev) => {
      const next = !prev;
      requestAnimationFrame(() => {
        const after = articleRef.current?.getBoundingClientRect().top ?? 0;
        const delta = after - before;
        if (delta !== 0) window.scrollBy({ top: delta, left: 0, behavior: 'auto' });
      });
      return next;
    });
  }, []);

  const scrollToSection = useCallback(
    (key: SectionKey) => {
      const jump = () => {
        const node = sectionRefs.current[key];
        if (!node) return;
        const y = node.getBoundingClientRect().top + window.scrollY - 96;
        window.scrollTo({ top: y, behavior: 'smooth' });
        // Foco acessível sem re-scroll do browser.
        node.setAttribute('tabindex', '-1');
        (node as HTMLElement).focus({ preventScroll: true });
      };
      if (!expanded) {
        setExpanded(true);
        requestAnimationFrame(() => requestAnimationFrame(jump));
      } else {
        jump();
      }
    },
    [expanded],
  );

  const sectionNav: Array<{ key: SectionKey; label: string; enabled: boolean; controls: string }> = [
    { key: 'frase', label: 'Frase', enabled: Boolean(frase), controls: 'santo-do-dia-frase' },
    { key: 'vida', label: 'Vida', enabled: true, controls: 'santo-do-dia-vida' },
    { key: 'legado', label: 'Legado', enabled: true, controls: 'santo-do-dia-legado' },
    { key: 'meditacao', label: 'Meditação', enabled: true, controls: 'santo-do-dia-meditacao' },
  ];

  return (
    <motion.article
      ref={articleRef as any}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden border border-secondary/30 bg-card shadow-premium-hover"
      aria-labelledby="santo-do-dia-title"
    >
      {/* Molduras editoriais douradas nos cantos (Pergaminho Sacro) */}
      <span aria-hidden="true" className="pointer-events-none absolute top-spacing-2xs left-spacing-2xs sm:top-spacing-sm sm:left-spacing-sm w-spacing-md h-spacing-md sm:w-spacing-xl sm:h-spacing-xl border-t-2 border-l-2 border-secondary/50 z-20" />
      <span aria-hidden="true" className="pointer-events-none absolute top-spacing-2xs right-spacing-2xs sm:top-spacing-sm sm:right-spacing-sm w-spacing-md h-spacing-md sm:w-spacing-xl sm:h-spacing-xl border-t-2 border-r-2 border-secondary/50 z-20" />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-spacing-2xs left-spacing-2xs sm:bottom-spacing-sm sm:left-spacing-sm w-spacing-md h-spacing-md sm:w-spacing-xl sm:h-spacing-xl border-b-2 border-l-2 border-secondary/50 z-20" />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-spacing-2xs right-spacing-2xs sm:bottom-spacing-sm sm:right-spacing-sm w-spacing-md h-spacing-md sm:w-spacing-xl sm:h-spacing-xl border-b-2 border-r-2 border-secondary/50 z-20" />
      {/* Hero — imagem + overlay editorial */}
      <div className="relative">
        <div className="relative h-[38vh] min-h-[320px] md:h-[52vh] md:min-h-[420px] w-full overflow-hidden">
          <SacredImage
            src={saint.image}
            alt={saint.name}
            category={(saint as any).category}
            className="w-full h-full object-cover"
            priority={true}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-transparent" />
        </div>

        <div className="absolute inset-x-0 bottom-0 p-spacing-md sm:p-spacing-lg md:p-spacing-2xl">

          <div className="max-w-3xl space-y-spacing-sm">
            <p className="text-premium-xs font-black uppercase tracking-[0.24em] sm:tracking-[0.28em] text-secondary line-clamp-2">
              Sanctorum · Santo do Dia · {dateLabel}
            </p>
            <h2
              id="santo-do-dia-title"
              className="font-serif font-bold text-foreground text-premium-2xl sm:text-premium-3xl md:text-premium-4xl leading-[1.1] md:leading-[1.05] break-words line-clamp-3"
            >
              {saint.name}
            </h2>
            {saint.title && (
              <p className="font-serif italic text-primary text-premium-base sm:text-premium-lg md:text-premium-xl leading-snug break-words line-clamp-2">
                {saint.title}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-spacing-2xs pt-spacing-xs">
              <span className="px-spacing-sm py-spacing-2xs rounded-premium-full bg-primary text-primary-foreground text-premium-xs font-black uppercase tracking-widest">
                {categoria}
              </span>
              <span className="px-spacing-sm py-spacing-2xs rounded-premium-full bg-secondary/60 text-secondary-foreground text-premium-xs font-black uppercase tracking-widest">
                {seculo}
              </span>
              <span className="px-spacing-sm py-spacing-2xs rounded-premium-full border border-primary/30 text-primary text-premium-xs font-black uppercase tracking-widest max-w-full truncate">
                Virtude · {virtude}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ficha editorial em blocos */}
      <div className="p-spacing-md sm:p-spacing-lg md:p-spacing-2xl space-y-spacing-xl md:space-y-spacing-2xl">
        {/* Modo de leitura — nav de seções + toggle expandir/recolher */}
        <div
          className="sticky top-[64px] z-10 -mx-spacing-md sm:-mx-spacing-lg md:-mx-spacing-2xl px-spacing-md sm:px-spacing-lg md:px-spacing-2xl py-spacing-xs backdrop-blur bg-card/85 border-b border-border/60 flex items-center justify-between gap-spacing-sm"
          role="toolbar"
          aria-label="Modo de leitura da ficha"
        >
          <nav aria-label="Seções da ficha" className="flex-1 min-w-0 overflow-x-auto no-scrollbar">
            <ul className="flex items-center gap-spacing-2xs">
              {sectionNav
                .filter((s) => s.enabled)
                .map((s) => (
                  <li key={s.key}>
                    <button
                      type="button"
                      onClick={() => scrollToSection(s.key)}
                      aria-controls={s.controls}
                      className="inline-flex items-center justify-center min-h-11 px-spacing-sm py-spacing-2xs rounded-premium-full border border-border/60 text-premium-xs font-black uppercase tracking-widest text-foreground/80 hover:text-primary hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background whitespace-nowrap"
                    >
                      {s.label}
                    </button>
                  </li>
                ))}
            </ul>
          </nav>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 min-h-11"
            onClick={toggleExpanded}
            aria-expanded={expanded}
            aria-controls="santo-do-dia-vida"
          >
            {expanded ? (
              <>
                <Icons.ChevronUp className="w-spacing-md h-spacing-md" />
                <span className="hidden sm:inline">Recolher</span>
              </>
            ) : (
              <>
                <Icons.ChevronDown className="w-spacing-md h-spacing-md" />
                <span className="hidden sm:inline">Expandir leitura</span>
              </>
            )}
          </Button>
        </div>


        {/* Meta-strip */}
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-spacing-md border-b border-border/60 pb-spacing-lg">
          <div className="space-y-spacing-3xs">
            <dt className="text-premium-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
              Festa
            </dt>
            <dd className="text-premium-sm font-bold text-foreground">{feast}</dd>
          </div>
          <div className="space-y-spacing-3xs">
            <dt className="text-premium-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
              Nascimento
            </dt>
            <dd className="text-premium-sm font-bold text-foreground">
              {saint.born || '—'}
            </dd>
          </div>
          <div className="space-y-spacing-3xs">
            <dt className="text-premium-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
              Dies natalis
            </dt>
            <dd className="text-premium-sm font-bold text-foreground">
              {saint.died || '—'}
            </dd>
          </div>
          <div className="space-y-spacing-3xs">
            <dt className="text-premium-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
              Padroado
            </dt>
            <dd className="text-premium-sm font-bold text-foreground truncate">
              {padroado}
            </dd>
          </div>
        </dl>

        {/* Frase marcante (opcional) */}
        {frase && (
          <blockquote
            id="santo-do-dia-frase"
            ref={(el) => { sectionRefs.current.frase = el; }}
            className="relative pl-spacing-lg border-l-2 border-primary/50 scroll-mt-32"
          >
            <Icons.Quote className="absolute -left-spacing-xs -top-spacing-xs w-spacing-md h-spacing-md text-primary/60 bg-card px-spacing-3xs" />
            <p className="font-serif italic text-premium-xl md:text-premium-2xl text-foreground leading-relaxed">
              {renderWithRefs(frase, 'quote')}
            </p>
          </blockquote>
        )}

        {/* Blocos editoriais */}
        <div className="grid md:grid-cols-2 gap-spacing-xl">
          <section
            id="santo-do-dia-vida"
            ref={(el) => { sectionRefs.current.vida = el; }}
            aria-labelledby="bloco-vida"
            className="space-y-spacing-sm scroll-mt-32"
          >
            <h3
              id="bloco-vida"
              className="flex items-center gap-spacing-xs text-primary text-premium-small font-black uppercase tracking-[0.2em]"
            >
              <Icons.BookOpen className="w-spacing-sm h-spacing-sm" />
              Vida
            </h3>
            <p
              className={`font-serif text-premium-base leading-[1.75] text-foreground/90 whitespace-pre-line ${expanded ? '' : 'line-clamp-[8]'}`}
            >
              {renderWithRefs(vida, 'vida')}
            </p>
          </section>

          <section
            id="santo-do-dia-legado"
            ref={(el) => { sectionRefs.current.legado = el; }}
            aria-labelledby="bloco-legado"
            className="space-y-spacing-sm scroll-mt-32"
          >
            <h3
              id="bloco-legado"
              className="flex items-center gap-spacing-xs text-primary text-premium-small font-black uppercase tracking-[0.2em]"
            >
              <Icons.Shield className="w-spacing-sm h-spacing-sm" />
              Legado
            </h3>
            <p className="font-serif text-premium-base leading-[1.75] text-foreground/90">
              {renderWithRefs(legado, 'legado')}
            </p>
          </section>
        </div>

        {/* Meditação — bloco de largura total, contemplativo */}
        <section
          id="santo-do-dia-meditacao"
          ref={(el) => { sectionRefs.current.meditacao = el; }}
          aria-labelledby="bloco-meditacao"
          className="rounded-[1.5rem] md:rounded-[2rem] border border-primary/15 bg-primary/5 p-spacing-lg md:p-spacing-xl space-y-spacing-sm scroll-mt-32"
        >
          <h3
            id="bloco-meditacao"
            className="flex items-center gap-spacing-xs text-primary text-premium-small font-black uppercase tracking-[0.2em]"
          >
            <Icons.Sparkles className="w-spacing-sm h-spacing-sm" />
            Meditação para hoje
          </h3>
          <p className="font-serif italic text-premium-lg leading-relaxed text-foreground/95">
            {renderWithRefs(meditacao, 'meditacao')}
          </p>
        </section>


        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-spacing-sm pt-spacing-xs">
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => onOpen(false)}
            onMouseEnter={() => {
              import('./SaintDetail');
            }}
            aria-label={`Conhecer a história completa de ${saint.name}`}
          >
            <Icons.BookOpen className="w-spacing-md h-spacing-md" />
            Conhecer a história
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => onOpen(true)}
            onMouseEnter={() => {
              // Apenas prefetch do componente de detalhes
              import('./SaintDetail');
            }}
            aria-label={`Refletir com Logos sobre ${saint.name}`}
          >
            <Icons.Sparkles className="w-spacing-md h-spacing-md" />
            Refletir com Logos
          </Button>
          <PassageActions
            text={frase || saint.bio || saint.name}
            reference={`${saint.name} — ${saint.title || categoria}`}
            title={saint.name}
            url={typeof window !== 'undefined' ? window.location.href : ''}
            size="sm"
          />
        </div>
      </div>
    </motion.article>
  );
};

export default SantoDoDiaHero;
