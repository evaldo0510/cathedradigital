import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '@/constants';
import { EditorialHero } from '@/components/editorial/harmony/EditorialHero';
import { EditorialCard } from '@/components/editorial/harmony/EditorialCard';
import { NOVENAS } from '@/data/novenas';

const CATEGORY_LABEL: Record<string, string> = {
  'Jesus Cristo': 'Cristo',
  'Virgem Maria': 'Maria',
  'Santos': 'Santos',
  'Espírito Santo': 'Espírito',
};

const NovenasPage: React.FC = () => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NOVENAS;
    return NOVENAS.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.patron.toLowerCase().includes(q) ||
        n.category.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="w-full space-y-[var(--sp-xl)] pb-[var(--sp-xxl)]">
      <EditorialHero align="center" density="balanced">
        <EditorialHero.Eyebrow>Novenae</EditorialHero.Eyebrow>
        <EditorialHero.Title>Novenas</EditorialHero.Title>
        <EditorialHero.Subtitle>
          Nove dias de oração perseverante — no ritmo dos Apóstolos que esperavam com Maria o dom do Espírito.
        </EditorialHero.Subtitle>
      </EditorialHero>

      <div className="w-full relative group max-w-2xl mx-auto">
        <Icons.Search className="absolute left-[var(--sp-m)] top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar novena por título, padroeiro ou categoria..."
          aria-label="Buscar novena"
          className="w-full pl-[var(--sp-xl)] pr-[var(--sp-m)] py-[var(--sp-s)] rounded-[var(--radius)] border border-border bg-card text-foreground type-body focus:outline-none focus:ring-2 focus:ring-[hsl(var(--rule-gold))]/40 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--sp-m)]">
        {filtered.map((n) => (
          <EditorialCard
            key={n.slug}
            as="a"
            href={`/novenas/${n.slug}`}
            interactive
          >
            <EditorialCard.Eyebrow>{CATEGORY_LABEL[n.category] ?? n.category}</EditorialCard.Eyebrow>
            <EditorialCard.Title>{n.title}</EditorialCard.Title>
            <EditorialCard.Description>{n.summary}</EditorialCard.Description>
            <EditorialCard.CTA>
              <span className="inline-flex items-center gap-[var(--sp-xs)] type-rubrica text-primary">
                Começar novena
                <Icons.ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </EditorialCard.CTA>
          </EditorialCard>
        ))}
        {filtered.length === 0 && (
          <p className="type-caption text-muted-foreground text-center col-span-full py-[var(--sp-l)]">
            Nenhuma novena encontrada.
          </p>
        )}
      </div>

      <p className="type-caption text-muted-foreground text-center pt-[var(--sp-l)]">
        Todas as novenas seguem a estrutura tradicional: abertura, meditação do dia, oração final e súplica pela intenção.
        <br />
        Voltar para <Link to="/oracao" className="text-primary hover:underline">Livro de Orações</Link>.
      </p>
    </div>
  );
};

export default NovenasPage;
