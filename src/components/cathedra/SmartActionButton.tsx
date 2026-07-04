import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Icons } from '@/constants';
import { AppRoute } from '@/types';
import { cn } from '@/lib/utils';

interface ShortcutTile {
  key: string;
  label: string;
  description: string;
  icon: any;
  onSelect: (navigate: ReturnType<typeof useNavigate>) => void;
}

const SHORTCUTS: ShortcutTile[] = [
  {
    key: 'buscar',
    label: 'Buscar',
    description: 'Bíblia, Catecismo, Santos',
    icon: Icons.Search,
    onSelect: () => {
      // Usa o evento oficial exposto pelo CommandCenter (evita conflito com outros atalhos)
      window.dispatchEvent(new CustomEvent('open-command-center'));
    },
  },
  {
    key: 'oracao',
    label: 'Oração',
    description: 'Entrar em silêncio',
    icon: Icons.Sparkles,
    onSelect: (navigate) => navigate(AppRoute.ORACAO),
  },
  {
    key: 'diario',
    label: 'Diário',
    description: 'Registrar reflexão',
    icon: Icons.PenLine,
    onSelect: (navigate) => navigate(AppRoute.DIARIO),
  },
  {
    key: 'favoritos',
    label: 'Favoritos',
    description: 'Itens salvos',
    icon: Icons.Heart,
    onSelect: (navigate) => navigate(AppRoute.FAVORITES),
  },
];

export const SmartActionButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const fallbackTimerRef = useRef<number | null>(null);

  // Limpa loading quando a rota muda (navegação concluída)
  useEffect(() => {
    if (pendingKey) setPendingKey(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Fallback: se por algum motivo a rota não mudar em 1s, libera o botão
  useEffect(() => {
    if (!pendingKey) return;
    fallbackTimerRef.current = window.setTimeout(() => setPendingKey(null), 1000);
    return () => {
      if (fallbackTimerRef.current) window.clearTimeout(fallbackTimerRef.current);
    };
  }, [pendingKey]);

  const handleSelect = useCallback(
    (shortcut: ShortcutTile) => {
      setPendingKey(shortcut.key);
      setOpen(false);
      // Aguarda o fechamento do Sheet antes de disparar a ação
      setTimeout(() => shortcut.onSelect(navigate), 180);
    },
    [navigate],
  );

  const isLoading = pendingKey !== null;

  return (
    <>
      <div
        className="absolute left-1/2 -translate-x-1/2 -top-spacing-2xl z-20 pointer-events-none"
        aria-hidden="false"
      >
        <motion.button
          type="button"
          onClick={() => !isLoading && setOpen(true)}
          aria-label={isLoading ? 'Carregando' : 'Abrir atalhos rápidos'}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-busy={isLoading || undefined}
          disabled={isLoading}
          data-testid="smart-action-button"
          data-loading={isLoading || undefined}
          whileTap={shouldReduceMotion || isLoading ? undefined : { scale: 0.94 }}
          whileHover={shouldReduceMotion || isLoading ? undefined : { y: -2 }}
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          className={cn(
            'pointer-events-auto relative flex items-center justify-center',
            'w-[56px] h-[56px] rounded-premium-full',
            'bg-primary text-primary-foreground',
            'shadow-[0_10px_30px_-8px_hsl(var(--primary)/0.55)]',
            'border border-primary/20',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'tap-highlight-transparent touch-manipulation',
            'disabled:cursor-wait',
          )}
        >
          {isLoading ? (
            <Icons.Loader
              size={22}
              strokeWidth={1.8}
              className="animate-spin"
              aria-hidden="true"
            />
          ) : (
            <Icons.Sparkles size={22} strokeWidth={1.6} aria-hidden="true" />
          )}
          <span className="sr-only">
            {isLoading ? 'Carregando' : 'Atalhos rápidos'}
          </span>
        </motion.button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-[2rem] border-primary/10 pb-[env(safe-area-inset-bottom,20px)]"
        >
          <SheetHeader className="text-left">
            <SheetTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-primary/60">
              Atalhos rápidos
            </SheetTitle>
            <SheetDescription className="sr-only">
              Escolha um atalho: buscar, oração, diário ou favoritos.
            </SheetDescription>
          </SheetHeader>

          <div className="grid grid-cols-2 gap-spacing-sm mt-spacing-lg">
            {SHORTCUTS.map((s) => {
              const Icon = s.icon;
              const tileLoading = pendingKey === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => handleSelect(s)}
                  disabled={isLoading}
                  aria-busy={tileLoading || undefined}
                  data-testid={`smart-action-${s.key}`}
                  className={cn(
                    'flex flex-col items-start gap-spacing-xs p-spacing-md text-left',
                    'rounded-[1.25rem] border border-primary/10 bg-card',
                    'active:scale-[0.98] transition-transform duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
                    'min-h-[88px]',
                    'disabled:opacity-60 disabled:cursor-wait',
                  )}
                >
                  <span className="flex items-center justify-center w-spacing-2xl h-spacing-2xl rounded-premium-full bg-primary/10 text-primary">
                    {tileLoading ? (
                      <Icons.Loader size={20} strokeWidth={1.8} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
                    )}
                  </span>
                  <span className="text-[12px] font-bold text-foreground leading-tight">
                    {s.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {s.description}
                  </span>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default SmartActionButton;
