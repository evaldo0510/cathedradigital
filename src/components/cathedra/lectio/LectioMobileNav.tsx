import React from 'react';
import { cn } from '@/lib/utils';
import { STEPS, type Step } from './constants';

interface LectioMobileNavProps {
  currentStep: Step | 'intro' | 'conclusio';
  onStepChange: (step: Step) => void;
  /** Etapas cujo texto ainda não foi carregado — desabilita a navegação. */
  disabled?: boolean;
  className?: string;
}

/**
 * MobileBottomNav dedicado ao Modo Estudo: mostra as 5 etapas da Lectio,
 * destaca a atual e desabilita ações inconsistentes (intro/conclusio ou loading).
 * Aparece apenas em `< md`.
 */
export const LectioMobileNav: React.FC<LectioMobileNavProps> = ({
  currentStep,
  onStepChange,
  disabled = false,
  className,
}) => {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <nav
      aria-label="Etapas da Lectio Divina"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 md:hidden',
        'flex items-stretch justify-around',
        'border-t border-stitch-outline-variant/60',
        'bg-stitch-surface/95 backdrop-blur-md',
        className,
      )}
      style={{
        paddingBottom: 'var(--stitch-mobile-safe-bottom)',
        minHeight: `calc(var(--stitch-mobile-bottomnav-h) + var(--stitch-mobile-safe-bottom))`,
      }}
    >
      {STEPS.map((step, i) => {
        const isActive = step.id === currentStep;
        const isPast = currentIndex > -1 && i < currentIndex;
        const Icon = step.icon;
        const isDisabled = disabled || currentStep === 'conclusio';
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => !isDisabled && onStepChange(step.id)}
            disabled={isDisabled}
            aria-current={isActive ? 'step' : undefined}
            aria-label={`${step.title} — ${step.latin}${isActive ? ' (etapa atual)' : ''}`}
            className={cn(
              'group flex flex-1 flex-col items-center justify-center gap-1 px-1 py-2 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stitch-secondary',
              isDisabled && 'opacity-40 cursor-not-allowed',
            )}
            style={{ minHeight: 'var(--stitch-mobile-touch-min)' }}
          >
            <span
              className={cn(
                'inline-flex items-center justify-center rounded-full h-8 w-8 transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : isPast
                  ? 'bg-primary/15 text-primary'
                  : 'text-stitch-on-surface-variant group-hover:text-stitch-primary',
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={isActive ? 2.5 : 1.75} aria-hidden="true" />
            </span>
            <span
              className={cn(
                'text-[10px] font-bold uppercase tracking-[0.08em]',
                isActive ? 'text-primary' : 'text-stitch-on-surface-variant',
              )}
            >
              {step.latin}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default LectioMobileNav;
