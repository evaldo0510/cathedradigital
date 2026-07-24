import React from 'react';
import { Icons } from '../../constants';
import type { Saint } from '@/data/saints';
import { parseTheologicalReferences } from '@/lib/theologicalRefParser';
import BibleVersePopover from './BibleVersePopover';
import CatechismPopover from './CatechismPopover';
import SaintLife from './sanctum/SaintLife';
import SaintTimeline from './sanctum/SaintTimeline';
import SaintVirtues from './sanctum/SaintVirtues';
import SaintSources from './sanctum/SaintSources';

const renderRich = (text: string) =>
  parseTheologicalReferences(text).map((seg, i) => {
    if (seg.type === 'bibleRef') return <BibleVersePopover key={i} abbr={seg.abbr!} chapter={seg.chapter!} verse={seg.verse} label={seg.value} />;
    if (seg.type === 'catechismRef') return <CatechismPopover key={i} paragraph={seg.paragraph!} />;
    return <span key={i}>{seg.value}</span>;
  });

const SectionTitle: React.FC<{ icon: keyof typeof Icons; children: React.ReactNode }> = ({ icon, children }) => {
  const Icon = Icons[icon] as any;
  return (
    <div className="flex items-center gap-spacing-xs text-primary">
      {Icon && <Icon className="w-spacing-md h-spacing-md" aria-hidden="true" />}
      <h3 className="text-premium-small font-black uppercase tracking-[0.2em]">{children}</h3>
    </div>
  );
};

export const SanctumCurationBadge: React.FC<{ status?: Saint['contentStatus'] }> = ({ status }) => {
  if (!status || status === 'complete') return null;
  const label = status === 'partial' ? 'Ficha em curadoria' : 'Ficha em preparação';
  return (
    <span
      role="status"
      className="inline-flex items-center gap-spacing-2xs px-spacing-sm py-spacing-2xs rounded-premium-full bg-secondary/40 border border-border text-premium-xs font-black uppercase tracking-[0.18em] text-foreground/70"
    >
      <Icons.Feather className="w-3 h-3" aria-hidden="true" />
      {label}
    </span>
  );
};

/**
 * SanctumEditorial — orquestrador editorial da ficha do santo.
 * Composição de módulos: SaintLife · SaintTimeline · SaintVirtues · (media/quotes/spiritual) · SaintSources.
 */
