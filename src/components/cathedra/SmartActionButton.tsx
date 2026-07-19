import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

interface SmartActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Sheet controlado dos atalhos rápidos. Sem gatilho visual próprio —
 * quem controla o `open` é o consumidor (ex.: item da bottom nav).
 */
export const SmartActionSheet: React.FC<SmartActionSheetProps> = ({ open, onOpenChange }) => {
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const fallbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (pendingKey) setPendingKey(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    if (!pendingKey) return;
    fallbackTimerRef.current = window.setTimeout(() => setPendingKey(null), 1000);
    return () => {
      if (fallbackTimerRef.current) window.clearTimeout(fallbackTimerRef.current);
    };
  }, [pendingKey]);

  const isLoading = pendingKey !== null;

  const handleSelect = useCallback(
    (shortcut: ShortcutTile) => {
      setPendingKey(shortcut.key);
      onOpenChange(false);
      setTimeout(() => shortcut.onSelect(navigate), 180);
    },
    [navigate, onOpenChange],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
  );
};

/**
 * Wrapper legado: mantém o FAB flutuante para compatibilidade com qualquer
 * consumidor externo. A BottomNav não usa mais — usa <SmartActionSheet /> direto.
 */
export const SmartActionButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  return <SmartActionSheet open={open} onOpenChange={setOpen} />;
};

export default SmartActionButton;
