/**
 * PrayerModeSelector — alterna entre os três modos editoriais de oração:
 *   • Guiado         → passo a passo, avanço manual
 *   • Contemplativo  → tela limpa, sem UI (foco absoluto)
 *   • Automático     → timer configurável com auto-avanço
 *
 * Reutilizável em Rosário, Via Sacra, Liturgia das Horas, Ladainhas,
 * Missal e Orações. Somente experiência — nenhum conteúdo é alterado.
 *
 * P1 — Botões consolidados no Design System via `<Button variant="pill*">`.
 */
import React from 'react';
import { BookOpen, Circle, Timer, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type PrayerMode = 'guided' | 'contemplative' | 'auto';

interface Props {
  mode: PrayerMode;
  onChange: (mode: PrayerMode) => void;
  autoIntervalMs?: number;
  onIntervalChange?: (ms: number) => void;
}

const OPTIONS: Array<{ id: PrayerMode; label: string; icon: LucideIcon; hint: string }> = [
  { id: 'guided', label: 'Guiado', icon: BookOpen, hint: 'Passo a passo, avanço manual' },
  { id: 'contemplative', label: 'Contemplativo', icon: Circle, hint: 'Tela limpa, sem UI' },
  { id: 'auto', label: 'Automático', icon: Timer, hint: 'Avança sozinho' },
];

const INTERVAL_STEPS = [
  { ms: 15000, label: '15s' },
  { ms: 30000, label: '30s' },
  { ms: 45000, label: '45s' },
  { ms: 60000, label: '1min' },
  { ms: 90000, label: '1min30' },
  { ms: 120000, label: '2min' },
];

export const PrayerModeSelector: React.FC<Props> = ({
  mode,
  onChange,
  autoIntervalMs = 30000,
  onIntervalChange,
}) => {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        role="tablist"
        aria-label="Modo de oração"
        className="inline-flex rounded-full border border-stitch-outline-variant/40 bg-stitch-surface-container-lowest p-1"
      >
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = mode === opt.id;
          return (
            <Button
              key={opt.id}
              role="tab"
              type="button"
              variant={active ? 'pill-active' : 'pill'}
              size="pill"
              aria-selected={active}
              aria-label={`${opt.label} — ${opt.hint}`}
              onClick={() => onChange(opt.id)}
              className="border-transparent"
            >
              <Icon aria-hidden />
              {opt.label}
            </Button>
          );
        })}
      </div>

      {mode === 'auto' && onIntervalChange && (
        <div className="flex items-center gap-2 font-stitch-body text-[11px] uppercase tracking-widest text-stitch-on-surface-variant">
          <label htmlFor="prayer-auto-interval">Ritmo</label>
          <select
            id="prayer-auto-interval"
            value={autoIntervalMs}
            onChange={(e) => onIntervalChange(Number(e.target.value))}
            className="rounded-full border border-stitch-outline-variant/40 bg-transparent px-2 py-1 text-xs uppercase tracking-widest text-stitch-on-surface focus:outline-none focus:ring-1 focus:ring-stitch-secondary"
          >
            {INTERVAL_STEPS.map((step) => (
              <option key={step.ms} value={step.ms}>
                {step.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default PrayerModeSelector;
