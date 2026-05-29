import React, { useRef, useMemo, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'framer-motion';

interface SacredVirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  estimateSize?: number;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  scrollRef?: React.RefObject<HTMLDivElement>;
}

export function SacredVirtualList<T>({
  items,
  renderItem,
  estimateSize = 100,
  overscan = 5,
  className = '',
  onScroll,
  scrollRef
}: SacredVirtualListProps<T>) {
  const localRef = useRef<HTMLDivElement>(null);
  const parentRef = scrollRef || localRef;

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  // Handle scroll reporting
  useEffect(() => {
    const el = parentRef.current;
    if (!el || !onScroll) return;

    const handleScroll = () => {
      onScroll(el.scrollTop);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [parentRef, onScroll]);

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={`overflow-auto no-scrollbar ${className}`}
      style={{
        height: '100%',
        width: '100%',
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualRow) => (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={rowVirtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {renderItem(items[virtualRow.index], virtualRow.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
