/**
 * MysteryNexusPanel — carrega automaticamente as conexões teológicas do
 * mistério exibido no anúncio: Evangelho principal, passagens paralelas,
 * catecismo, Padre da Igreja e santos que meditaram o mistério.
 *
 * Todo conteúdo vem de `prayer_mysteries.meta` — nunca hardcoded.
 * Integração natural com o Nexus (links SPA).
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Church, ScrollText, Users, Quote } from 'lucide-react';
import type { DBMystery } from '@/prayer-engine/loadPrayerHierarchy';
import { readMysteryMeta } from './mysteryMeta';
import { cn } from '@/lib/utils';

interface Props {
  mystery: DBMystery;
  accentClass?: string;
}

const MysteryNexusPanel: React.FC<Props> = ({ mystery, accentClass = 'text-stitch-secondary' }) => {
  const meta = readMysteryMeta(mystery);
  const gospel = meta.primary_passage?.ref ?? mystery.gospel_ref;
  const parallels = meta.complementary_passages ?? [];
  const catechism = meta.catechism_ref;
  const patristic = meta.patristic_ref;
  const saints = meta.related_saints ?? [];

  const hasAny =
    gospel ||
    parallels.length > 0 ||
    catechism ||
    patristic ||
    saints.length > 0;
  if (!hasAny) return null;

  return (
    <section
      aria-label="Conexões teológicas do mistério"
      className="my-8 rounded-2xl border border-stitch-outline-variant/40 bg-stitch-surface-container-lowest/30 p-5 md:p-6"
    >
      <p className={cn('font-stitch-body text-[10px] font-bold uppercase tracking-[0.28em]', accentClass)}>
        Nexus do mistério
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {gospel && (
          <div>
            <p className="inline-flex items-center gap-1.5 font-stitch-body text-[11px] font-bold uppercase tracking-widest text-stitch-on-surface-variant">
              <BookOpen aria-hidden className="h-3 w-3" />
              Evangelho
            </p>
            <Link
              to={`/bible?q=${encodeURIComponent(gospel)}`}
              className="mt-1 block font-stitch-serif text-base text-stitch-on-surface hover:text-stitch-secondary hover:underline"
            >
              {gospel}
              {meta.primary_passage?.texto && (
                <span className="mt-1 block font-stitch-serif text-sm italic text-stitch-on-surface-variant">
                  “{meta.primary_passage.texto}”
                </span>
              )}
            </Link>
          </div>
        )}

        {parallels.length > 0 && (
          <div>
            <p className="inline-flex items-center gap-1.5 font-stitch-body text-[11px] font-bold uppercase tracking-widest text-stitch-on-surface-variant">
              <BookOpen aria-hidden className="h-3 w-3" />
              Passagens paralelas
            </p>
            <ul className="mt-1 space-y-1">
              {parallels.map((ref) => (
                <li key={ref}>
                  <Link
                    to={`/bible?q=${encodeURIComponent(ref)}`}
                    className="font-stitch-body text-sm text-stitch-on-surface hover:text-stitch-secondary hover:underline"
                  >
                    {ref}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {catechism && (
          <div>
            <p className="inline-flex items-center gap-1.5 font-stitch-body text-[11px] font-bold uppercase tracking-widest text-stitch-on-surface-variant">
              <Church aria-hidden className="h-3 w-3" />
              Catecismo
            </p>
            <Link
              to={`/catechism?p=${catechism.paragraph}`}
              className="mt-1 block font-stitch-serif text-sm italic text-stitch-on-surface hover:text-stitch-secondary hover:underline"
            >
              §{catechism.paragraph} — “{catechism.quote}”
            </Link>
          </div>
        )}

        {patristic && (
          <div>
            <p className="inline-flex items-center gap-1.5 font-stitch-body text-[11px] font-bold uppercase tracking-widest text-stitch-on-surface-variant">
              <Quote aria-hidden className="h-3 w-3" />
              Padres da Igreja
            </p>
            <blockquote className="mt-1 font-stitch-serif text-sm italic leading-relaxed text-stitch-on-surface">
              “{patristic.quote}”
              <footer className="mt-1 font-stitch-body text-xs not-italic text-stitch-on-surface-variant">
                — {patristic.author}
                {patristic.work ? `, ${patristic.work}` : ''}
              </footer>
            </blockquote>
          </div>
        )}

        {saints.length > 0 && (
          <div className="md:col-span-2">
            <p className="inline-flex items-center gap-1.5 font-stitch-body text-[11px] font-bold uppercase tracking-widest text-stitch-on-surface-variant">
              <Users aria-hidden className="h-3 w-3" />
              Santos que meditaram este mistério
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {saints.map((s) => (
                <li key={s.slug ?? s.name}>
                  <Link
                    to={s.slug ? `/santos/${s.slug}` : `/santos?q=${encodeURIComponent(s.name)}`}
                    className="inline-flex items-center gap-1 rounded-full border border-stitch-outline-variant/50 bg-stitch-surface/40 px-3 py-1 font-stitch-body text-xs text-stitch-on-surface hover:border-stitch-secondary/60 hover:text-stitch-secondary"
                  >
                    <ScrollText aria-hidden className="h-3 w-3" />
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
};

export default MysteryNexusPanel;
