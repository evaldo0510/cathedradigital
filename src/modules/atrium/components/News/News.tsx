import React from 'react';
import { useAnnouncements } from '../../hooks';

const News: React.FC = () => {
  const items = useAnnouncements();
  if (!items.length) return null;

  return (
    <section data-atrium-block="P6" aria-labelledby="atrium-news">
      <h2 id="atrium-news" className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
        Novidades
      </h2>
      <ul className="flex flex-col gap-1.5">
        {items.map((n) => (
          <li key={n.id} className="text-sm text-muted-foreground">
            · {n.label}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default News;
