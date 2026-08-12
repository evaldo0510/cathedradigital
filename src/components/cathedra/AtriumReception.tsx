/**
 * AtriumReception — Recepção personalizada do Átrio para usuários autenticados.
 *
 * Substitui o hero de marketing por uma "volta para casa":
 *  - Saudação nominal ("Paz e bem, {nome}")
 *  - Contexto litúrgico do dia
 *  - 6 widgets: Continuar oração, Continuar leitura, Santo do dia,
 *    Liturgia, Jornada, Catequese
 *  - Última atividade (item mais recente com timestamp humanizado)
 *  - Memória espiritual (streak, leituras, orações, jornadas)
 *
 * Regras:
 *  - Todos os tokens semânticos (nada hardcode).
 *  - Nunca renderiza para visitantes (AtriumHome decide o gate).
 */
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  BookOpen,
  Sun,
  Compass,
  GraduationCap,
  ScrollText,
  ArrowRight,
  Flame,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useResume, useLiturgyToday } from '@/modules/atrium/hooks';
import { useSpiritualMemory } from '@/hooks/useSpiritualMemory';
import type { ResumeItem } from '@/modules/atrium/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

const WEEKDAY_LABEL = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];

function firstName(name?: string | null): string {
  if (!name) return 'irmão';
  return name.trim().split(/\s+/)[0];
}

function humanizeRelative(iso?: string): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Date.now() - t;
  const day = 24 * 60 * 60 * 1000;
  if (diff < day && new Date(t).getDate() === new Date().getDate()) return 'Hoje';
  if (diff < 2 * day) return 'Ontem';
  const days = Math.floor(diff / day);
  if (days < 7) return `há ${days} dias`;
  if (days < 30) return `há ${Math.floor(days / 7)} sem.`;
  return new Date(t).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

const KIND_LABEL: Record<ResumeItem['kind'], string> = {
  reading: 'Leitura',
  study: 'Estudo',
  formation: 'Formação',
  lectio: 'Lectio Divina',
  note: 'Nota',
  prayer: 'Oração',
};

const KIND_ICON: Record<ResumeItem['kind'], React.ComponentType<{ className?: string }>> = {
  reading: BookOpen,
  study: ScrollText,
  formation: GraduationCap,
  lectio: BookOpen,
  note: BookOpen,
  prayer: Heart,
};

// ─── Subcomponentes ─────────────────────────────────────────────────────────

interface WidgetProps {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  title: string;
  subtitle?: string;
  progress?: number;
  to: string;
  cta?: string;
}

const WidgetCard: React.FC<WidgetProps> = ({
  Icon,
  label,
  title,
  subtitle,
  progress,
  to,
  cta = 'Continuar',
}) => (
  <Link
    to={to}
    className="group relative flex h-full flex-col justify-between rounded-premium border border-border bg-card p-spacing-md transition-all hover:border-secondary hover:shadow-lg focus-visible:outline-2 focus-visible:outline-secondary"
  >
    <div>
      <div className="flex items-center gap-spacing-xs text-secondary">
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span className="text-[11px] font-semibold uppercase tracking-widest">
          {label}
        </span>
      </div>
      <p className="mt-spacing-xs font-serif text-lg text-foreground leading-snug">
        {title}
      </p>
      {subtitle && (
        <p className="mt-spacing-3xs text-sm text-muted-foreground">{subtitle}</p>
      )}
      {typeof progress === 'number' && (
        <div className="mt-spacing-sm">
          <div className="h-1 w-full rounded-premium bg-muted">
            <div
              className="h-1 rounded-premium bg-secondary transition-all"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              aria-hidden="true"
            />
          </div>
          <span className="mt-spacing-3xs block text-[11px] text-muted-foreground">
            {progress}%
          </span>
        </div>
      )}
    </div>
    <div className="mt-spacing-md flex items-center gap-spacing-2xs text-xs font-semibold uppercase tracking-widest text-secondary group-hover:gap-spacing-xs transition-all">
      <span>{cta}</span>
      <ArrowRight className="h-3 w-3" aria-hidden="true" />
    </div>
  </Link>
);

// ─── Componente principal ───────────────────────────────────────────────────

