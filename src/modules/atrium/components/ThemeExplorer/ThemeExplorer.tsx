import React from 'react';
import { useFeaturedThemes } from '../../hooks';

const ThemeExplorer: React.FC = () => {
  const themes = useFeaturedThemes();
  if (!themes.length) return null;

  return (
    <section data-atrium-block="P2" aria-labelledby="atrium-themes">
      <h2 id="atrium-themes" className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
        Explorar por tema
      </h2>
      <ul className="grid grid-cols-2 gap-2">
        {themes.map((t) => (
          <li key={t.slug}>
            <a
              href={`/pesquisar/tema/${t.slug}`}
              className="block p-3 rounded-md border border-border hover:bg-muted transition"
            >
              <div className="text-sm font-medium">{t.label}</div>
              {t.short && <div className="text-xs text-muted-foreground">{t.short}</div>}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default ThemeExplorer;
