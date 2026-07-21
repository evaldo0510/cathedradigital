/**
 * CAT-SP4 · Onda B — EditorialCard (Universal, densidade editorial)
 *
 * Um único card para toda a plataforma, com três densidades:
 *
 *   dense    → Biblioteca   (Kicker + Título + Descrição + Referências + CTA)
 *   balanced → Igreja       (Título + Subtítulo + CTA)
 *   minimal  → Claustro     (Título + Uma frase + Entrar)
 *
 * A densidade é herdada do ambiente via `data-space`, mas pode ser
 * sobrescrita explicitamente por lote de migração.
 *
 * Slots:
 *   <EditorialCard.Eyebrow />       — versalete/kicker
 *   <EditorialCard.Title />         — obrigatório
 *   <EditorialCard.Description />   — 1 frase (minimal) até 2-3 linhas (dense)
 *   <EditorialCard.References />    — chips/tags (só renderiza em `dense`)
 *   <EditorialCard.Media />         — capa/ícone (opcional)
 *   <EditorialCard.CTA />           — ação primária
 *
 * Sem lógica de domínio, sem fetch, sem rotas.
 */

import React from 'react';
import { cn } from '@/lib/utils';

type SlotKey = 'eyebrow' | 'title' | 'description' | 'references' | 'media' | 'cta';
const SLOT = Symbol('editorial-card-slot');

type SlotComponent = React.FC<{ children?: React.ReactNode }> & { [SLOT]?: SlotKey };

function makeSlot(key: SlotKey): SlotComponent {
  const S: SlotComponent = ({ children }) => <>{children}</>;
  S.displayName = `EditorialCard.${key[0].toUpperCase()}${key.slice(1)}`;
  (S as SlotComponent)[SLOT] = key;
  return S;
}

const Eyebrow = makeSlot('eyebrow');
const Title = makeSlot('title');
const Description = makeSlot('description');
const References = makeSlot('references');
const Media = makeSlot('media');
const CTA = makeSlot('cta');

function pickSlots(children: React.ReactNode) {
  const map: Record<SlotKey, React.ReactNode> = {
    eyebrow: null, title: null, description: null, references: null, media: null, cta: null,
  };
  React.Children.forEach(children, (c) => {
    if (!React.isValidElement(c)) return;
    const key = (c.type as SlotComponent | undefined)?.[SLOT];
    if (key) map[key] = c.props.children;
  });
  return map;
}

export type EditorialCardDensity = 'dense' | 'balanced' | 'minimal';

export interface EditorialCardProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  density?: EditorialCardDensity;
  /** Elemento raiz. Default: 'article'. Use 'a' para links, 'button' para ações. */
  as?: 'article' | 'a' | 'div' | 'button';
  href?: string;
  interactive?: boolean;
}

interface EditorialCardCompound extends React.ForwardRefExoticComponent<
  EditorialCardProps & React.RefAttributes<HTMLElement>
> {
  Eyebrow: typeof Eyebrow;
  Title: typeof Title;
  Description: typeof Description;
  References: typeof References;
  Media: typeof Media;
  CTA: typeof CTA;
}

const CARD_PAD: Record<EditorialCardDensity, string> = {
  dense: 'p-[var(--sp-l)]',
  balanced: 'p-[var(--sp-m)] md:p-[var(--sp-l)]',
  minimal: 'p-[var(--sp-m)]',
};

const CARD_GAP: Record<EditorialCardDensity, string> = {
  dense: 'space-y-[var(--sp-s)]',
  balanced: 'space-y-[var(--sp-s)]',
  minimal: 'space-y-[var(--sp-xs)]',
};

const TITLE_CLASS: Record<EditorialCardDensity, string> = {
  dense: 'type-h3',
  balanced: 'type-h3',
  minimal: 'type-h3',
};

const EditorialCardBase = React.forwardRef<HTMLElement, EditorialCardProps>(
  ({ density, as, href, interactive, className, children, ...rest }, ref) => {
    const rootRef = React.useRef<HTMLElement | null>(null);
    const setRefs = (node: HTMLElement | null) => {
      rootRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node;
    };

    const [resolved, setResolved] = React.useState<EditorialCardDensity>(density ?? 'balanced');
    React.useLayoutEffect(() => {
      if (density) return;
      const el = rootRef.current?.closest('[data-space]') as HTMLElement | null;
      const space = el?.getAttribute('data-space');
      if (space === 'library' || space === 'atrium') setResolved('dense');
      else if (space === 'cloister') setResolved('minimal');
      else setResolved('balanced');
    }, [density]);

    const slots = pickSlots(children);
    const showRefs = resolved === 'dense' && slots.references;
    const showDesc = slots.description && resolved !== 'minimal'
      ? slots.description
      : resolved === 'minimal' && slots.description
        ? slots.description
        : null;

    const Tag = (as ?? (href ? 'a' : 'article')) as React.ElementType;
    const isInteractive = interactive ?? Boolean(href);

    return (
      <Tag
        ref={setRefs as never}
        href={href}
        data-editorial-card-universal
        data-density={resolved}
        className={cn(
          'group relative flex flex-col rounded-[var(--radius)] border border-border/60 bg-card text-card-foreground',
          'overflow-hidden',
          CARD_PAD[resolved],
          isInteractive &&
            'transition-colors hover:border-[hsl(var(--rule-gold))]/60 focus-visible:outline-none focus-visible:border-[hsl(var(--rule-gold))]',
          className,
        )}
        {...rest}
      >
        {slots.media && (
          <div className="-mx-[var(--sp-l)] -mt-[var(--sp-l)] mb-[var(--sp-m)] overflow-hidden bg-muted/40">
            {slots.media}
          </div>
        )}
        <div className={cn('flex-1 min-w-0', CARD_GAP[resolved])}>
          {slots.eyebrow && resolved !== 'minimal' && (
            <p className="type-rubrica">{slots.eyebrow}</p>
          )}
          {slots.title && (
            <h3 className={cn(TITLE_CLASS[resolved], 'text-foreground')}>
              {slots.title}
            </h3>
          )}
          {showDesc && (
            <p className={cn(resolved === 'minimal' ? 'type-caption' : 'type-body text-muted-foreground')}>
              {showDesc}
            </p>
          )}
          {showRefs && (
            <div className="flex flex-wrap gap-[var(--sp-xs)] pt-[var(--sp-xs)]">
              {slots.references}
            </div>
          )}
        </div>
        {slots.cta && (
          <div className="mt-[var(--sp-m)] pt-[var(--sp-s)] border-t border-border/40">
            {slots.cta}
          </div>
        )}
      </Tag>
    );
  },
);
EditorialCardBase.displayName = 'EditorialCard';

const EditorialCard = EditorialCardBase as unknown as EditorialCardCompound;
EditorialCard.Eyebrow = Eyebrow;
EditorialCard.Title = Title;
EditorialCard.Description = Description;
EditorialCard.References = References;
EditorialCard.Media = Media;
EditorialCard.CTA = CTA;

export { EditorialCard };
export default EditorialCard;
