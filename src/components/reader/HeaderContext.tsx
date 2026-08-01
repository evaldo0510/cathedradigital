/**
 * HeaderContext — slot opcional entre o EditorialHero e o ReaderContent.
 *
 * Regra COS §10 (Reader Architecture Rule):
 *  - Nenhum módulo pode alterar o ReaderShell para acomodar metadados
 *    específicos de domínio (litúrgico, jornada, catequese, estudo).
 *  - Toda informação contextual deve nascer como uma implementação de
 *    HeaderContext e ser injetada via slot `headerContext`.
 *  - HeaderContext é puramente presentacional. NÃO faz fetch, NÃO conhece
 *    rotas, NÃO importa hooks de domínio; recebe dados já resolvidos.
 *
 * Implementações canônicas registradas neste arquivo:
 *   - LiturgicalContext   (Missal, Liturgia das Horas)
 *   - JourneyContext      (Jornadas)
 *   - CatechesisContext   (Catequese)
 *   - StudyContext        (Coleções, estudos guiados)
 *
 * Módulos NÃO devem criar variantes paralelas fora deste arquivo.
 * Para um novo contexto, adicione aqui e documente em
 * `docs/reader-architecture-master.md`.
 */

import React from 'react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────
// Container base
// ─────────────────────────────────────────────────────────────────────────

export interface HeaderContextProps {
  /** Rótulo curto (chip/eyebrow). */
  eyebrow?: React.ReactNode;
  /** Metadados em linha, formato chave/valor. */
  items?: Array<{ label: string; value: React.ReactNode; icon?: React.ReactNode }>;
  /** Conteúdo livre (usado por implementações específicas). */
  children?: React.ReactNode;
  /** Cor de acento (token semântico). Ex.: `--liturgy-color`. */
  accent?: string;
  /** Aria-label da região. */
  ariaLabel?: string;
  className?: string;
}

/**
 * HeaderContext — primitivo estrutural. Toda variante de domínio
 * (Liturgical/Journey/…) é apenas um wrapper que preenche `items` + `eyebrow`.
 */
