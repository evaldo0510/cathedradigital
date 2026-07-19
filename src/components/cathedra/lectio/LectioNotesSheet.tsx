import React, { useEffect, useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Icons } from '@/constants';
import { STEPS, type Step } from './constants';
import { cn } from '@/lib/utils';

interface LectioNotesSheetProps {
  passage: string;
  notes: Record<string, string>;
  onNotesChange: (notes: Record<string, string>) => void;
  currentStep?: Step;
  onGoToStep?: (step: Step) => void;
  triggerClassName?: string;
  /** Renderizado como filho customizado — se omitido, mostra um Button padrão. */
  children?: React.ReactNode;
}

/**
 * Painel lateral com todas as notas do Modo Estudo (Lectio Divina).
 * - Edição rápida por etapa.
 * - Auto-persistido via o mesmo estado do pai (que usa useLectioProgress).
 * - Botão "Ir para esta etapa" quando aplicável.
 */
const LectioNotesSheet: React.FC<LectioNotesSheetProps> = ({
  passage,
  notes,
  onNotesChange,
  currentStep,
  onGoToStep,
  triggerClassName,
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(notes);

  // Sync interno quando abrir
  useEffect(() => {
    if (open) setDraft(notes);
  }, [open, notes]);

  const filledCount = useMemo(
    () => STEPS.filter((s) => (draft[s.id] || '').trim().length > 0).length,
    [draft],
  );

  const commit = (next: Record<string, string>) => {
    setDraft(next);
    onNotesChange(next);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children ?? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn('rounded-premium-full gap-spacing-2xs', triggerClassName)}
            aria-label={`Abrir anotações (${filledCount} de ${STEPS.length})`}
          >
            <Icons.PenTool className="w-4 h-4" />
            <span className="text-premium-xs font-black uppercase tracking-widest">
              Notas · {filledCount}/{STEPS.length}
            </span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col p-0">
        <SheetHeader className="px-spacing-lg pt-spacing-lg pb-spacing-md border-b border-border">
          <SheetTitle className="font-serif text-premium-2xl text-foreground">Minhas Anotações</SheetTitle>
          <SheetDescription className="text-premium-xs text-muted-foreground">
            {passage ? `Passagem: ${passage}` : 'Sem passagem selecionada'} · salvo automaticamente neste dispositivo.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-spacing-lg py-spacing-lg space-y-spacing-lg">
          {STEPS.map((step) => {
            const isCurrent = step.id === currentStep;
            const value = draft[step.id] || '';
            return (
              <div
                key={step.id}
                className={cn(
                  'rounded-[1.5rem] border p-spacing-md space-y-spacing-sm transition-colors',
                  isCurrent ? 'border-primary/40 bg-primary/[0.04]' : 'border-border bg-card',
                )}
              >
                <div className="flex items-center justify-between gap-spacing-sm">
                  <div className="flex items-center gap-spacing-sm min-w-0">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', step.color)}>
                      <step.icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-premium-xs font-black uppercase tracking-widest text-primary/70">
                        {step.latin}
                      </p>
                      <p className="font-serif text-premium-sm text-foreground truncate">{step.title}</p>
                    </div>
                  </div>
                  {onGoToStep && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-premium-full text-premium-xs"
                      onClick={() => {
                        onGoToStep(step.id);
                        setOpen(false);
                      }}
                      disabled={isCurrent}
                    >
                      {isCurrent ? 'Atual' : 'Ir'}
                    </Button>
                  )}
                </div>

                <textarea
                  value={value}
                  onChange={(e) => commit({ ...draft, [step.id]: e.target.value })}
                  rows={4}
                  placeholder={step.prompt}
                  aria-label={`Anotação para ${step.title}`}
                  className="w-full px-spacing-md py-spacing-sm rounded-[1rem] border border-border bg-background font-serif text-premium-base text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-primary/20"
                />

                <div className="flex items-center justify-between text-premium-xs text-muted-foreground">
                  <span>{value.length} caracteres</span>
                  {value && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto py-0 text-premium-xs text-muted-foreground hover:text-destructive"
                      onClick={() => commit({ ...draft, [step.id]: '' })}
                    >
                      Limpar
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-spacing-lg py-spacing-md border-t border-border bg-background/95 backdrop-blur">
          <Button
            type="button"
            className="w-full rounded-premium-full h-11 text-premium-xs font-black uppercase tracking-widest"
            onClick={() => setOpen(false)}
          >
            <Icons.Check className="w-4 h-4 mr-spacing-2xs" />
            Fechar e continuar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LectioNotesSheet;
