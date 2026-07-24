import React from 'react';
import { Icons } from '../../constants';
import type { Saint } from '@/data/saints';
import SaintAILearn from './SaintAILearn';
import { parseTheologicalReferences } from '@/lib/theologicalRefParser';
import BibleVersePopover from './BibleVersePopover';
import CatechismPopover from './CatechismPopover';
import { CATEGORY_LABELS } from './SaintDetail.categories';
import SaintVirtues from './sanctum/SaintVirtues';


/**
 * SantoProfile — Perfil editorial reutilizável de um Santo.
 *
 * Renderiza, no padrão canônico da Biblioteca dos Santos, os blocos:
 * Identidade · História · Virtudes · Ensinamentos · Escritos · Aprenda com este Santo.
 *
 * É usado tanto pela ficha modal (`SaintDetail`) quanto por futuras
 * páginas/perfis dedicados, garantindo consistência entre milhares
 * de santos sem alteração de código.
 */
export interface SantoProfileProps {
  saint: Saint;
  /** Se true, mostra também um cabeçalho enxuto (imagem + nome). Padrão false — o container já cuida do header. */
  showHeader?: boolean;
  /** Ocultar bloco de reflexão IA — útil em previews. */
  hideAILearn?: boolean;
}

const renderRich = (text?: string) => {
  if (!text) return null;
  return parseTheologicalReferences(text).map((seg, i) => {
    if (seg.type === 'bibleRef')
      return <BibleVersePopover key={i} abbr={seg.abbr!} chapter={seg.chapter!} verse={seg.verse} label={seg.value} />;
    if (seg.type === 'catechismRef')
      return <CatechismPopover key={i} paragraph={seg.paragraph!} />;
    return <span key={i}>{seg.value}</span>;
  });
};

