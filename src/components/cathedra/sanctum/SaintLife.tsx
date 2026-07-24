import React from 'react';
import { Icons } from '../../../constants';
import type { Saint, SaintBiographyBlocks } from '@/data/saints';
import { parseTheologicalReferences } from '@/lib/theologicalRefParser';
import BibleVersePopover from '../BibleVersePopover';
import CatechismPopover from '../CatechismPopover';

type BlockKey = keyof SaintBiographyBlocks;

interface JourneyStep {
  key: BlockKey | 'conversao_text' | 'missao_text' | 'heranca_text';
  label: string;
  icon: keyof typeof Icons;
  jsonbKey?: BlockKey;          // preferred source (biography_full)
  textFallback?: keyof Saint;   // TEXT column used only if JSONB block missing
}

/**
 * Ordem canônica da jornada espiritual (Sprint 3.2.2):
 * Origem → Chamado → Conversão → Missão → Testemunho → Legado → Aprendemos hoje.
 */
const JOURNEY: JourneyStep[] = [
  { key: 'origem',      label: 'A origem',                icon: 'MapPin',    jsonbKey: 'origem' },
  { key: 'chamado',     label: 'O chamado de Deus',       icon: 'Sparkles',  jsonbKey: 'chamado' },
  { key: 'conversao',   label: 'A conversão',             icon: 'Flame',     jsonbKey: 'conversao', textFallback: 'conversionStory' },
  { key: 'missao',      label: 'A missão',                icon: 'Route',     jsonbKey: 'missao',    textFallback: 'mission' },
  { key: 'testemunho',  label: 'O testemunho',            icon: 'Shield',    jsonbKey: 'testemunho' },
  { key: 'heranca',     label: 'O legado espiritual',     icon: 'Crown',     jsonbKey: 'heranca',   textFallback: 'legacy' },
  { key: 'aprendizado', label: 'O que aprendemos hoje',   icon: 'Lightbulb', jsonbKey: 'aprendizado' },
];

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

const JourneyStepBlock: React.FC<{
  index: number;
  total: number;
  icon: keyof typeof Icons;
  label: string;
  text: string;
}> = ({ index, total, icon, label, text }) => {
  const Icon = Icons[icon] as any;
  const isLast = index === total - 1;
  return (
    <li className="relative">
      <article className="space-y-spacing-sm max-w-[68ch]">
        <header className="flex items-center gap-spacing-sm text-primary">
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-primary/5 text-primary"
            aria-hidden="true"
          >
            {Icon ? <Icon className="w-4 h-4" /> : <span className="text-xs font-bold">{index + 1}</span>}
          </span>
          <h4 className="text-premium-xs font-black uppercase tracking-[0.22em] text-primary/80">
            {label}
          </h4>
        </header>
        <p className="font-serif text-premium-md leading-[1.75] text-foreground/90">
          {renderRich(text)}
        </p>
      </article>
      {!isLast && (
        <div className="flex justify-start pl-4 pt-spacing-md pb-spacing-sm" aria-hidden="true">
          <span className="text-primary/40 text-lg leading-none">↓</span>
        </div>
      )}
    </li>
  );
};

/**
 * SaintLife — biografia narrativa do santo como jornada espiritual.
 *
 * Renderiza (Sprint 3.2.2):
 *  - Contexto histórico (século + narrativa)
 *  - Síntese espiritual (spirituality_summary) como abertura destacada
 *  - Jornada em 7 capítulos conectados: origem → chamado → conversão →
 *    missão → testemunho → legado → aprendemos hoje.
 *
 * Prioriza JSONB (biography_full); usa TEXT (conversionStory/mission/legacy)
 * apenas quando o bloco JSONB correspondente está ausente. Nunca sobrescreve
 * conteúdo editorial existente.
 */
const SaintLife: React.FC<{ saint: Saint }> = ({ saint }) => {
  const bio = saint.biographyFull || {};

  const steps = JOURNEY.map(step => {
    const jsonbText = step.jsonbKey ? (bio[step.jsonbKey] || '').trim() : '';
    const fallbackText = step.textFallback ? ((saint[step.textFallback] as string | undefined) || '').trim() : '';
    const text = jsonbText || fallbackText;
    return text ? { ...step, text } : null;
  }).filter((s): s is JourneyStep & { text: string } => !!s);

  const hasHistorical = !!saint.historicalContext?.trim();
  const hasSpirituality = !!saint.spiritualitySummary?.trim();

  if (!hasHistorical && !saint.century && steps.length === 0 && !hasSpirituality) {
    return null;
  }

  return (
    <>
      {(hasHistorical || saint.century) && (
        <section className="space-y-spacing-md">
          <SectionTitle icon="Clock">
            Contexto histórico{saint.century ? ` · Século ${saint.century}` : ''}
          </SectionTitle>
          {hasHistorical && (
            <p className="font-serif text-premium-md leading-relaxed text-foreground/90 max-w-[68ch]">
              {renderRich(saint.historicalContext!)}
            </p>
          )}
        </section>
      )}

      {hasSpirituality && (
        <section aria-label="Síntese espiritual">
          <blockquote className="max-w-[68ch] border-l-2 border-primary/40 bg-primary/[0.03] px-spacing-md py-spacing-sm">
            <SectionTitle icon="Heart">Síntese espiritual</SectionTitle>
            <p className="mt-spacing-sm font-serif italic text-premium-md leading-[1.75] text-foreground/90">
              {renderRich(saint.spiritualitySummary!)}
            </p>
          </blockquote>
        </section>
      )}

      {steps.length > 0 && (
        <section className="space-y-spacing-md" aria-label="Capítulos da vida">
          <SectionTitle icon="BookOpen">A jornada</SectionTitle>
          <ol className="space-y-spacing-lg list-none pl-0">
            {steps.map((step, i) => (
              <JourneyStepBlock
                key={step.key}
                index={i}
                total={steps.length}
                icon={step.icon}
                label={step.label}
                text={step.text}
              />
            ))}
          </ol>
        </section>
      )}
    </>
  );
};

export default SaintLife;
