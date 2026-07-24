import React from 'react';
import { Icons } from '../../../constants';
import type { Saint } from '@/data/saints';
import { parseTheologicalReferences } from '@/lib/theologicalRefParser';
import BibleVersePopover from '../BibleVersePopover';
import CatechismPopover from '../CatechismPopover';

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

const NarrativeBlock: React.FC<{ icon: keyof typeof Icons; label: string; text: string }> = ({ icon, label, text }) => {
  const Icon = Icons[icon] as any;
  return (
    <article className="space-y-spacing-sm max-w-[68ch]">
      <header className="flex items-center gap-spacing-sm text-primary">
        {Icon && <Icon className="w-spacing-md h-spacing-md" aria-hidden="true" />}
        <h4 className="text-premium-xs font-black uppercase tracking-[0.22em] text-primary/80">
          {label}
        </h4>
      </header>
      <p className="font-serif text-premium-md leading-[1.75] text-foreground/90">
        {renderRich(text)}
      </p>
    </article>
  );
};

/**
 * SaintLife — biografia narrativa do santo.
 * Renderiza: contexto histórico + blocos JSONB (biographyFull) + complementos TEXT
 * (conversionStory, mission, legacy) SEM substituir conteúdo editorial já existente.
 */
const SaintLife: React.FC<{ saint: Saint }> = ({ saint }) => {
  const bio = saint.biographyFull || {};
  const filledBlocks = NARRATIVE_BLOCKS.filter(b => (bio as any)[b.key]?.trim?.());
  const filledLabels = new Set(filledBlocks.map(b => b.label));
  const hasHistorical = !!saint.historicalContext?.trim();

  // Complementos TEXT — só entram quando não duplicam label já preenchido no JSONB.
  const complements: Array<{ label: string; icon: keyof typeof Icons; text: string }> = [];
  if (saint.conversionStory?.trim() && !filledLabels.has('O chamado')) {
    complements.push({ label: 'A conversão', icon: 'Sparkles', text: saint.conversionStory });
  }
  if (saint.mission?.trim() && !filledLabels.has('A missão')) {
    complements.push({ label: 'A missão', icon: 'Route', text: saint.mission });
  }
  if (saint.legacy?.trim() && !filledLabels.has('A herança espiritual')) {
    complements.push({ label: 'O legado', icon: 'Crown', text: saint.legacy });
  }

  if (!hasHistorical && !saint.century && filledBlocks.length === 0 && complements.length === 0) {
    return null;
  }

  return (
    <>
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

      {(filledBlocks.length > 0 || complements.length > 0) && (
        <section className="space-y-spacing-xl" aria-label="Capítulos da vida">
          {filledBlocks.map(block => (
            <NarrativeBlock
              key={block.key}
              icon={block.icon}
              label={block.label}
              text={(bio as any)[block.key]}
            />
          ))}
          {complements.map(c => (
            <NarrativeBlock key={c.label} icon={c.icon} label={c.label} text={c.text} />
          ))}
        </section>
      )}
    </>
  );
};

export default SaintLife;
