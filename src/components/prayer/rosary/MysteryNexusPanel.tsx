/**
 * @deprecated Reader Architecture Rule (COS §10 / v1.1):
 *   `MysteryNexusPanel` está proibido. Substituir por `NexusPanel` alimentado
 *   pelo adapter `prayerAutoNexus` — a projeção do mistério vira apenas o
 *   `output` passado ao componente canônico.
 *   Ver docs/reader-architecture-master.md e src/components/reader/.
 *   Será removido na Fase F da Sprint Nexus 2.0.
 *
 * MysteryNexusPanel — carrega automaticamente as conexões teológicas do
 * mistério exibido no anúncio.
 */
if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Cathedra] MysteryNexusPanel é deprecated. Use NexusPanel de @/components/reader com prayerAutoNexus. Ver docs/reader-architecture-master.md',
  );
}
import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Church, ScrollText, Users, Quote, Landmark, Palette, Library } from 'lucide-react';
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
  const catechismList = meta.catechism_refs ?? (meta.catechism_ref ? [meta.catechism_ref] : []);
  const fathers = meta.church_fathers ?? (meta.patristic_ref ? [meta.patristic_ref] : []);
  const saints = meta.related_saints ?? [];
  const magisterium = meta.magisterium_refs ?? [];
  const iconography = meta.iconography;
  const bibliography = meta.bibliography ?? [];

  const hasAny =
    gospel ||
    parallels.length > 0 ||
    catechismList.length > 0 ||
    fathers.length > 0 ||
    saints.length > 0 ||
    magisterium.length > 0 ||
    !!iconography ||
    bibliography.length > 0;
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

        {catechismList.length > 0 && (
          <div>
            <p className="inline-flex items-center gap-1.5 font-stitch-body text-[11px] font-bold uppercase tracking-widest text-stitch-on-surface-variant">
              <Church aria-hidden className="h-3 w-3" />
              Catecismo
            </p>
            <ul className="mt-1 space-y-1">
              {catechismList.map((c) => (
                <li key={c.paragraph}>
                  <Link
                    to={`/catechism?p=${c.paragraph}`}
                    className="block font-stitch-serif text-sm italic text-stitch-on-surface hover:text-stitch-secondary hover:underline"
                  >
                    §{c.paragraph} — “{c.quote}”
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {fathers.length > 0 && (
          <div>
            <p className="inline-flex items-center gap-1.5 font-stitch-body text-[11px] font-bold uppercase tracking-widest text-stitch-on-surface-variant">
              <Quote aria-hidden className="h-3 w-3" />
              Padres da Igreja
            </p>
            <div className="mt-1 space-y-3">
              {fathers.map((p, i) => (
                <blockquote key={i} className="font-stitch-serif text-sm italic leading-relaxed text-stitch-on-surface">
                  “{p.quote}”
                  <footer className="mt-1 font-stitch-body text-xs not-italic text-stitch-on-surface-variant">
                    — {p.author}{p.work ? `, ${p.work}` : ''}
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        )}

        {magisterium.length > 0 && (
          <div>
            <p className="inline-flex items-center gap-1.5 font-stitch-body text-[11px] font-bold uppercase tracking-widest text-stitch-on-surface-variant">
              <Landmark aria-hidden className="h-3 w-3" />
              Magistério
            </p>
            <div className="mt-1 space-y-3">
              {magisterium.map((m, i) => (
                <blockquote key={i} className="font-stitch-serif text-sm italic leading-relaxed text-stitch-on-surface">
                  “{m.quote}”
                  <footer className="mt-1 font-stitch-body text-xs not-italic text-stitch-on-surface-variant">
                    — {[m.author, m.document, m.locus].filter(Boolean).join(', ')}
                  </footer>
                </blockquote>
              ))}
            </div>
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
                    title={s.reason}
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

        {iconography && (
          <div className="md:col-span-2">
            <p className="inline-flex items-center gap-1.5 font-stitch-body text-[11px] font-bold uppercase tracking-widest text-stitch-on-surface-variant">
              <Palette aria-hidden className="h-3 w-3" />
              Iconografia
            </p>
            <p className="mt-1 font-stitch-serif text-sm leading-relaxed text-stitch-on-surface">
              {iconography.description}
            </p>
            {iconography.symbols && iconography.symbols.length > 0 && (
              <p className="mt-2 font-stitch-body text-xs text-stitch-on-surface-variant">
                <span className="font-bold uppercase tracking-widest">Símbolos: </span>
                {iconography.symbols.join(' · ')}
              </p>
            )}
            {iconography.masterworks && iconography.masterworks.length > 0 && (
              <p className="mt-1 font-stitch-body text-xs italic text-stitch-on-surface-variant">
                {iconography.masterworks.join(' · ')}
              </p>
            )}
          </div>
        )}

        {bibliography.length > 0 && (
          <div className="md:col-span-2">
            <p className="inline-flex items-center gap-1.5 font-stitch-body text-[11px] font-bold uppercase tracking-widest text-stitch-on-surface-variant">
              <Library aria-hidden className="h-3 w-3" />
              Para aprofundar
            </p>
            <ul className="mt-1 space-y-1 font-stitch-body text-xs text-stitch-on-surface-variant">
              {bibliography.map((b, i) => (
                <li key={i}>
                  <span className="font-bold text-stitch-on-surface">{b.author}</span> — <em>{b.title}</em>{b.locus ? `, ${b.locus}` : ''}
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
