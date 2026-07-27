/**
 * FaqVirtualList — renderização virtualizada de FAQs longos.
 *
 * Usa `react-window` v2 com `useDynamicRowHeight` para medir cada linha
 * (altura varia com `<details>` aberto/fechado). Aplicado apenas quando
 * o número de itens excede o threshold do consumidor, para preservar o
 * comportamento nativo em listas curtas.
 */

import { useCallback, useEffect, useRef } from 'react';
import { List, useDynamicRowHeight, type RowComponentProps } from 'react-window';
import { cn } from '@/lib/utils';
import type { FaqItem } from '@/lib/glossary/sanitizeFaq';

interface RowProps {
  items: FaqItem[];
  onRowResize: (index: number, height: number) => void;
}

function FaqRow({
  index,
  style,
  items,
  onRowResize,
}: RowComponentProps<RowProps>) {
  const item = items[index];
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        onRowResize(index, Math.ceil(e.contentRect.height) + 16);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [index, onRowResize]);

  if (!item) return null;
  const answer = typeof item.answer === 'string' ? item.answer : '';
  const paragraphs = answer.trim() ? answer.split(/\n{2,}/) : [];

  return (
    <div style={style} className="px-1">
      <div ref={ref}>
        <details
          className="group border border-stitch-outline-variant/40 rounded-[var(--stitch-radius-xl)] bg-stitch-surface-container-lowest overflow-hidden mb-4"
          onToggle={() => {
            if (ref.current) {
              onRowResize(index, Math.ceil(ref.current.getBoundingClientRect().height) + 16);
            }
          }}
        >
          <summary className="cursor-pointer list-none px-6 py-4 flex items-baseline justify-between gap-4 font-stitch-display italic text-stitch-body-lg text-stitch-on-background hover:text-stitch-secondary transition-colors">
            <span>{item.question}</span>
            <span
              aria-hidden="true"
              className="font-stitch-label text-stitch-label-sm text-stitch-secondary transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <div className="px-6 pb-6 pt-2 font-stitch-serif text-stitch-body text-stitch-on-surface leading-relaxed border-t border-stitch-outline-variant/30">
            {paragraphs.length > 0 ? (
              paragraphs.map((p, k) => (
                <p key={k} className={cn('mb-3 last:mb-0')}>{p}</p>
              ))
            ) : (
              <p className="mb-0 italic text-stitch-on-surface-variant">Resposta em preparação.</p>
            )}
          </div>
        </details>
      </div>
    </div>
  );
}

interface FaqVirtualListProps {
  items: FaqItem[];
  /** Altura visível do viewport virtual, em px. */
  viewportHeight?: number;
  /** Altura estimada para uma linha fechada (usada antes da medição). */
  estimatedRowHeight?: number;
}

export function FaqVirtualList({
  items,
  viewportHeight = 720,
  estimatedRowHeight = 88,
}: FaqVirtualListProps) {
  const rowHeight = useDynamicRowHeight({
    defaultRowHeight: estimatedRowHeight,
    key: items.length,
  });

  const onRowResize = useCallback(
    (index: number, height: number) => {
      // API do useDynamicRowHeight: setRowHeight(index, height)
      (rowHeight as unknown as { setRowHeight?: (i: number, h: number) => void }).setRowHeight?.(
        index,
        Math.max(height, estimatedRowHeight),
      );
    },
    [rowHeight, estimatedRowHeight],
  );

  return (
    <div
      className="max-w-[68ch] mx-auto"
      data-testid="faq-virtual-list"
      style={{ height: viewportHeight }}
    >
      <List<RowProps>
        rowCount={items.length}
        rowHeight={rowHeight}
        defaultHeight={viewportHeight}
        rowComponent={FaqRow}
        rowProps={{ items, onRowResize }}
        overscanCount={4}
      />
    </div>
  );
}
