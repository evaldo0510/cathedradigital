import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, X } from 'lucide-react';
import { useBibleReadGate } from '@/hooks/useBibleReadGate';
import { useIsAdmin } from '@/hooks/useIsAdmin';

/**
 * Banner fixo no topo do /bible quando o gate está bloqueando por dados
 * incompletos (missing_book / missing_chapter). Em vez de esconder a rota
 * inteira, informa cobertura parcial e mantém a navegação para os livros
 * que já existem no banco. Admin não vê o banner (já vê o painel).
 */
export const BiblePartialCoverageBanner: React.FC = () => {
  const { gate, isLoading } = useBibleReadGate();
  const { isAdmin, isLoading: roleLoading } = useIsAdmin();
  const [dismissed, setDismissed] = React.useState(false);

  if (isLoading || roleLoading) return null;
  if (isAdmin) return null;
  if (!gate?.blocked) return null;
  if (dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-40 border-b border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/40"
    >
      <div className="container mx-auto flex items-start gap-3 px-4 py-2 text-sm text-amber-900 dark:text-amber-100">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <div className="flex-1">
          <p className="font-medium">Cobertura parcial da Bíblia</p>
          <p className="text-xs opacity-90">
            Estamos completando o cânon (73 livros). Você pode ler os livros já
            disponíveis; os demais aparecerão conforme forem importados.
          </p>
        </div>
        <Link
          to="/catechism"
          className="hidden shrink-0 rounded border border-amber-300 px-2 py-1 text-xs font-medium hover:bg-amber-100 sm:inline-block dark:border-amber-800 dark:hover:bg-amber-900/40"
        >
          Ler o Catecismo
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Fechar aviso de cobertura parcial"
          className="shrink-0 rounded p-1 hover:bg-amber-100 dark:hover:bg-amber-900/40"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
};

export default BiblePartialCoverageBanner;
