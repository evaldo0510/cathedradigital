/**
 * ContemplativeSettingsDialog — controla o ritmo do modo Contemplação:
 * duração da pausa entre blocos, timer de silêncio e velocidade das
 * transições fade. Preferências persistem via `useContemplativeRhythm`.
 */
import React from 'react';
import { Sliders, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import {
  DEFAULT_RHYTHM,
  RHYTHM_BOUNDS,
  useContemplativeRhythm,
} from '@/hooks/useContemplativeRhythm';

interface Props {
  triggerLabel?: string;
}

const ContemplativeSettingsDialog: React.FC<Props> = ({ triggerLabel = 'Ritmo' }) => {
  const { rhythm, setRhythm, reset } = useContemplativeRhythm();
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="pill"
          size="pill"
          aria-label="Ajustar ritmo contemplativo"
        >
          <Sliders aria-hidden />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-stitch-display text-xl">Ritmo contemplativo</DialogTitle>
          <DialogDescription>
            Ajuste o tempo entre blocos, o silêncio guiado e a velocidade das transições.
            As preferências ficam salvas no seu dispositivo.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          <Field
            id="pauseMs"
            label="Pausa entre blocos"
            value={rhythm.pauseMs}
            unit="ms"
            suffix={rhythm.pauseMs === 0 ? 'Sem pausa' : `${(rhythm.pauseMs / 1000).toFixed(1)}s`}
            bounds={RHYTHM_BOUNDS.pauseMs}
            onChange={(v) => setRhythm({ pauseMs: v })}
            help="Delay antes do próximo bloco aparecer, para respirar entre as orações."
          />
          <Field
            id="silenceSec"
            label="Timer de silêncio (Contemple)"
            value={rhythm.silenceSec}
            unit="s"
            suffix={rhythm.silenceSec === 0 ? 'Sem silêncio' : `${rhythm.silenceSec}s`}
            bounds={RHYTHM_BOUNDS.silenceSec}
            onChange={(v) => setRhythm({ silenceSec: v })}
            help="Duração sugerida do silêncio guiado antes de iniciar cada mistério."
          />
          <Field
            id="fadeMs"
            label="Velocidade da transição"
            value={rhythm.fadeMs}
            unit="ms"
            suffix={`${rhythm.fadeMs}ms`}
            bounds={RHYTHM_BOUNDS.fadeMs}
            onChange={(v) => setRhythm({ fadeMs: v })}
            help="Tempo do fade entre um bloco e outro no leitor."
          />
        </div>

        <DialogFooter className="mt-6 flex-row justify-between sm:justify-between">
          <Button type="button" variant="pill" size="pill" onClick={reset}>
            <RotateCcw aria-hidden />
            Restaurar padrão
          </Button>
          <Button type="button" variant="pill-active" size="pill" onClick={() => setOpen(false)}>
            Concluir
          </Button>
        </DialogFooter>
        <p className="mt-2 text-center font-stitch-body text-[11px] text-stitch-on-surface-variant">
          Padrão: {DEFAULT_RHYTHM.pauseMs}ms · {DEFAULT_RHYTHM.silenceSec}s · {DEFAULT_RHYTHM.fadeMs}ms
        </p>
      </DialogContent>
    </Dialog>
  );
};

interface FieldProps {
  id: string;
  label: string;
  value: number;
  unit: string;
  suffix: string;
  bounds: { min: number; max: number; step: number };
  onChange: (v: number) => void;
  help: string;
}

const Field: React.FC<FieldProps> = ({ id, label, value, suffix, bounds, onChange, help }) => (
  <div>
    <div className="flex items-baseline justify-between">
      <label
        htmlFor={id}
        className="font-stitch-body text-sm font-semibold text-stitch-on-surface"
      >
        {label}
      </label>
      <span
        className="font-stitch-body text-xs tabular-nums text-stitch-secondary"
        aria-live="polite"
      >
        {suffix}
      </span>
    </div>
    <Slider
      id={id}
      className="mt-3"
      min={bounds.min}
      max={bounds.max}
      step={bounds.step}
      value={[value]}
      onValueChange={([v]) => onChange(v)}
      aria-label={label}
    />
    <p className="mt-1.5 font-stitch-body text-[11px] text-stitch-on-surface-variant">{help}</p>
  </div>
);

export default ContemplativeSettingsDialog;
