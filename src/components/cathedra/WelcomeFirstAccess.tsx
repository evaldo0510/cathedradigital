/**
 * Tela "Bem-vindo à Cathedra" — exibida apenas no primeiro acesso do usuário.
 *
 * Overlay não bloqueante que apresenta os 5 caminhos canônicos: Formação,
 * Oração, Bíblia, Liturgia e Catequese. Marca a exibição por usuário para
 * nunca reaparecer.
 */
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Heart, BookOpen, Sun, ScrollText, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { hasSeenFirstAccess, markFirstAccessSeen } from '@/lib/firstAccess';
import { trackEvent } from '@/lib/analytics';

interface Option {
  key: string;
  label: string;
  latin: string;
  hint: string;
  to: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const OPTIONS: Option[] = [
  { key: 'formacao', label: 'Formação', latin: 'Formatio', hint: 'Trilhas guiadas', to: '/jornadas', Icon: GraduationCap },
  { key: 'oracao', label: 'Oração', latin: 'Oratio', hint: 'Rosário, Ofício, Lectio', to: '/oracao', Icon: Heart },
  { key: 'biblia', label: 'Bíblia', latin: 'Scriptura', hint: 'Sagrada Escritura', to: '/bible', Icon: BookOpen },
  { key: 'liturgia', label: 'Liturgia', latin: 'Liturgia', hint: 'Missal e Horas', to: '/liturgia', Icon: Sun },
  { key: 'catequese', label: 'Catequese', latin: 'Catechesis', hint: 'Catecismo da Igreja', to: '/catechism', Icon: ScrollText },
];

const WelcomeFirstAccess: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  useEffect(() => {
    if (loading || !user) return;
    if (hasSeenFirstAccess(user.id)) return;
    setOpen(true);
    trackEvent('first_access_view', { userId: user.id });
  }, [loading, user]);

  const dismiss = React.useCallback(
    (reason: 'close' | 'completed', target?: string) => {
      if (user) markFirstAccessSeen(user.id);
      setOpen(false);
      trackEvent(reason === 'completed' ? 'first_access_completed' : 'first_access_dismissed', { target });
      if (target) navigate(target);
    },
    [user, navigate]
  );

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-first-access-title"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-background/90 backdrop-blur-sm p-spacing-md"
    >
      <div className="relative w-full max-w-2xl rounded-premium border border-border bg-card p-spacing-xl shadow-2xl">
        <button
          type="button"
          aria-label="Fechar boas-vindas"
          onClick={() => dismiss('close')}
          className="absolute top-spacing-sm right-spacing-sm p-spacing-2xs min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-premium hover:bg-muted focus-visible:outline-2 focus-visible:outline-secondary"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <h2 className="text-xs uppercase tracking-widest text-secondary mb-spacing-2xs">
          Sanctuarium Digital
        </h2>
        <h1
          id="welcome-first-access-title"
          className="font-serif text-3xl md:text-4xl text-foreground mb-spacing-xs"
        >
          Bem-vindo à Cathedra
        </h1>
        <p className="text-muted-foreground mb-spacing-lg">
          Escolha por onde deseja começar. Você poderá navegar livremente entre todos os caminhos depois.
        </p>

        <ul className="grid gap-spacing-sm sm:grid-cols-2">
          {OPTIONS.map((opt) => (
            <li key={opt.key}>
              <button
                type="button"
                onClick={() => dismiss('completed', opt.to)}
                className="w-full flex items-start gap-spacing-sm rounded-premium border border-border p-spacing-sm text-left transition-colors hover:border-secondary hover:bg-muted focus-visible:outline-2 focus-visible:outline-secondary"
              >
                <span className="mt-spacing-3xs shrink-0 rounded-premium bg-muted p-spacing-2xs text-secondary">
                  <opt.Icon className="w-5 h-5" aria-hidden="true" />
                </span>
                <span className="flex-1">
                  <h2 className="block font-serif text-lg text-foreground">
                    {opt.label}
                  </h2>
                  <h3 className="block text-xs uppercase tracking-widest text-secondary">
                    {opt.latin}
                  </h3>
                  <span className="block text-sm text-muted-foreground mt-spacing-3xs">
                    {opt.hint}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-spacing-lg flex justify-end">
          <button
            type="button"
            onClick={() => dismiss('close')}
            className="inline-flex min-h-[44px] items-center text-sm text-muted-foreground hover:text-foreground"
          >
            Explorar por conta própria
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeFirstAccess;
