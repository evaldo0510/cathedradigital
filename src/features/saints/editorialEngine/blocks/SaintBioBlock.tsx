import React from 'react';

interface Props {
  html?: string;
  text: string;
  /** Título editorial da seção. Default: "Vida". */
  title?: string;
  /** Id do heading — usado por aria-labelledby. Default: "saint-bio". */
  id?: string;
}

/**
 * Bloco de prosa editorial do santo. Reutilizado para Vida, Reflexão
 * espiritual e Legado — sem criar variantes paralelas.
 * Aceita texto puro ou HTML sanitizado a montante.
 */
export const SaintBioBlock: React.FC<Props> = ({ text, html, title = 'Vida', id = 'saint-bio' }) => (
  <section aria-labelledby={id} className="rounded-2xl border border-border/60 bg-card/40 p-spacing-lg">
    <h2 id={id} className="font-serif text-premium-lg text-foreground mb-spacing-sm">
      {title}
    </h2>
    {html ? (
      <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
    ) : (
      <p className="text-premium-sm text-foreground/90 leading-relaxed whitespace-pre-line">{text}</p>
    )}
  </section>
);