const SantoProfile: React.FC<SantoProfileProps> = ({ saint, showHeader = false, hideAILearn = false }) => {
  const virtues = saint.virtues ?? [];
  const quotesRich = saint.quotesRich ?? [];
  const legacyQuotes = (saint.quotes ?? []).map((text) => ({ text }));
  const teachingQuotes = quotesRich.length ? quotesRich : legacyQuotes;
  const works = saint.works ?? [];
  const timeline = saint.timeline ?? [];

  return (
    <article className="space-y-spacing-2xl" aria-label={`Perfil de ${saint.name}`}>
      {showHeader && (
        <header className="space-y-spacing-xs">
          <p className="text-premium-xs font-black uppercase tracking-[0.2em] text-primary">
            {CATEGORY_LABELS[saint.category] || 'Testemunha da Fé'}
          </p>
          <h2 className="font-serif text-premium-3xl text-foreground leading-tight">{saint.name}</h2>
          {saint.title && (
            <p className="text-premium-sm text-muted-foreground font-serif italic">{saint.title}</p>
          )}
        </header>
      )}

      {/* ── Identidade ─────────────────────────────────────────── */}
      <section aria-labelledby="ident-heading" className="space-y-spacing-md">
        <h3 id="ident-heading" className="sr-only">Identidade</h3>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-spacing-md">
          <IdentityCell icon={<Icons.Calendar className="w-spacing-md h-spacing-md" />} label="Festa" value={saint.feastDay} />
          <IdentityCell icon={<Icons.User className="w-spacing-md h-spacing-md" />} label="Nascimento" value={saint.born} />
          <IdentityCell icon={<Icons.XCircle className="w-spacing-md h-spacing-md" />} label="Falecimento" value={saint.died} />
          <IdentityCell icon={<Icons.Globe className="w-spacing-md h-spacing-md" />} label="País" value={saint.country} />
          <IdentityCell icon={<Icons.Heart className="w-spacing-md h-spacing-md" />} label="Vocação" value={saint.vocation} />
          <IdentityCell icon={<Icons.Star className="w-spacing-md h-spacing-md" />} label="Século" value={saint.century ? `Século ${saint.century}` : undefined} />
          <IdentityCell icon={<Icons.Shield className="w-spacing-md h-spacing-md" />} label="Categoria" value={CATEGORY_LABELS[saint.category] || saint.category} />
          <IdentityCell icon={<Icons.Star className="w-spacing-md h-spacing-md" />} label="Virtude principal" value={virtues[0]} />
        </dl>
      </section>

      {/* ── História ───────────────────────────────────────────── */}
      {(saint.fullBio || saint.bio || saint.historicalContext || timeline.length > 0) && (
        <section aria-labelledby="hist-heading" className="space-y-spacing-md">
          <div className="flex items-center gap-spacing-xs text-primary">
            <Icons.BookOpen className="w-spacing-md h-spacing-md" aria-hidden="true" />
            <h3 id="hist-heading" className="text-premium-small font-black uppercase tracking-[0.2em]">História</h3>
          </div>

          {(saint.fullBio || saint.bio) && (
            <div className="prose-editorial max-w-none">
              <p className="text-premium-sm leading-relaxed text-foreground whitespace-pre-line font-serif">
                {renderRich(saint.fullBio || saint.bio)}
              </p>
            </div>
          )}

          {saint.historicalContext && (
            <div className="rounded-premium border border-border/60 bg-secondary/20 p-spacing-md space-y-spacing-2xs">
              <p className="text-premium-xs font-black uppercase tracking-widest text-primary">Contexto histórico</p>
              <p className="text-premium-sm leading-relaxed text-muted-foreground font-serif italic">
                {saint.historicalContext}
              </p>
            </div>
          )}

          {timeline.length > 0 && (
            <ol className="relative border-l border-primary/20 pl-spacing-lg space-y-spacing-md">
              {timeline.map((ev, i) => (
                <li key={i} className="relative">
                  <span
                    className="absolute -left-[calc(theme(spacing.spacing-lg)+0.4rem)] top-1 w-spacing-xs h-spacing-xs rounded-premium-full bg-primary"
                    aria-hidden="true"
                  />
                  <p className="text-premium-xs font-black uppercase tracking-widest text-primary">
                    {ev.year ?? '—'}{ev.place ? ` · ${ev.place}` : ''}
                  </p>
                  <p className="text-premium-sm text-foreground">{ev.event}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {/* ── Virtudes ───────────────────────────────────────────── */}
      <SaintVirtues saint={saint} />


      {/* ── Ensinamentos ───────────────────────────────────────── */}
      {teachingQuotes.length > 0 && (
        <section aria-labelledby="ens-heading" className="space-y-spacing-md">
          <div className="flex items-center gap-spacing-xs text-primary">
            <Icons.Quote className="w-spacing-md h-spacing-md" aria-hidden="true" />
            <h3 id="ens-heading" className="text-premium-small font-black uppercase tracking-[0.2em]">Ensinamentos</h3>
          </div>
          <ul className="space-y-spacing-md" role="list">
            {teachingQuotes.slice(0, 6).map((q, i) => (
              <li
                key={i}
                className="relative rounded-premium border border-border/60 bg-secondary/20 p-spacing-md group"
              >
                <Icons.Quote className="absolute top-spacing-xs right-spacing-xs w-spacing-lg h-spacing-lg text-primary/10" aria-hidden="true" />
                <p className="text-premium-sm text-foreground font-serif italic leading-relaxed">
                  {renderRich(q.text)}
                </p>
                {(q as any).source && (
                  <p className="text-premium-xs text-muted-foreground uppercase tracking-widest mt-spacing-2xs">
                    {(q as any).source}{(q as any).reference ? ` · ${(q as any).reference}` : ''}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Escritos ───────────────────────────────────────────── */}
      {works.length > 0 && (
        <section aria-labelledby="obras-heading" className="space-y-spacing-md">
          <div className="flex items-center gap-spacing-xs text-primary">
            <Icons.Book className="w-spacing-md h-spacing-md" aria-hidden="true" />
            <h3 id="obras-heading" className="text-premium-small font-black uppercase tracking-[0.2em]">Escritos do Santo</h3>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-spacing-md" role="list">
            {works.map((w, i) => {
              const anyW = w as any;
              return (
                <li key={i}>
                  <div className="flex items-start justify-between gap-spacing-sm rounded-premium border border-border bg-card p-spacing-md hover:border-primary/40 transition-all h-full">
                    <div className="flex items-start gap-spacing-sm min-w-0">
                      <div className="w-spacing-xl h-spacing-xl rounded-premium bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Icons.BookOpen className="w-spacing-md h-spacing-md" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-premium-sm font-bold text-foreground truncate">{w.title}</p>
                        {anyW.type && (
                          <p className="text-premium-xs uppercase tracking-widest text-primary">{anyW.type}</p>
                        )}
                        {anyW.description && (
                          <p className="text-premium-xs text-muted-foreground line-clamp-spacing-2xs mt-spacing-2xs">
                            {anyW.description}
                          </p>
                        )}
                        {w.year && (
                          <p className="text-premium-xs text-muted-foreground uppercase mt-spacing-2xs">{w.year}</p>
                        )}
                        {anyW.author && anyW.author !== saint.name && (
                          <p className="text-premium-xs text-muted-foreground italic">por {anyW.author}</p>
                        )}
                      </div>
                    </div>
                    {w.url && (
                      <a
                        href={w.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-primary hover:underline text-premium-xs font-black uppercase tracking-widest inline-flex items-center gap-spacing-2xs focus-visible:ring-2 focus-visible:ring-primary rounded-premium-full px-spacing-xs py-spacing-2xs"
                        aria-label={`Ler ${w.title} — abre em nova aba`}
                      >
                        Ler <Icons.ArrowRight className="w-spacing-sm h-spacing-sm" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ── Aprenda com este Santo (IA) ────────────────────────── */}
      {!hideAILearn && <SaintAILearn saint={saint} />}
    </article>
  );
};

const IdentityCell: React.FC<{ icon: React.ReactNode; label: string; value?: string | null }> = ({ icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-spacing-sm">
      <div className="w-spacing-xl h-spacing-xl shrink-0 rounded-premium bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <dt className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground">{label}</dt>
        <dd className="text-premium-sm font-bold text-foreground truncate">{value}</dd>
      </div>
    </div>
  );
};

export default SantoProfile;
