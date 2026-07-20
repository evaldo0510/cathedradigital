import React from 'react';
import { Icons } from '../../constants';
import type { Saint } from '@/data/saints';
import { parseTheologicalReferences } from '@/lib/theologicalRefParser';
import BibleVersePopover from './BibleVersePopover';
import CatechismPopover from './CatechismPopover';

const NARRATIVE_BLOCKS: Array<{
  key: keyof NonNullable<Saint['biographyFull']>;
  label: string;
  icon: keyof typeof Icons;
}> = [
  { key: 'origem',       label: 'A origem',           icon: 'MapPin' },
  { key: 'chamado',      label: 'O chamado',          icon: 'Sparkles' },
  { key: 'missao',       label: 'A missão',           icon: 'Route' },
  { key: 'fidelidade',   label: 'A fidelidade',       icon: 'Shield' },
  { key: 'testemunho',   label: 'O testemunho',       icon: 'Flame' },
  { key: 'heranca',      label: 'A herança espiritual', icon: 'Crown' },
  { key: 'aprendizado',  label: 'O que aprendemos hoje', icon: 'Lightbulb' },
];

const TIMELINE_ICON: Record<string, keyof typeof Icons> = {
  birth: 'User',
  conversion: 'Sparkles',
  formation: 'BookOpen',
  mission: 'Route',
  work: 'Feather',
  miracle: 'Star',
  martyrdom: 'Flame',
  death: 'XCircle',
  canonization: 'Crown',
  feast: 'Calendar',
};

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

const SanctumEditorial: React.FC<{ saint: Saint }> = ({ saint }) => {
  const bio = saint.biographyFull || {};
  const filledBlocks = NARRATIVE_BLOCKS.filter(b => (bio as any)[b.key]?.trim?.());
  const hasHistorical = !!saint.historicalContext?.trim();
  const hasTimeline = (saint.timeline?.length ?? 0) > 0;
  const hasIcono = !!(saint.iconography && (
    saint.iconography.symbols?.length ||
    saint.iconography.attributes?.length ||
    saint.iconography.colors?.length
  ));
  const hasPatronages = (saint.patronages?.length ?? 0) > 0;
  const hasCuriosities = (saint.curiosities?.length ?? 0) > 0;
  const hasMiracles = (saint.miracles?.length ?? 0) > 0;
  const hasQuotesRich = (saint.quotesRich?.length ?? 0) > 0;
  const hasSources = (saint.sources?.length ?? 0) > 0;
  const sp = saint.spiritualPractice || {};
  const hasSpiritual = !!(sp.live_today || sp.prayer || sp.purpose || sp.practice || (sp.examination?.length));

  const anything =
    filledBlocks.length || hasHistorical || hasTimeline || hasIcono || hasPatronages ||
    hasCuriosities || hasMiracles || hasQuotesRich || hasSources || hasSpiritual;

  if (!anything) return null;

  return (
    <div className="space-y-spacing-2xl">
      {/* Contexto histórico + século */}
      {(hasHistorical || saint.century) && (
        <section className="space-y-spacing-md">
          <SectionTitle icon="Clock">Contexto histórico{saint.century ? ` · Século ${saint.century}` : ''}</SectionTitle>
          {hasHistorical && (
            <p className="font-serif text-premium-md leading-relaxed text-foreground/90 max-w-[68ch]">
              {renderRich(saint.historicalContext!)}
            </p>
          )}
        </section>
      )}

      {/* Biografia em blocos narrativos */}
      {filledBlocks.length > 0 && (
        <section className="space-y-spacing-xl" aria-label="Capítulos da vida">
          {filledBlocks.map(block => {
            const Icon = Icons[block.icon] as any;
            return (
              <article key={block.key} className="space-y-spacing-sm max-w-[68ch]">
                <header className="flex items-center gap-spacing-sm text-primary">
                  {Icon && <Icon className="w-spacing-md h-spacing-md" aria-hidden="true" />}
                  <h4 className="text-premium-xs font-black uppercase tracking-[0.22em] text-primary/80">
                    {block.label}
                  </h4>
                </header>
                <p className="font-serif text-premium-md leading-[1.75] text-foreground/90">
                  {renderRich((bio as any)[block.key])}
                </p>
              </article>
            );
          })}
        </section>
      )}

      {/* Timeline */}
      {hasTimeline && (
        <section className="space-y-spacing-md">
          <SectionTitle icon="Calendar">Linha do tempo</SectionTitle>
          <ol className="relative border-l-2 border-primary/20 pl-spacing-lg space-y-spacing-lg">
            {saint.timeline!.map((ev, i) => {
              const iconName = TIMELINE_ICON[ev.type || 'work'] || 'Star';
              const Icon = Icons[iconName] as any;
              return (
                <li key={i} className="relative">
                  <span className="absolute -left-[calc(theme(spacing.spacing-lg)+9px)] top-0 w-spacing-lg h-spacing-lg rounded-premium-full bg-background border-2 border-primary/40 flex items-center justify-center text-primary">
                    {Icon && <Icon className="w-3 h-3" aria-hidden="true" />}
                  </span>
                  <div className="flex flex-wrap items-baseline gap-spacing-xs">
                    {ev.year !== undefined && (
                      <span className="text-premium-xs font-black uppercase tracking-widest text-primary">
                        {ev.year}
                      </span>
                    )}
                    <p className="font-serif text-premium-md text-foreground">{ev.event}</p>
                  </div>
                  {ev.place && (
                    <p className="text-premium-xs text-muted-foreground mt-spacing-2xs">
                      <Icons.MapPin className="inline w-3 h-3 mr-1" aria-hidden="true" />
                      {ev.place}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}

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

      {/* Fontes / Bibliografia */}
      {hasSources && (
        <section className="space-y-spacing-md pt-spacing-lg border-t border-border">
          <SectionTitle icon="BookOpen">Fontes e bibliografia</SectionTitle>
          <ul className="space-y-spacing-2xs text-premium-sm text-muted-foreground">
            {saint.sources!.map((s, i) => (
              <li key={i} className="font-serif">
                {s.author && <span className="text-foreground/80">{s.author}. </span>}
                <em className="text-foreground/90">{s.title}</em>
                {s.year && <span>, {s.year}</span>}
                {s.url && (
                  <>
                    {' · '}
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2 hover:text-primary/80"
                    >
                      fonte
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default SanctumEditorial;
