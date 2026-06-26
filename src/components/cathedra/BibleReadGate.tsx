import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { useBibleReadGate } from '@/hooks/useBibleReadGate';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Button } from '@/components/ui/button';

/**
 * Gate de leitura: bloqueia a rota /bible quando a última diagnose canônica
 * reporta findings bloqueantes (missing_book / missing_chapter / empty_chapter)
 * ou status='error'. Admins atravessam o gate para diagnosticar.
 */
export const BibleReadGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { gate, isLoading } = useBibleReadGate();
  const { isAdmin, isLoading: roleLoading } = useIsAdmin();

  // Fail-open: se a checagem ainda não retornou, libera (UX > paranoia).
  // Admin SEMPRE atravessa.
  if (isLoading || roleLoading) return <>{children}</>;
  if (!gate?.blocked || isAdmin) return <>{children}</>;

  const lastRun = gate.last_run_at ? new Date(gate.last_run_at).toLocaleString('pt-BR') : '—';

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-lg border border-border bg-card text-card-foreground p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-6 w-6 text-amber-600 shrink-0" aria-hidden />
          <div className="space-y-2">
            <h1 className="text-lg font-serif font-semibold">
              Bíblia em manutenção
            </h1>
            <p className="text-sm text-muted-foreground">
              A verificação de integridade dos 73 livros detectou pendências.
              Estamos restaurando a cobertura completa para garantir que nenhum
              capítulo fique indisponível.
            </p>
            <div className="text-xs text-muted-foreground border-t border-border pt-2 mt-2 space-y-0.5">
              <div><span className="font-medium">Status:</span> {gate.status}</div>
              <div><span className="font-medium">Última verificação:</span> {lastRun}</div>
              <div><span className="font-medium">Pendências:</span> {gate.blocking_findings}</div>
            </div>
            <div className="pt-3 flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/">Voltar ao início</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/catechism">Ler o Catecismo</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BibleReadGate;
