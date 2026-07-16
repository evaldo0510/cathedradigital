import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useBibleReadGate } from '@/hooks/useBibleReadGate';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Button } from '@/components/ui/button';
import BiblePartialCoverageBanner from './BiblePartialCoverageBanner';

/**
 * Gate de leitura da rota /bible.
 *
 * Regra:
 *  - Admin sempre atravessa.
 *  - status='error' (falha real da diagnose) → manutenção total.
 *  - blocked por dados incompletos (missing_book / missing_chapter) →
 *    permite navegação nos livros existentes com banner fixo de cobertura
 *    parcial (BiblePartialCoverageBanner). Não mascara a rota.
 *  - Sem bloqueio → passa direto.
 */
export const BibleReadGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { gate, isLoading } = useBibleReadGate();
  const { isAdmin, isLoading: roleLoading } = useIsAdmin();

  if (isLoading || roleLoading) return <>{children}</>;
  if (isAdmin) return <>{children}</>;

  // Manutenção total apenas quando a diagnose FALHOU (erro real, não dados parciais).
  if (gate?.blocked && gate.status === 'error') {
    const lastRun = gate.last_run_at ? new Date(gate.last_run_at).toLocaleString('pt-BR') : '—';
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-lg border border-border bg-card text-card-foreground p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-6 w-6 text-amber-600 shrink-0" aria-hidden />
            <div className="space-y-2">
              <h1 className="text-lg font-serif font-semibold">Bíblia em manutenção</h1>
              <p className="text-sm text-muted-foreground">
                A verificação de integridade falhou. Estamos investigando.
              </p>
              <div className="text-xs text-muted-foreground border-t border-border pt-2 mt-2 space-y-0.5">
                <div><span className="font-medium">Status:</span> {gate.status}</div>
                <div><span className="font-medium">Última verificação:</span> {lastRun}</div>
                <div><span className="font-medium">Pendências:</span> {gate.blocking_findings}</div>
              </div>
              <div className="pt-3 flex gap-2">
                <Button asChild variant="outline" size="sm"><Link to="/">Voltar ao início</Link></Button>
                <Button asChild variant="ghost" size="sm"><Link to="/catechism">Ler o Catecismo</Link></Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Cobertura parcial: banner + navegação segura para livros existentes.
  return (
    <>
      <BiblePartialCoverageBanner />
      {children}
    </>
  );
};

export default BibleReadGate;
