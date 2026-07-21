/**
 * CAT-SP4 · Onda B — EditorialHero (Universal, slot-based)
 *
 * Um único hero para toda a plataforma. Sem props excessivas.
 * A estrutura é fixa; conteúdo é injetado via slots (children de sub-componentes).
 *
 * Slots:
 *   <EditorialHero.Eyebrow />   — versalete/rubrica (kicker)
 *   <EditorialHero.Title />     — h1
 *   <EditorialHero.Subtitle />  — lead
 *   <EditorialHero.Meta />      — linha contextual discreta
 *   <EditorialHero.Actions />   — CTAs primários/secundários
 *   <EditorialHero.Context />   — bloco lateral (badges, breadcrumbs, chips)
 *   <EditorialHero.Children />  — conteúdo livre (mapa, capa, ilustração)
 *
 * O ambiente é herdado do wrapper via `data-space` (definido em App.tsx).
 * Este componente NÃO conhece rotas, não faz fetch e não importa hooks de domínio.
 */

import React from 'react';
import { cn } from '@/lib/utils';

type SlotKey = 'eyebrow' | 'title' | 'subtitle' | 'meta' | 'actions' | 'context' | 'children';

const SLOT_SYMBOL = Symbol('editorial-hero-slot');

type SlotComponent = React.FC<{ children?: React.ReactNode; className?: string }> & {
  [SLOT_SYMBOL]?: SlotKey;
};

function createSlot(key: SlotKey): SlotComponent {
  const Slot: SlotComponent = ({ children }) => <>{children}</>;
  Slot.displayName = `EditorialHero.${key[0].toUpperCase()}${key.slice(1)}`;
  (Slot as SlotComponent)[SLOT_SYMBOL] = key;
  return Slot;
}

const Eyebrow = createSlot('eyebrow');
const Title = createSlot('title');
const Subtitle = createSlot('subtitle');
const Meta = createSlot('meta');
const Actions = createSlot('actions');
const Context = createSlot('context');
const Children = createSlot('children');

function collectSlots(nodes: React.ReactNode): Record<SlotKey, React.ReactNode> {
  const slots: Record<SlotKey, React.ReactNode> = {
    eyebrow: null,
    title: null,
    subtitle: null,
    meta: null,
    actions: null,
    context: null,
    children: null,
  };
  React.Children.forEach(nodes, (child) => {
    if (!React.isValidElement(child)) return;
    const type = child.type as SlotComponent | undefined;
    const key = type && type[SLOT_SYMBOL];
    if (key) slots[key] = child.props.children;
  });
  return slots;
}

export interface EditorialHeroProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Alinhamento horizontal do conteúdo textual. Default: 'left'.
   * `center` reservado para Home/Átrio e páginas devocionais.
   */
  align?: 'left' | 'center';
  /**
   * Densidade vertical. Herda do ambiente quando omitida:
   *   library  → 'expanded'  (mesa de leitura)
   *   church   → 'balanced'  (altar, respiração ritual)
   *   cloister → 'minimal'   (silêncio, espaço negativo)
   *   atrium   → 'expanded'  (portal de entrada)
   */
  density?: 'expanded' | 'balanced' | 'minimal';
  /**
   * Filete dourado sob o título. Herda de ambiente quando omitido
   * (church/library = true, cloister = false).
   */
  rule?: boolean;
  /** Elemento HTML raiz. Default: 'header'. */
  as?: 'header' | 'section' | 'div';
}

interface EditorialHeroCompound extends React.FC<EditorialHeroProps> {
  Eyebrow: typeof Eyebrow;
  Title: typeof Title;
  Subtitle: typeof Subtitle;
  Meta: typeof Meta;
  Actions: typeof Actions;
  Context: typeof Context;
  Children: typeof Children;
}

const DENSITY_PAD: Record<NonNullable<EditorialHeroProps['density']>, string> = {
  expanded: 'py-[var(--sp-xl)] md:py-[var(--sp-xxl)]',
  balanced: 'py-[var(--sp-l)] md:py-[var(--sp-xl)]',
  minimal: 'py-[var(--sp-m)] md:py-[var(--sp-l)]',
};

const DENSITY_TITLE: Record<NonNullable<EditorialHeroProps['density']>, string> = {
  expanded: 'type-display',
  balanced: 'type-h1',
  minimal: 'type-h2',
};

const DENSITY_GAP: Record<NonNullable<EditorialHeroProps['density']>, string> = {
  expanded: 'space-y-[var(--sp-l)]',
  balanced: 'space-y-[var(--sp-m)]',
  minimal: 'space-y-[var(--sp-s)]',
};

