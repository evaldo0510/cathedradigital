/**
 * LiturgyMeditationBlocks — 7 cards editoriais do Centro de Meditação Litúrgica:
 *   Tema, Chave de Leitura, Luz da Tradição (Padres/CIC/Magistério),
 *   Meditação Logos, Oração Final, Na História da Igreja, Ação do Dia.
 *
 * Consome uma `LiturgyMeditationRow` (vinda de `useLiturgyMeditation`).
 * Cada bloco degrada silenciosamente: se o campo estiver vazio, não renderiza.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import type {
  LiturgyMeditationRow,
  FatherCitation,
  CatechismCitation,
  MagisteriumCitation,
} from '@/hooks/useLiturgyMeditation';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
});

const KICKER =
  'text-premium-xs font-black uppercase tracking-[0.3em] text-secondary/70';
const SECTION =
  'premium-card p-spacing-xl space-y-spacing-md relative overflow-hidden';

// ── Loading (usado enquanto a edge function gera) ────────────────
export const LiturgyMeditationSkeleton: React.FC = () => (
  <div className={`${SECTION} animate-pulse`}>
    <div className="h-3 w-32 bg-muted rounded" />
    <div className="h-6 w-3/4 bg-muted rounded" />
    <div className="h-4 w-full bg-muted rounded" />
    <div className="h-4 w-5/6 bg-muted rounded" />
  </div>
);

interface FallbackNoticeProps {
  message?: string | null;
  code?: string;
  source?: 'local-cache' | 'local-builder' | 'previous-day';
  retryAt?: string;
  onRetry?: () => void | Promise<void>;
  isRetrying?: boolean;
}

function formatRelative(iso?: string): string | null {
  if (!iso) return null;
  const diffMs = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(diffMs)) return null;
  if (diffMs <= 0) return 'a qualquer momento';
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return 'em menos de 1 min';
  if (minutes < 60) return `em ~${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `em ~${hours}h`;
}

export const LiturgyMeditationFallbackNotice: React.FC<FallbackNoticeProps> = ({
  message,
  code,
  source,
  retryAt,
  onRetry,
  isRetrying,
}) => {
  const isCreditsExhausted = code === 'ai_credits_exhausted';
  const relative = formatRelative(retryAt);
  const sourceLabel =
    source === 'local-cache'
      ? 'Exibindo a meditação editorial anterior deste dia (cache local).'
      : source === 'previous-day'
      ? 'Exibindo a meditação editorial mais recente disponível offline.'
      : source === 'local-builder'
      ? 'Roteiro orante essencial construído a partir das leituras do dia.'
      : null;

  return (
    <motion.div
      {...fade(0.02)}
      className="border border-secondary/30 bg-secondary/5 rounded-[2rem] p-spacing-md flex items-start gap-spacing-sm"
      role="status"
      aria-live="polite"
      data-fallback-code={code ?? 'ai_unavailable'}
    >
      <Icons.Info className="w-spacing-md h-spacing-md text-secondary shrink-0 mt-spacing-3xs" />
      <div className="space-y-spacing-xs flex-1 min-w-0">
        <p className={KICKER}>
          {isCreditsExhausted ? 'Créditos de IA esgotados' : 'Meditação em modo essencial'}
        </p>
        <p className="text-premium-sm leading-relaxed text-muted-foreground">
          {message || 'O conteúdo editorial automático está temporariamente indisponível; mantivemos uma leitura orante local para não interromper a liturgia.'}
        </p>
        {sourceLabel && (
          <p className="text-premium-xs text-muted-foreground/80 italic">{sourceLabel}</p>
        )}
        {relative && (
          <p className="text-premium-xs font-medium text-muted-foreground">
            Próxima tentativa automática {relative}.
          </p>
        )}
        <div className="flex flex-wrap gap-spacing-xs pt-spacing-2xs">
          {onRetry && (
            <button
              type="button"
              onClick={() => { void onRetry(); }}
              disabled={isRetrying}
              className="inline-flex items-center gap-spacing-2xs px-spacing-md py-spacing-2xs rounded-premium-full bg-primary text-white text-premium-xs font-black uppercase tracking-widest hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              aria-label="Tentar gerar novamente a meditação editorial"
            >
              {isRetrying ? (
                <Icons.Loader2 className="w-spacing-sm h-spacing-sm animate-spin" />
              ) : (
                <Icons.RefreshCw className="w-spacing-sm h-spacing-sm" />
              )}
              <span>{isRetrying ? 'Tentando…' : 'Tentar novamente'}</span>
            </button>
          )}
          {isCreditsExhausted && (
            <a
              href="https://docs.lovable.dev/introduction/plans-and-credits"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-spacing-2xs px-spacing-md py-spacing-2xs rounded-premium-full bg-secondary/20 text-primary text-premium-xs font-black uppercase tracking-widest hover:bg-secondary/30 transition-colors"
              aria-label="Abrir Planos e créditos"
            >
              <Icons.Zap className="w-spacing-sm h-spacing-sm" />
              <span>Planos & créditos</span>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ── 1. Tema do dia ───────────────────────────────────────────────
export const LiturgyThemeCard: React.FC<{ theme: string }> = ({ theme }) => (
  <motion.div
    {...fade(0.05)}
    className="bg-secondary/5 border border-secondary/20 rounded-[2rem] p-spacing-xl text-center space-y-spacing-sm"
  >
    <Icons.Star className="w-spacing-lg h-spacing-lg text-secondary mx-auto" />
    <p className={KICKER}>Tema do Dia</p>
    <p className="text-premium-xl md:text-premium-2xl font-serif italic leading-relaxed text-primary">
      {theme}
    </p>
  </motion.div>
);

// ── 2. Chave de Leitura ──────────────────────────────────────────
export const LiturgyReadingKeyCard: React.FC<{ text: string }> = ({ text }) => (
  <motion.div {...fade(0.1)} className={SECTION}>
    <div className="flex items-center gap-spacing-sm">
      <div className="p-spacing-xs rounded-premium bg-primary/10 text-primary">
        <Icons.BookOpen className="w-spacing-md h-spacing-md" />
      </div>
      <p className={KICKER}>Chave de Leitura</p>
    </div>
    <p className="text-premium-md leading-relaxed text-foreground/90 font-serif">
      {text}
    </p>
  </motion.div>
);

// ── 3. Luz da Tradição ───────────────────────────────────────────
export const LiturgyTraditionCard: React.FC<{
  fathers: FatherCitation[];
  catechism: CatechismCitation[];
  magisterium: MagisteriumCitation[];
}> = ({ fathers, catechism, magisterium }) => {
  if (!fathers.length && !catechism.length && !magisterium.length) return null;
  return (
    <motion.div {...fade(0.15)} className={SECTION}>
      <div className="flex items-center gap-spacing-sm">
        <div className="p-spacing-xs rounded-premium bg-secondary/10 text-secondary">
          <Icons.Church className="w-spacing-md h-spacing-md" />
        </div>
        <p className={KICKER}>Luz da Tradição</p>
      </div>

      {fathers.length > 0 && (
        <div className="space-y-spacing-sm">
          <h4 className="text-premium-sm font-black uppercase tracking-widest text-primary">
            Padres da Igreja
          </h4>
          {fathers.map((f, i) => (
            <blockquote
              key={`f-${i}`}
              className="border-l-2 border-secondary/60 pl-spacing-md py-spacing-2xs"
            >
              <p className="font-serif italic text-foreground/90 leading-relaxed">
                “{f.quote}”
              </p>
              <cite className="not-italic text-premium-xs text-muted-foreground mt-spacing-2xs block">
                — <strong>{f.author}</strong>, {f.work} ({f.reference})
              </cite>
            </blockquote>
          ))}
        </div>
      )}

      {catechism.length > 0 && (
        <div className="space-y-spacing-sm">
          <h4 className="text-premium-sm font-black uppercase tracking-widest text-primary">
            Catecismo da Igreja Católica
          </h4>
          {catechism.map((c, i) => (
            <blockquote
              key={`c-${i}`}
              className="border-l-2 border-primary/40 pl-spacing-md py-spacing-2xs"
            >
              <p className="font-serif italic text-foreground/90 leading-relaxed">
                “{c.quote}”
              </p>
              <cite className="not-italic text-premium-xs text-muted-foreground mt-spacing-2xs block">
                — CIC {c.paragraph}
              </cite>
            </blockquote>
          ))}
        </div>
      )}

      {magisterium.length > 0 && (
        <div className="space-y-spacing-sm">
          <h4 className="text-premium-sm font-black uppercase tracking-widest text-primary">
            Magistério
          </h4>
          {magisterium.map((m, i) => (
            <blockquote
              key={`m-${i}`}
              className="border-l-2 border-muted-foreground/40 pl-spacing-md py-spacing-2xs"
            >
              <p className="font-serif italic text-foreground/90 leading-relaxed">
                “{m.quote}”
              </p>
              <cite className="not-italic text-premium-xs text-muted-foreground mt-spacing-2xs block">
                — <strong>{m.document}</strong>, {m.section} · {m.pope}
              </cite>
            </blockquote>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// ── 4. Meditação Logos ───────────────────────────────────────────
export const LiturgyLogosCard: React.FC<{
  logos: { observe: string; reflect: string; pray: string; live: string };
}> = ({ logos }) => {
  const steps: Array<[string, string, keyof typeof Icons]> = [
    ['Observe', logos.observe, 'Eye'],
    ['Reflita', logos.reflect, 'BookOpen'],
    ['Reze', logos.pray, 'Church'],
    ['Viva', logos.live, 'Zap'],
  ];
  return (
    <motion.div
      {...fade(0.2)}
      className="bg-primary text-white rounded-[2rem] p-spacing-xl space-y-spacing-lg shadow-premium-hover"
    >
      <div className="flex items-center gap-spacing-sm">
        <Icons.Sparkles className="w-spacing-lg h-spacing-lg text-secondary" />
        <p className="text-premium-xs font-black uppercase tracking-[0.4em] opacity-70">
          Meditação Logos
        </p>
      </div>
      <div className="grid gap-spacing-lg sm:grid-cols-2">
        {steps.map(([label, body, iconKey]) => {
          const Icon = Icons[iconKey] as React.ComponentType<{ className?: string }>;
          return (
            <div key={label} className="space-y-spacing-sm">
              <div className="flex items-center gap-spacing-xs">
                <Icon className="w-spacing-md h-spacing-md text-secondary" />
                <span className="text-premium-xs font-black uppercase tracking-widest text-secondary">
                  {label}
                </span>
              </div>
              <p className="font-serif italic leading-relaxed opacity-90">{body}</p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

// ── 5. Oração Final ──────────────────────────────────────────────
export const LiturgyFinalPrayerCard: React.FC<{ text: string }> = ({ text }) => (
  <motion.div
    {...fade(0.25)}
    className="bg-muted/30 border border-border rounded-[2rem] p-spacing-xl space-y-spacing-md text-center"
  >
    <Icons.Church className="w-spacing-lg h-spacing-lg text-secondary mx-auto" />
    <p className={KICKER}>Oração Final</p>
    <p className="text-premium-lg font-serif italic leading-relaxed text-primary max-w-2xl mx-auto whitespace-pre-line">
      {text}
    </p>
  </motion.div>
);

// ── 6. Na História da Igreja ─────────────────────────────────────
export const LiturgyChurchHistoryCard: React.FC<{
  history: NonNullable<LiturgyMeditationRow['church_history']>;
}> = ({ history }) => {
  const items = [
    { label: 'Santo', value: history.saint, icon: Icons.Star },
    { label: 'Concílio', value: history.council, icon: Icons.Church },
    { label: 'Papa', value: history.pope, icon: Icons.Crown },
    { label: 'Documento', value: history.document, icon: Icons.BookOpen },
  ].filter((i) => i.value);
  if (!items.length) return null;
  return (
    <motion.div {...fade(0.3)} className={SECTION}>
      <div className="flex items-center gap-spacing-sm">
        <div className="p-spacing-xs rounded-premium bg-secondary/10 text-secondary">
          <Icons.Clock className="w-spacing-md h-spacing-md" />
        </div>
        <p className={KICKER}>Na História da Igreja</p>
      </div>
      <div className="grid gap-spacing-md sm:grid-cols-2">
        {items.map(({ label, value, icon: Icon }) => {
          const IconComponent = Icon as React.ComponentType<{ className?: string }> | undefined;
          return (
            <div
              key={label}
              className="flex items-start gap-spacing-sm p-spacing-md rounded-premium bg-muted/40"
            >
              {IconComponent && (
                <IconComponent className="w-spacing-md h-spacing-md text-secondary shrink-0 mt-spacing-3xs" />
              )}
              <div>
                <p className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground">
                  {label}
                </p>
                <p className="text-premium-sm font-serif text-primary leading-snug">
                  {value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

// ── 7. Ação do Dia ───────────────────────────────────────────────
export const LiturgyActionCard: React.FC<{ text: string }> = ({ text }) => (
  <motion.div
    {...fade(0.35)}
    className="bg-secondary/10 border-2 border-secondary/40 rounded-[2rem] p-spacing-xl space-y-spacing-sm"
  >
    <div className="flex items-center gap-spacing-sm">
      <div className="p-spacing-xs rounded-premium bg-secondary/20 text-secondary">
        <Icons.Zap className="w-spacing-md h-spacing-md" />
      </div>
      <p className={KICKER}>Ação do Dia</p>
    </div>
    <p className="text-premium-lg font-serif leading-relaxed text-primary">{text}</p>
  </motion.div>
);