const SanctumEditorial: React.FC<{ saint: Saint }> = ({ saint }) => {
  const hasIcono = !!(saint.iconography && (
    saint.iconography.symbols?.length ||
    saint.iconography.attributes?.length ||
    saint.iconography.colors?.length
  ));
  const hasPatronages = (saint.patronages?.length ?? 0) > 0;
  const hasCuriosities = (saint.curiosities?.length ?? 0) > 0;
  const hasMiracles = (saint.miracles?.length ?? 0) > 0;
  const hasQuotesRich = (saint.quotesRich?.length ?? 0) > 0;
  const sp = saint.spiritualPractice || {};
  const hasSpiritual = !!(sp.live_today || sp.prayer || sp.purpose || sp.practice || (sp.examination?.length));

  const bio = saint.biographyFull || {};
  const hasAnyLife =
    !!saint.historicalContext?.trim() ||
    !!saint.century ||
    Object.values(bio).some(v => typeof v === 'string' && v.trim()) ||
    !!saint.conversionStory?.trim() ||
    !!saint.mission?.trim() ||
    !!saint.legacy?.trim();

  const anything =
    hasAnyLife || (saint.timeline?.length ?? 0) > 0 || (saint.virtues?.length ?? 0) > 0 ||
    hasIcono || hasPatronages || hasCuriosities || hasMiracles || hasQuotesRich ||
    hasSpiritual || (saint.sources?.length ?? 0) > 0;

  if (!anything) return null;

  return (
    <div className="space-y-spacing-2xl">
      <SaintLife saint={saint} />
      <SaintTimeline saint={saint} />
      <SaintVirtues saint={saint} />

      {/* Iconografia + Patronatos lado a lado */}
      {(hasIcono || hasPatronages) && (
        <div className="grid md:grid-cols-2 gap-spacing-xl">
          {hasIcono && (
            <section className="space-y-spacing-md">
              <SectionTitle icon="Palette">Iconografia</SectionTitle>
              <div className="bg-secondary/20 rounded-[1.5rem] p-spacing-lg border border-border space-y-spacing-sm">
                {saint.iconography!.symbols?.length ? (
                  <div>
                    <p className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground mb-spacing-2xs">Símbolos</p>
                    <div className="flex flex-wrap gap-spacing-2xs">
                      {saint.iconography!.symbols!.map((s, i) => (
                        <span key={i} className="px-spacing-sm py-spacing-2xs rounded-premium-full bg-background border border-border text-premium-sm text-foreground">{s}</span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {saint.iconography!.attributes?.length ? (
                  <div>
                    <p className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground mb-spacing-2xs">Atributos</p>
                    <p className="text-premium-sm text-foreground/80">{saint.iconography!.attributes!.join(' · ')}</p>
                  </div>
                ) : null}
                {saint.iconography!.colors?.length ? (
                  <div>
                    <p className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground mb-spacing-2xs">Cor litúrgica</p>
                    <p className="text-premium-sm text-foreground/80">{saint.iconography!.colors!.join(' · ')}</p>
                  </div>
                ) : null}
              </div>
            </section>
          )}

          {hasPatronages && (
            <section className="space-y-spacing-md">
              <SectionTitle icon="Shield">Patronatos</SectionTitle>
              <div className="bg-primary/5 rounded-[1.5rem] p-spacing-lg border border-primary/10">
                <ul className="flex flex-wrap gap-spacing-xs">
                  {saint.patronages!.map((p, i) => (
                    <li key={i} className="px-spacing-sm py-spacing-2xs rounded-premium-full bg-background border border-primary/20 text-premium-sm text-foreground">
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </div>
      )}

      {/* Milagres */}
      {hasMiracles && (
        <section className="space-y-spacing-md">
          <SectionTitle icon="Star">Milagres e sinais</SectionTitle>
          <div className="grid md:grid-cols-2 gap-spacing-md">
            {saint.miracles!.map((m, i) => (
              <article key={i} className="p-spacing-lg rounded-[1.5rem] bg-card border border-border">
                {(m.title || m.year) && (
                  <header className="flex items-baseline justify-between mb-spacing-2xs">
                    <h5 className="text-premium-sm font-black text-foreground">{m.title || 'Sinal'}</h5>
                    {m.year && <span className="text-premium-xs text-muted-foreground">{m.year}</span>}
                  </header>
                )}
                <p className="text-premium-sm text-foreground/80 leading-relaxed font-serif">
                  {renderRich(m.description)}
                </p>
                {m.place && <p className="mt-spacing-2xs text-premium-xs text-muted-foreground">{m.place}</p>}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Citações com fonte */}
      {hasQuotesRich && (
        <section className="space-y-spacing-md">
          <SectionTitle icon="Quote">Palavras do santo</SectionTitle>
          <div className="space-y-spacing-md">
            {saint.quotesRich!.map((q, i) => (
              <blockquote key={i} className="border-l-2 border-primary/40 pl-spacing-lg py-spacing-xs max-w-[68ch]">
                <p className="font-serif italic text-premium-lg text-foreground leading-relaxed">
                  “{renderRich(q.text)}”
                </p>
                {(q.source || q.reference) && (
                  <footer className="mt-spacing-2xs text-premium-xs uppercase tracking-widest text-muted-foreground">
                    — {[q.source, q.reference].filter(Boolean).join(', ')}
                  </footer>
                )}
              </blockquote>
            ))}
          </div>
        </section>
      )}

      {/* Curiosidades */}
      {hasCuriosities && (
        <section className="space-y-spacing-md">
          <SectionTitle icon="Sparkles">Curiosidades</SectionTitle>
          <ul className="list-disc pl-spacing-lg space-y-spacing-2xs max-w-[68ch]">
            {saint.curiosities!.map((c, i) => (
              <li key={i} className="font-serif text-premium-md text-foreground/85 leading-relaxed">{c}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Vida Espiritual aplicada */}
      {hasSpiritual && (
        <section
          aria-labelledby="vida-espiritual-heading"
          className="rounded-[2rem] border border-primary/15 bg-primary/5 p-spacing-xl md:p-spacing-2xl space-y-spacing-lg"
        >
          <header className="flex items-center gap-spacing-sm text-primary">
            <Icons.Heart className="w-spacing-md h-spacing-md" aria-hidden="true" />
            <h3 id="vida-espiritual-heading" className="text-premium-small font-black uppercase tracking-[0.2em]">
              Como viver hoje esta espiritualidade
            </h3>
          </header>

          {sp.live_today && (
            <p className="font-serif italic text-premium-lg text-foreground/90 leading-relaxed max-w-[68ch]">
              {renderRich(sp.live_today)}
            </p>
          )}

          <div className="grid md:grid-cols-2 gap-spacing-lg">
            {sp.prayer && (
              <div className="space-y-spacing-2xs">
                <p className="text-premium-xs font-black uppercase tracking-widest text-primary/80">Oração</p>
                <p className="font-serif text-premium-md text-foreground/90 leading-relaxed">{renderRich(sp.prayer)}</p>
              </div>
            )}
            {sp.purpose && (
              <div className="space-y-spacing-2xs">
                <p className="text-premium-xs font-black uppercase tracking-widest text-primary/80">Propósito do dia</p>
                <p className="font-serif text-premium-md text-foreground/90 leading-relaxed">{renderRich(sp.purpose)}</p>
              </div>
            )}
            {sp.practice && (
              <div className="space-y-spacing-2xs">
                <p className="text-premium-xs font-black uppercase tracking-widest text-primary/80">Prática concreta</p>
                <p className="font-serif text-premium-md text-foreground/90 leading-relaxed">{renderRich(sp.practice)}</p>
              </div>
            )}
            {sp.examination && sp.examination.length > 0 && (
              <div className="space-y-spacing-2xs">
                <p className="text-premium-xs font-black uppercase tracking-widest text-primary/80">Exame de consciência</p>
                <ul className="list-decimal pl-spacing-md space-y-spacing-2xs">
                  {sp.examination.map((q, i) => (
                    <li key={i} className="font-serif text-premium-md text-foreground/85 leading-relaxed">{q}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      <SaintSources saint={saint} />
    </div>
  );
};

export default SanctumEditorial;
