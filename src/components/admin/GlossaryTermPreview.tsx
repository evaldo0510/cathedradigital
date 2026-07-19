/**
 * GlossaryTermPreview — Renderização "espelho" do verbete para preview em tempo real
 * dentro do /admin/glossario. Recebe os 11 campos editoriais como props (sem fetch)
 * e reproduz o layout do reader público (/glossario/:slug) usando os mesmos
 * primitivos editoriais.
 */

import React, { useMemo } from 'react';
import { EditorialShell, EditorialHero } from '@/components/editorial';
import {
  EditorialKicker,
  EditorialEmptyState,
  EditorialGoldMarker,
} from '@/components/editorial/primitives';
import { cn } from '@/lib/utils';

type SectionKey =
  | 'definition'
  | 'interpretation'
  | 'application'
  | 'bible'
  | 'catechism'
  | 'magisterium'
  | 'saints'
  | 'fathers'
  | 'journey'
  | 'prayer'
  | 'nexus';

interface NexusRef {
  kind?: string;
  target?: string;
  note?: string;
  label?: string;
}

export interface GlossaryPreviewData {
  term?: string;
  category?: string | null;
  definition?: string;
  interpretation?: string | null;
  practical_application?: string | null;
  bible_verses?: string[] | null;
  catechism_references?: string[] | null;
  magisterium_references?: string[] | null;
  saints_refs?: string[] | null;
  fathers_refs?: string[] | null;
  prayer_refs?: string[] | null;
  journey_refs?: string[] | null;
  nexus_refs?: NexusRef[] | unknown;
  sections_order?: string[] | null;
}

const DEFAULT_ORDER: SectionKey[] = [
  'definition', 'interpretation', 'application', 'bible', 'catechism',
  'magisterium', 'saints', 'fathers', 'journey', 'prayer', 'nexus',
];

const SECTION_META: Record<SectionKey, { kicker: string; title: string; anchor: string }> = {
  definition: { kicker: 'I · Fundamento', title: 'Definição', anchor: 'p-definicao' },
  interpretation: { kicker: 'II · Contemplação', title: 'Interpretação teológica', anchor: 'p-interpretacao' },
  application: { kicker: 'III · Vida', title: 'Aplicação prática', anchor: 'p-aplicacao' },
  bible: { kicker: 'IV · Escritura', title: 'Bíblia', anchor: 'p-biblia' },
  catechism: { kicker: 'V · Magistério vivo', title: 'Catecismo', anchor: 'p-catecismo' },
  magisterium: { kicker: 'VI · Doutrina', title: 'Magistério', anchor: 'p-magisterio' },
  saints: { kicker: 'VII · Comunhão', title: 'Santos relacionados', anchor: 'p-santos' },
  fathers: { kicker: 'VIII · Tradição', title: 'Padres relacionados', anchor: 'p-padres' },
  journey: { kicker: 'IX · Caminho', title: 'Jornada sugerida', anchor: 'p-jornada' },
  prayer: { kicker: 'X · Oração', title: 'Oração relacionada', anchor: 'p-oracao' },
  nexus: { kicker: 'XI · Nexus', title: 'Nexus completo', anchor: 'p-nexus' },
};

function TextSection({ children }: { children: string | null | undefined }) {
  if (!children || !children.trim()) {
    return (
      <EditorialEmptyState
        kicker="Em preparação"
        title="Este trecho ainda está sendo escrito."
        description="Preencha o campo no editor à esquerda para ver aqui."
      />
    );
  }
  return (
    <div className="prose prose-stitch max-w-[68ch] mx-auto font-stitch-serif text-stitch-body leading-stitch-body text-stitch-ink">
      {children.split(/\n{2,}/).map((para, i) => (
        <p key={i} className="mb-6">{para}</p>
      ))}
    </div>
  );
}

function RefList({
  items, emptyLabel, renderItem,
}: {
  items: string[] | null | undefined;
  emptyLabel: string;
  renderItem: (ref: string, i: number) => React.ReactNode;
}) {
  if (!items || items.length === 0) {
    return (
      <EditorialEmptyState
        kicker="Em preparação"
        title={emptyLabel}
        description="Adicione uma referência por linha no editor."
      />
    );
  }
  return (
    <ul className="max-w-[68ch] mx-auto space-y-3 font-stitch-serif text-stitch-body text-stitch-ink">
      {items.map((ref, i) => (
        <li key={`${ref}-${i}`} className="flex gap-3 items-baseline">
          <EditorialGoldMarker />
          <div className="flex-1">{renderItem(ref, i)}</div>
        </li>
      ))}
    </ul>
  );
}

