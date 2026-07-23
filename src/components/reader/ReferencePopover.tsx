/**
 * ReferencePopover — Popover canônico de referência inline.
 *
 * Único popover permitido para referências inline (versículo bíblico,
 * verbete do glossário, parágrafo do CIC, santo, oração, etc.). Substitui
 * `BibleVersePopover`, `BibleDictionaryPopover`, `NexusBubbles/TagBubble`
 * e qualquer implementação one-off.
 *
 * Regra COS — Reader Architecture Rule:
 *   Se existir ReferencePopover, é proibido criar outro Popover de
 *   referência. Módulos com necessidade nova estendem via props/render props.
 *
 * O componente é puramente de apresentação. A resolução do conteúdo
 * (fetch da referência) fica no adapter que passa `content` ou o render
 * prop `renderContent`. Usa Radix Popover (shadcn) por baixo.
 */

import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type ReferenceKind =
  | 'bible'
  | 'catechism'
  | 'magisterium'
  | 'glossary'
  | 'saint'
  | 'father'
  | 'prayer'
  | 'journey'
  | 'collection'
  | 'theme';

export interface ReferencePopoverProps {
  /** Tipo canônico da referência (usado para telemetria e estilos). */
  kind: ReferenceKind;
  /** Rótulo curto exibido no gatilho inline (ex.: "Jo 3,16"). */
  label: string;
  /** Descrição para leitores de tela. */
  ariaLabel?: string;
  /** Conteúdo estático do popover. Ignorado se `renderContent` for passado. */
  content?: React.ReactNode;
  /**
   * Render prop assíncrono/dinâmico. Chamado quando o popover abre pela
   * primeira vez. Permite lazy-load do conteúdo (fetch de verbete, etc.).
   */
  renderContent?: () => React.ReactNode;
  /** Classe extra no gatilho. */
  className?: string;
  /** Largura do popover (default: `w-80`). */
  contentClassName?: string;
  /** Callback ao abrir/fechar (para telemetria). */
  onOpenChange?: (open: boolean) => void;
  /** Título do popover (opcional, dentro do conteúdo). */
  title?: string;
}

/** Estilo do gatilho por tipo — coerente com NexusSourceBadge. */
const KIND_TRIGGER: Record<ReferenceKind, string> = {
  bible: 'decoration-primary/50 hover:decoration-primary',
  catechism: 'decoration-secondary/50 hover:decoration-secondary',
  magisterium: 'decoration-primary/50 hover:decoration-primary',
  glossary: 'decoration-secondary/60 hover:decoration-secondary',
  saint: 'decoration-secondary/50 hover:decoration-secondary',
  father: 'decoration-muted-foreground/50 hover:decoration-foreground',
  prayer: 'decoration-secondary/60 hover:decoration-secondary',
  journey: 'decoration-primary/50 hover:decoration-primary',
  collection: 'decoration-primary/50 hover:decoration-primary',
  theme: 'decoration-secondary/50 hover:decoration-secondary',
};

export const ReferencePopover: React.FC<ReferencePopoverProps> = ({
  kind,
  label,
  ariaLabel,
  content,
  renderContent,
  className,
  contentClassName,
  onOpenChange,
  title,
}) => {
  const [open, setOpen] = React.useState(false);
  const [resolved, setResolved] = React.useState<React.ReactNode | null>(
    content ?? null,
  );

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && renderContent && resolved === null) {
      setResolved(renderContent());
    }
    onOpenChange?.(next);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-reference-popover
          data-reference-kind={kind}
          aria-label={ariaLabel ?? `Abrir referência: ${label}`}
          className={cn(
            'inline underline underline-offset-2 decoration-1',
            'transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm',
            KIND_TRIGGER[kind],
            className,
          )}
        >
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          'w-80 p-spacing-md',
          'border border-primary/15 bg-card/95 backdrop-blur-sm',
          'shadow-premium/20',
          contentClassName,
        )}
        align="start"
        sideOffset={6}
      >
        {title && (
          <h4 className="font-stitch-label text-stitch-label-sm uppercase tracking-[0.18em] text-secondary mb-spacing-xs">
            {title}
          </h4>
        )}
        <div className="text-premium-sm text-foreground leading-relaxed">
          {resolved ?? content}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ReferencePopover;