const AtriumReception: React.FC = () => {
  const { user, profile } = useAuth();
  const resume = useResume();
  const liturgy = useLiturgyToday();
  const memory = useSpiritualMemory(
    user?.id,
    profile?.streak ?? 0,
    profile?.max_streak ?? 0,
  );

  const lastPrayer = resume.find((r) => r.kind === 'prayer');
  const lastReading = resume.find((r) => ['reading', 'study', 'lectio', 'note'].includes(r.kind));
  const lastActivity = resume[0] ?? null;
  const lastActivityIcon = lastActivity ? KIND_ICON[lastActivity.kind] : Sparkles;

  const name = firstName(profile?.name);
  const today = new Date();
  const weekday = WEEKDAY_LABEL[today.getDay()];
  const liturgicalPhrase = liturgy?.season
    ? `Hoje é ${weekday} da ${liturgy.season}.`
    : `Hoje é ${weekday}.`;

  const saintName = liturgy?.saintOfDay?.name;
  const saintPath = liturgy?.saintOfDay?.slug
    ? `/santos/${liturgy.saintOfDay.slug}`
    : '/santos';

  return (
    <section
      aria-label="Recepção personalizada"
      className="mb-spacing-xl animate-fade-in"
    >
      {/* Saudação */}
      <div className="mb-spacing-lg">
        <h2 className="mb-spacing-2xs text-xs font-semibold uppercase tracking-widest text-secondary">
          Sanctuarium Digital
        </h2>
        <h1 className="font-serif text-3xl md:text-5xl leading-tight text-foreground">
          Paz e bem, {name}.
        </h1>
        <p className="mt-spacing-xs text-base md:text-lg text-muted-foreground italic">
          {liturgicalPhrase}
        </p>
      </div>

      {/* Widgets — 6 caminhos */}
      <div className="grid grid-cols-1 gap-spacing-md sm:grid-cols-2 lg:grid-cols-3">
        <WidgetCard
          Icon={Heart}
          label="Oração"
          title={lastPrayer?.label ?? 'Iniciar Rosário'}
          subtitle={lastPrayer ? humanizeRelative(lastPrayer.lastActivityAt) : 'Nova oração'}
          progress={lastPrayer?.progressPct}
          to={lastPrayer?.targetPath ?? '/oracao/rosario'}
        />
        <WidgetCard
          Icon={BookOpen}
          label="Leitura"
          title={lastReading?.label ?? 'Abrir Bíblia'}
          subtitle={lastReading ? humanizeRelative(lastReading.lastActivityAt) : 'Sagrada Escritura'}
          progress={lastReading?.progressPct}
          to={lastReading?.targetPath ?? '/bible'}
        />
        <WidgetCard
          Icon={Compass}
          label="Santo do dia"
          title={saintName ?? 'Sanctorum'}
          subtitle={liturgy?.saintOfDay?.title ?? 'Vidas e testemunhos'}
          to={saintPath}
          cta="Conhecer"
        />
        <WidgetCard
          Icon={Sun}
          label="Liturgia"
          title="Missal e Ofício"
          subtitle={liturgy?.season ?? 'Próprio do dia'}
          to="/liturgia"
          cta="Rezar"
        />
        <WidgetCard
          Icon={GraduationCap}
          label="Jornada"
          title="Minha caminhada"
          subtitle="Trilhas de formação"
          to="/jornadas"
          cta="Retomar"
        />
        <WidgetCard
          Icon={ScrollText}
          label="Catequese"
          title="Continue sua formação"
          subtitle="Introdução aos Sacramentos"
          progress={67}
          to="/catechism"
        />
      </div>

      {/* Última atividade + Memória espiritual */}
      <div className="mt-spacing-lg grid grid-cols-1 gap-spacing-md lg:grid-cols-2">
        {lastActivity && (
          <article className="rounded-premium border border-border bg-card p-spacing-md">
            <h2 className="mb-spacing-2xs text-[11px] font-semibold uppercase tracking-widest text-secondary">
              Sua última atividade
            </h2>
            <div className="flex items-start gap-spacing-sm">
              <span className="mt-spacing-3xs shrink-0 rounded-premium bg-muted p-spacing-2xs text-secondary">
                {React.createElement(lastActivityIcon, { className: 'h-5 w-5' })}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {humanizeRelative(lastActivity.lastActivityAt)} · {KIND_LABEL[lastActivity.kind]}
                </p>
                <p className="mt-spacing-3xs font-serif text-lg text-foreground truncate">
                  {lastActivity.label}
                </p>
              </div>
              <Link
                to={lastActivity.targetPath}
                className="shrink-0 self-center rounded-premium border border-border px-spacing-sm py-spacing-2xs text-xs font-semibold uppercase tracking-widest text-secondary hover:bg-muted focus-visible:outline-2 focus-visible:outline-secondary"
              >
                Continuar
              </Link>
            </div>
          </article>
        )}

        <article className="rounded-premium border border-border bg-card p-spacing-md">
          <div className="mb-spacing-sm flex items-center gap-spacing-xs text-secondary">
            <Flame className="h-4 w-4" aria-hidden="true" />
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-secondary">
              Sua caminhada
            </h2>
          </div>
          <p className="font-serif text-3xl text-foreground leading-none">
            {memory.streakDays} {memory.streakDays === 1 ? 'dia' : 'dias'} consecutivos
          </p>
          {memory.maxStreak > memory.streakDays && (
            <p className="mt-spacing-3xs text-xs text-muted-foreground">
              Recorde: {memory.maxStreak} dias
            </p>
          )}
          <dl className="mt-spacing-md grid grid-cols-3 gap-spacing-sm">
            {[
              { label: 'Leituras', value: memory.readings },
              { label: 'Orações', value: memory.prayers },
              { label: 'Jornadas', value: memory.journeys },
            ].map((s) => (
              <div key={s.label}>
                <dt className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  {s.label}
                </dt>
                <dd className="font-serif text-xl text-foreground">
                  {memory.loading ? '·' : s.value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-spacing-md text-sm italic text-muted-foreground">
            Continue.
          </p>
        </article>
      </div>
    </section>
  );
};

export default AtriumReception;