/** Resolve density a partir do ambiente ancestral se não vier explícita. */
function useResolvedDensity(density?: EditorialHeroProps['density']): NonNullable<EditorialHeroProps['density']> {
  const [envDensity, setEnvDensity] = React.useState<NonNullable<EditorialHeroProps['density']>>('balanced');
  const rootRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (density) return;
    const el = rootRef.current?.closest('[data-space]') as HTMLElement | null;
    const space = el?.getAttribute('data-space');
    switch (space) {
      case 'library':
      case 'atrium':
        setEnvDensity('expanded');
        break;
      case 'cloister':
        setEnvDensity('minimal');
        break;
      case 'church':
      default:
        setEnvDensity('balanced');
    }
  }, [density]);

  return {
    density: density ?? envDensity,
    ref: rootRef,
  } as unknown as NonNullable<EditorialHeroProps['density']> & { ref: React.RefObject<HTMLElement> };
}

const EditorialHeroBase: React.FC<EditorialHeroProps> = ({
  align = 'left',
  density,
  rule,
  as = 'header',
  className,
  children,
  ...rest
}) => {
  const slots = collectSlots(children);
  const rootRef = React.useRef<HTMLElement | null>(null);
  const [resolvedDensity, setResolvedDensity] =
    React.useState<NonNullable<EditorialHeroProps['density']>>(density ?? 'balanced');
  const [resolvedRule, setResolvedRule] = React.useState<boolean>(rule ?? true);

  React.useLayoutEffect(() => {
    if (density && rule !== undefined) return;
    const el = rootRef.current?.closest('[data-space]') as HTMLElement | null;
    const space = el?.getAttribute('data-space');
    if (!density) {
      if (space === 'library' || space === 'atrium') setResolvedDensity('expanded');
      else if (space === 'cloister') setResolvedDensity('minimal');
      else setResolvedDensity('balanced');
    }
    if (rule === undefined) {
      setResolvedRule(space !== 'cloister');
    }
  }, [density, rule]);

  const Comp = as as React.ElementType;
  const centered = align === 'center';
  const hasContext = Boolean(slots.context);

  return (
    <Comp
      ref={rootRef as never}
      data-editorial-hero-universal
      data-density={resolvedDensity}
      data-align={align}
      className={cn('relative', DENSITY_PAD[resolvedDensity], className)}
      {...rest}
    >
      <div
        className={cn(
          'relative grid gap-[var(--sp-l)]',
          hasContext ? 'lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end' : 'grid-cols-1',
        )}
      >
        <div className={cn('min-w-0', DENSITY_GAP[resolvedDensity], centered && 'text-center mx-auto max-w-3xl')}>
          {slots.meta && (
            <div
              className={cn(
                'type-rubrica flex items-center gap-3',
                centered && 'justify-center',
              )}
            >
              <span aria-hidden="true" className="inline-block h-[6px] w-[6px] rounded-full bg-[hsl(var(--rule-gold))]/70" />
              <span>{slots.meta}</span>
            </div>
          )}
          {slots.eyebrow && <p className="type-rubrica">{slots.eyebrow}</p>}
          {slots.title && (
            <h1 className={cn(DENSITY_TITLE[resolvedDensity], 'text-foreground max-w-3xl', centered && 'mx-auto')}>
              {slots.title}
            </h1>
          )}
          {resolvedRule && (
            <div
              role="separator"
              aria-orientation="horizontal"
              className={cn(
                'h-px max-w-[240px] bg-[linear-gradient(90deg,transparent,hsl(var(--rule-gold)),transparent)]',
                centered && 'mx-auto',
              )}
            />
          )}
          {slots.subtitle && (
            <p className={cn('type-lead max-w-2xl', centered && 'mx-auto')}>
              {slots.subtitle}
            </p>
          )}
          {slots.actions && (
            <div className={cn('flex flex-wrap gap-[var(--sp-s)] pt-[var(--sp-xs)]', centered && 'justify-center')}>
              {slots.actions}
            </div>
          )}
        </div>
        {slots.context && (
          <aside className="lg:pl-[var(--sp-l)] lg:border-l lg:border-border/60 min-w-0">
            {slots.context}
          </aside>
        )}
      </div>
      {slots.children && <div className="mt-[var(--sp-xl)]">{slots.children}</div>}
    </Comp>
  );
};

const EditorialHero = EditorialHeroBase as EditorialHeroCompound;
EditorialHero.Eyebrow = Eyebrow;
EditorialHero.Title = Title;
EditorialHero.Subtitle = Subtitle;
EditorialHero.Meta = Meta;
EditorialHero.Actions = Actions;
EditorialHero.Context = Context;
EditorialHero.Children = Children;

export { EditorialHero };
export default EditorialHero;
