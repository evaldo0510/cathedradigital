import React from 'react';

interface Props {
  html?: string;
  text: string;
}

/** Biografia longa editorial. Aceita texto puro ou HTML sanitizado a montante. */
export const SaintBioBlock: React.FC<Props> = ({ text, html }) => (
  <section aria-labelledby="saint-bio" className="rounded-2xl border border-border/60 bg-card/40 p-spacing-lg">
    <h2 id="saint-bio" className="font-serif text-premium-lg text-foreground mb-spacing-sm">
      Vida
    </h2>
    {html ? (
      <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
    ) : (
      <p className="text-premium-sm text-foreground/90 leading-relaxed whitespace-pre-line">{text}</p>
    )}
  </section>
);