function NexusList({ refs }: { refs: NexusRef[] | null | undefined }) {
  if (!refs || refs.length === 0) {
    return (
      <EditorialEmptyState
        kicker="Em preparação"
        title="O Nexus deste verbete ainda não foi curado."
        description="Adicione o array JSON no editor."
      />
    );
  }
  return (
    <ul className="max-w-[68ch] mx-auto space-y-4 font-stitch-serif text-stitch-body text-stitch-ink">
      {refs.map((r, i) => (
        <li key={i} className="flex gap-3 items-baseline">
          <EditorialGoldMarker />
          <div className="flex-1">
            <span className="font-stitch-label text-stitch-label-sm uppercase tracking-[0.24em] text-stitch-secondary mr-3">
              {r.kind ?? 'Nexus'}
            </span>
            <span className="font-medium">{r.label ?? r.target ?? '—'}</span>
            {r.note && <p className="mt-1 text-stitch-body-sm text-stitch-muted">{r.note}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function GlossaryTermPreview({ data }: { data: GlossaryPreviewData }) {
  const order = useMemo<SectionKey[]>(() => {
    const raw = data.sections_order?.length ? data.sections_order : DEFAULT_ORDER;
    return (raw as string[]).filter((k): k is SectionKey => k in SECTION_META);
  }, [data.sections_order]);

  const nexus = Array.isArray(data.nexus_refs) ? (data.nexus_refs as NexusRef[]) : null;
  const termTitle = data.term?.trim() || 'Verbete sem título';
  const definition = (data.definition ?? '').trim() || 'Escreva a definição para ver o hero preenchido.';

  return (
    <div className="bg-background rounded-md border overflow-hidden">
      <EditorialShell>
        <EditorialHero
          kicker={data.category ? `Léxico · ${data.category}` : 'Léxico Teológico'}
          title={termTitle}
          subtitle={definition}
          size="sm"
          parchment
        />

        <div className="max-w-3xl mx-auto px-4 mt-6">
          {order.map((k) => {
            const meta = SECTION_META[k];
            return (
              <section
                key={k}
                id={meta.anchor}
                className={cn('scroll-mt-24 py-8 first:pt-0')}
                aria-labelledby={`${meta.anchor}-title`}
              >
                <header className="text-center mb-6">
                  <EditorialKicker>{meta.kicker}</EditorialKicker>
                  <h2
                    id={`${meta.anchor}-title`}
                    className="font-stitch-display text-stitch-display-sm text-stitch-ink mt-2"
                  >
                    {meta.title}
                  </h2>
                  <div className="mt-3 mx-auto w-12 h-px bg-stitch-secondary" />
                </header>

                {k === 'definition' && <TextSection>{data.definition}</TextSection>}
                {k === 'interpretation' && <TextSection>{data.interpretation}</TextSection>}
                {k === 'application' && <TextSection>{data.practical_application}</TextSection>}
                {k === 'bible' && (
                  <RefList
                    items={data.bible_verses}
                    emptyLabel="Passagens bíblicas ainda não indicadas."
                    renderItem={(ref) => <span>{ref}</span>}
                  />
                )}
                {k === 'catechism' && (
                  <RefList
                    items={data.catechism_references}
                    emptyLabel="Referências do Catecismo ainda não indicadas."
                    renderItem={(ref) => {
                      const num = ref.replace(/\D+/g, '');
                      return <span>§{num || ref}</span>;
                    }}
                  />
                )}
                {k === 'magisterium' && (
                  <RefList
                    items={data.magisterium_references}
                    emptyLabel="Documentos do Magistério ainda não indicados."
                    renderItem={(ref) => <span>{ref}</span>}
                  />
                )}
                {k === 'saints' && (
                  <RefList
                    items={data.saints_refs}
                    emptyLabel="Santos relacionados ainda não indicados."
                    renderItem={(ref) => <span>{ref}</span>}
                  />
                )}
                {k === 'fathers' && (
                  <RefList
                    items={data.fathers_refs}
                    emptyLabel="Padres relacionados ainda não indicados."
                    renderItem={(ref) => <span>{ref}</span>}
                  />
                )}
                {k === 'journey' && (
                  <RefList
                    items={data.journey_refs}
                    emptyLabel="Jornada sugerida ainda não indicada."
                    renderItem={(ref) => <span>{ref}</span>}
                  />
                )}
                {k === 'prayer' && (
                  <RefList
                    items={data.prayer_refs}
                    emptyLabel="Oração relacionada ainda não indicada."
                    renderItem={(ref) => <span>{ref}</span>}
                  />
                )}
                {k === 'nexus' && <NexusList refs={nexus} />}
              </section>
            );
          })}
        </div>
      </EditorialShell>
    </div>
  );
}