export const HeaderContext: React.FC<HeaderContextProps> = ({
  eyebrow,
  items,
  children,
  accent,
  ariaLabel = 'Contexto da leitura',
  className,
}) => {
  return (
    <section
      data-reader-slot="header-context"
      aria-label={ariaLabel}
      className={cn(
        'w-full mx-auto max-w-[68ch]',
        'px-[var(--stitch-margin-mobile)] md:px-0',
        'py-spacing-md',
        'border-b border-border/40',
        className,
      )}
      style={accent ? { ['--reader-context-accent' as string]: accent } : undefined}
    >
      {eyebrow && (
        <div
          className="text-eyebrow uppercase tracking-wider mb-spacing-xs"
          style={accent ? { color: 'var(--reader-context-accent)' } : undefined}
        >
          {eyebrow}
        </div>
      )}

      {items && items.length > 0 && (
        <dl className="flex flex-wrap gap-x-spacing-lg gap-y-spacing-xs text-body-sm text-muted-foreground">
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-spacing-xs">
              {it.icon && <span aria-hidden="true">{it.icon}</span>}
              <dt className="font-medium text-foreground/80">{it.label}:</dt>
              <dd>{it.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {children && <div className="mt-spacing-sm">{children}</div>}
    </section>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Variantes canônicas — apenas composição sobre HeaderContext
// ─────────────────────────────────────────────────────────────────────────

export interface LiturgicalContextProps {
  /** Data litúrgica formatada (ex.: "Quinta-feira, 23 de julho de 2026"). */
  date?: React.ReactNode;
  /** Nome da celebração (ex.: "São Brígida da Suécia"). */
  celebration?: React.ReactNode;
  /** Cor litúrgica (ex.: "Branco", "Verde"). */
  color?: React.ReactNode;
  /** Grau (Solenidade / Festa / Memória / Feria). */
  rank?: React.ReactNode;
  /** Tempo litúrgico (Advento, Natal, Quaresma, Páscoa, Comum). */
  season?: React.ReactNode;
  className?: string;
}

/**
 * LiturgicalContext — implementação de HeaderContext para Missal e LH.
 * Zero lógica: recebe strings já resolvidas pelo LiturgyProvider.
 */
export const LiturgicalContext: React.FC<LiturgicalContextProps> = ({
  date,
  celebration,
  color,
  rank,
  season,
  className,
}) => {
  const items: HeaderContextProps['items'] = [];
  if (date) items.push({ label: 'Data', value: date });
  if (rank) items.push({ label: 'Grau', value: rank });
  if (color) items.push({ label: 'Cor', value: color });
  if (season) items.push({ label: 'Tempo', value: season });

  return (
    <HeaderContext
      eyebrow={celebration}
      items={items}
      ariaLabel="Contexto litúrgico"
      className={className}
    />
  );
};

export interface JourneyContextProps {
  journeyTitle: React.ReactNode;
  currentDay?: number;
  totalDays?: number;
  progressPct?: number;
  className?: string;
}

/** JourneyContext — para páginas dentro de Jornadas. */
export const JourneyContext: React.FC<JourneyContextProps> = ({
  journeyTitle,
  currentDay,
  totalDays,
  progressPct,
  className,
}) => {
  const items: HeaderContextProps['items'] = [];
  if (currentDay && totalDays) {
    items.push({ label: 'Dia', value: `${currentDay} de ${totalDays}` });
  }
  if (typeof progressPct === 'number') {
    items.push({ label: 'Progresso', value: `${Math.round(progressPct)}%` });
  }
  return (
    <HeaderContext
      eyebrow={journeyTitle}
      items={items}
      ariaLabel="Contexto da jornada"
      className={className}
    />
  );
};

export interface CatechesisContextProps {
  moduleTitle: React.ReactNode;
  section?: React.ReactNode;
  level?: React.ReactNode;
  /** Parte do documento (ex.: "Parte I — A Profissão da Fé"). */
  part?: React.ReactNode;
  /** Capítulo (ex.: "Capítulo 2 — Deus vem ao encontro do homem"). */
  chapter?: React.ReactNode;
  /** Artigo (ex.: "Artigo 3 — A Sagrada Escritura"). */
  article?: React.ReactNode;
  /** Tema principal do trecho, em uma linha. */
  theme?: React.ReactNode;
  className?: string;
}

/**
 * CatechesisContext — para módulos de Catequese e para o Catecismo.
 * Composição pura sobre HeaderContext: nenhum layout novo é introduzido.
 */
export const CatechesisContext: React.FC<CatechesisContextProps> = ({
  moduleTitle,
  section,
  level,
  part,
  chapter,
  article,
  theme,
  className,
}) => {
  const items: HeaderContextProps['items'] = [];
  if (part) items.push({ label: 'Parte', value: part });
  if (section) items.push({ label: 'Seção', value: section });
  if (chapter) items.push({ label: 'Capítulo', value: chapter });
  if (article) items.push({ label: 'Artigo', value: article });
  if (theme) items.push({ label: 'Tema', value: theme });
  if (level) items.push({ label: 'Nível', value: level });
  return (
    <HeaderContext
      eyebrow={moduleTitle}
      items={items}
      ariaLabel="Contexto catequético"
      className={className}
    />
  );
};


export interface StudyContextProps {
  collectionTitle: React.ReactNode;
  position?: React.ReactNode;
  curator?: React.ReactNode;
  className?: string;
}

/** StudyContext — para páginas dentro de Coleções/estudos guiados. */
export const StudyContext: React.FC<StudyContextProps> = ({
  collectionTitle,
  position,
  curator,
  className,
}) => {
  const items: HeaderContextProps['items'] = [];
  if (position) items.push({ label: 'Posição', value: position });
  if (curator) items.push({ label: 'Curadoria', value: curator });
  return (
    <HeaderContext
      eyebrow={collectionTitle}
      items={items}
      ariaLabel="Contexto do estudo"
      className={className}
    />
  );
};

export interface PrayerContextProps {
  /** Categoria/tradição da oração (ex.: "Rosário Meditativo"). */
  category?: React.ReactNode;
  /** Mistério, estação ou dia atual (ex.: "3º Mistério · Coroação de Espinhos"). */
  station?: React.ReactNode;
  /** Ritmo/duração estimada. */
  rhythm?: React.ReactNode;
  /** Passo dentro da oração (ex.: "12 de 60"). */
  step?: React.ReactNode;
  className?: string;
}

/**
 * PrayerContext — implementação de HeaderContext para o Prayer Engine.
 * Alimentado por `usePrayerEngineSession` já resolvido; zero lógica interna.
 */
export const PrayerContext: React.FC<PrayerContextProps> = ({
  category,
  station,
  rhythm,
  step,
  className,
}) => {
  const items: HeaderContextProps['items'] = [];
  if (station) items.push({ label: 'Neste momento', value: station });
  if (step) items.push({ label: 'Passo', value: step });
  if (rhythm) items.push({ label: 'Ritmo', value: rhythm });
  return (
    <HeaderContext
      eyebrow={category}
      items={items}
      ariaLabel="Contexto da oração"
      className={className}
    />
  );
};

export default HeaderContext;

