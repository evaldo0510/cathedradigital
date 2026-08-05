/**
 * AcervoContinueReadingPanel — "Onde parei?" no topo do Acervo.
 *
 * Sprint Acervo · Onda 3. Puramente composicional: usa `useReadingMarks`
 * (fonte única de progresso) e `useFavorites` (contador global). Nenhum
 * fetch novo, nenhuma tabela nova.
 *
 * Estrutura:
 *   ┌─────────────────────────────────────────────────────┐
 *   │  Continue lendo                                     │
 *   │  [ícono]  Última obra aberta · Cap. X               │
 *   │           Retomar →                                 │
 *   ├─────────────────────────────────────────────────────┤
 *   │  Em andamento · N     Concluídas · N   Favoritos · N│
 *   └─────────────────────────────────────────────────────┘
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useReadingMarks } from '@/hooks/useReadingMarks';
import { useFavorites } from '@/hooks/useFavorites';
import { Icons } from '../../constants';

const CONTENT_LABEL: Record<string, string> = {
  bible: 'Escrituras',
  catechism: 'Catecismo',
  magisterium: 'Magistério',
  saint_work: 'Escritos',
  patristic: 'Patrística',
  doctor: 'Doutores',
  classic: 'Clássicos',
  prayer: 'Oração',
  liturgy: 'Liturgia',
  journey: 'Jornada',
};

const AcervoContinueReadingPanel: React.FC = () => {
  const { user } = useAuth();
  const { marks, loading } = useReadingMarks();
  const { favorites } = useFavorites();

  const stats = useMemo(() => {
    const lastRead = marks.find((m) => m.is_last_read) ?? marks[0] ?? null;

    // "Em andamento" = obras distintas com mark, sem posição concluída (<95%)
    // "Concluídas" = obras distintas com pelo menos um mark com position >= 95
    const byWork = new Map<string, { maxPos: number }>();
    for (const m of marks) {
      const key = `${m.content_type}::${m.content_id}`;
      const cur = byWork.get(key) ?? { maxPos: 0 };
      cur.maxPos = Math.max(cur.maxPos, m.position ?? 0);
      byWork.set(key, cur);
    }
    let inProgress = 0;
    let completed = 0;
    byWork.forEach((v) => {
      if (v.maxPos >= 95) completed += 1;
      else inProgress += 1;
    });

    return { lastRead, inProgress, completed };
  }, [marks]);

  // Sem sessão OU sem marks → não polui a home
  if (!user || loading) return null;
  if (!stats.lastRead && stats.inProgress === 0 && stats.completed === 0 && favorites.length === 0) {
    return null;
  }

  const { lastRead, inProgress, completed } = stats;
  const contentLabel = lastRead ? CONTENT_LABEL[lastRead.content_type] ?? 'Leitura' : null;

  return (
    <section
      aria-labelledby="continue-reading-heading"
      className="rounded-2xl border border-primary/15 bg-card/60 backdrop-blur-sm overflow-hidden shadow-sm"
    >
      {/* Cabeçalho + última obra */}
      <div className="p-spacing-md md:p-spacing-lg space-y-spacing-md">
        <div className="flex items-baseline justify-between gap-spacing-sm">
          <h2
            id="continue-reading-heading"
            className="text-premium-small font-black uppercase tracking-[0.2em] text-primary"
          >
            Continue de onde você parou
          </h2>
          <Link
            to="/conta/leituras"
            className="text-premium-xs text-muted-foreground hover:text-primary underline underline-offset-4"
          >
            Ver histórico →
          </Link>
        </div>

        {lastRead ? (
          <Link
            to={lastRead.url ?? '/acervo/lista'}
            className="group flex items-center gap-spacing-md rounded-xl p-spacing-sm -m-spacing-sm hover:bg-primary/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`Retomar ${lastRead.label ?? 'leitura'}`}
          >
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icons.BookOpen className="w-5 h-5 md:w-6 md:h-6 text-primary" aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              {contentLabel && (
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/60">
                  {contentLabel}
                  {typeof lastRead.chapter === 'number' && ` · Cap. ${lastRead.chapter}`}
                </p>
              )}
              <p className="font-serif text-premium-md md:text-premium-lg text-foreground truncate">
                {lastRead.label ?? 'Leitura salva'}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-spacing-xs text-primary font-medium text-premium-sm">
              Retomar
              <Icons.ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden />
            </div>
            <Icons.ArrowRight className="sm:hidden w-5 h-5 text-primary flex-shrink-0" aria-hidden />
          </Link>
        ) : (
          <p className="text-muted-foreground italic font-serif text-premium-sm">
            Abra qualquer obra do acervo e o Cathedra guarda seu ponto para retomar aqui.
          </p>
        )}
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 border-t border-border/60 divide-x divide-border/60 bg-muted/20">
        <MetricCell
          label="Em andamento"
          value={inProgress}
          icon={Icons.Clock}
          to="/conta/leituras"
        />
        <MetricCell
          label="Concluídas"
          value={completed}
          icon={Icons.Check}
          to="/conta/leituras?filter=completed"
        />
        <MetricCell
          label="Favoritos"
          value={favorites.length}
          icon={Icons.Star}
          to="/conta/favoritos"
        />
      </div>
    </section>
  );
};

interface MetricCellProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
}

const MetricCell: React.FC<MetricCellProps> = ({ label, value, icon: Icon, to }) => (
  <Link
    to={to}
    className="flex flex-col items-center gap-1 py-spacing-md hover:bg-primary/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
  >
    <Icon className="w-4 h-4 text-primary/60" aria-hidden />
    <span className="text-premium-xl md:text-premium-2xl font-serif font-semibold text-foreground leading-none">
      {value}
    </span>
    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
      {label}
    </span>
  </Link>
);

export default AcervoContinueReadingPanel;
